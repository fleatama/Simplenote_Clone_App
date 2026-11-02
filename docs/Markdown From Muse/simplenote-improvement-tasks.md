# Simplenoteクローン 改善タスク指示書（コーディングエージェント向け）

作成日：2026-11-02
用途：このファイル全体をコーディングエージェントへの指示として渡すための文書。タスクAが新規機能、タスクBが過去のコードレビュー（2026-10-31実施）の指摘事項。

## 対象

- リポジトリ：github.com/fleatama/Simplenote_Clone_App
- デプロイ先：https://simplenote-clone-app.vercel.app/
- 技術スタック：Next.js（App Router）／React／TypeScript、NextAuth v5（Googleログイン）、Upstash Redis、Bootstrap、Vitest
- 本書の行番号・現状確認は、基準コミット `ca6626b`（2026-10-23）時点のコードで確認したもの（2026-11-02再確認）。作業開始時点でずれている場合は、内容で判断すること

## 全体ルール

- 既存の挙動を壊さないこと。特に、ユーザーごとのデータ分離、自動保存、Undo/Redo（履歴最大50件）、タグ絞り込み、Markdownプレビュー（source／split／readingの3モード）、ZIPエクスポートは現状維持
- 変更はタスクごとに小さく分け、タスク単位でコミットすること
- 各タスクの完了条件：`npx vitest run` が全件パス、`npx tsc --noEmit` でエラーなし、`npm run build` が成功

---

## タスクA：ノートのソート機能（新規）

### 現状

- `app/api/notes/route.ts` の GET は、取得時にサーバー側で `updatedAt` の新しい順に並べて返している
- `app/page.tsx` では、タグ絞り込み（`filteredNotes`）だけを行い、その順序のまま `app/components/NoteList.tsx` に渡している
- Note型（`app/page.tsx` で export）：`id / content / createdAt / updatedAt / metadata { tags, aliases}`
- **タイトルは独立した項目ではない**。表示タイトルは `utils/helpers.ts` の `getNoteTitle(content)` が本文の最初の非空行から生成している（Markdown見出し記号の除去、30文字で切り捨て＋「...」付き）

### 要件

一覧の並び替えを、次の4種類から選べるようにする：

1. 更新日時：新しい順（デフォルト。現状の表示と同じ）
2. 更新日時：古い順
3. タイトル：昇順
4. タイトル：降順

### 実装方針

- 全件取得済みの作りなので、並べ替えはクライアント側でよい（API変更は不要）
- `app/page.tsx` に並び替えの状態を持たせ、タグ絞り込みの後に適用する。状態は例えば `type SortMode = "updatedDesc" | "updatedAsc" | "titleAsc" | "titleDesc"`
- 並べ替え時は必ず配列をコピーしてから `sort` する（例：`[...filteredNotes].sort(...)`）。元の配列を直接書き換えないこと
- 並べ替えロジックは `utils/helpers.ts` に純粋関数 `sortNotes(notes, mode)` として切り出し、`utils/helpers.test.ts` にテストを追加する（既存のテストファイルのパターンに合わせる）
- 選択した並び順は `localStorage` に保存し、再訪時に復元する（キー名の例：`note-sort-mode`）
- UIは一覧上部に `<select>`（Bootstrap の `form-select form-select-sm` 等）を置く想定。ラベルは日本語で「更新日時（新しい順）」のように分かりやすく

### 比較の仕様

- 日時：`new Date(a.updatedAt).getTime()` の差で比較
- タイトル：`getNoteTitle()` の結果を `localeCompare(..., "ja")` で比較
- 注意点1（30文字切り捨て）：`getNoteTitle` はタイトルを30文字で切るため、長いタイトル同士では先頭30文字が同じ時点で互角になる。これを許容するか、切り捨てないタイトル取得を別途用意するかは、どちらでもよいが、選んだ方針をコードコメントかPR説明に明記すること
- 注意点2（空タイトル）：タイトルが空（NoteList上は "Untitled" 表示）のノートは、昇順・降順のどちらでも**末尾**に固定すること
- 注意点3（同順位の安定化）：タイトルが同値の場合は第2キーとして `updatedAt` の新しい順で並べ、表示がふらつかないようにする

### 受け入れ条件

- [] 4種類の並び替えがUIから切り替えられる
- [] タグ絞り込みと併用しても正しく並ぶ
- [] リロードしても並び順の設定が保持される
- [] `sortNotes` のテスト（日時順／タイトル順／空タイトル末尾）が追加され、全テストがパスする

---

## タスクB：過去レビューの指摘事項（2026-10-31）

### B1デバッグ用 console.log の削除

`app/api/notes/route.ts` に、デバッグ用のログ出力が残っている。本番環境のログに接続情報やセッション情報が出力される状態なので、以下をすべて削除すること：

- 11行目：`console.log("DEBUG: Redis URL:", process.env.KV_REST_API_URL)`（接続URLの出力。最優先で削除）
- 45行目：`console.log("DEBUG: Session data:", session)`（セッション情報の出力）
- 48行目：`console.log("DEBUG: Unauthorized access attempt")`
- 54行目：`console.log("DEBUG: Received data:", newNoteData)`
- 68行目：`console.log("DEBUG: Attempting to save to Redis key:", userKey)`
- 74行目の `console.error("DEBUG: Failed to create note:", error)` は、エラーログ自体は残してよいが「DEBUG: 」の表記は外す

通常のエラーハンドリングとしての `console.error`（例：GET内の "Failed to read notes from DB:"）は残してよい。

### B2：any型の削減

現在 `any` が使われている箇所（基準コミット時点）：

- `app/api/notes/route.ts` 24行目：`Record<string, any>`（hgetall の結果）→ Note型で受ける
- `app/api/notes/[id]/route.ts` 27行目：`const existingNote: any` → `Note | null` 等の具体的な型に
- `app/page.tsx` の `catch (err: any)` 5箇所（199、265、283、306、317行目付近）→ `catch (err: unknown)` にし、`err instanceof Error` でメッセージを取得する形に統一

Note型は現状 `app/page.tsx` から export されているものを使うこと。将来的な共通化（`types/` への切り出し）は任意。

### B3：page.tsx の分割（優先度はA・B1・B2の後）

`app/page.tsx` が592行の単一コンポーネントになっている。挙動を変えずに、段階的に分割すること：

- 既に分離済み：`NoteList`、`MetadataEditor`（これらは変更不要）
- 分割候補：エディタ周り（textarea＋Markdownプレビュー）、ツールバー、ノート取得・保存まわりのカスタムフック化（例：`useNotes`）
- 1コンポーネントずつ切り出し、その都度テスト実行と動作確認を挟むこと。一度に全部を書き換えないこと

### B4：テスト実行スクリプトの追加（小物）

`package.json` に test スクリプトが無く、Vitest を直接呼ぶ必要がある。`"test": "vitest run"` を scripts に追加すること。

### B5：README用スクリーンショット（この指示書の対象外）

「ログイン画面しか見えないため、READMEにスクリーンショットやGIFを用意した方がよい」という指摘については、コード作業とは別に進行中（ログイン画面は取得済み、デモ用ノート文言10件も用意済み）。ログイン後の画面の撮影は、タスクA等の機能追加が終わってから別途行うので、この指示書では扱わない。
