# トラブルシューティング: エクスポート機能実装およびDB接続エラー

## 1. データベース接続エラー (ENOTFOUND)
- **現象:** メモの新規作成時に `TypeError: fetch failed` が発生し、詳細に `ENOTFOUND` が表示された。
- **原因:** Vercel KV (Upstash Redis) のデータベースが長期間非アクティブで削除されており、ホスト名の解決ができなかった。
- **対策:** Upstash管理コンソールから新しいDBを作成し、接続情報を取得。`.env.local` を最新の URL と Token で書き換えた。

## 2. プロジェクトのディレクトリ二重構造
- **現象:** ディレクトリ構造が `simplenote-clone/simplenote-clone/` のようにネストし、不要なファイル（中身が空の route.ts）が混在していた。
- **原因:** プロジェクトのクローン手順の誤り、または作業中の誤操作による不要なディレクトリの作成。
- **対策:** `git rm -r` で Git 管理から除外し、物理ディレクトリを削除して構造を平坦化した。

## 3. TypeScript / ビルドエラー (インポート・型定義)
- **現象:** `Parsing ecmascript source code failed` および `Return statement is not allowed here`。
- **原因:**
    1.  関数のネスト構造のミス（`getNoteTitle` 内に別の関数を定義してしまった）。
    2.  `utils/helpers.ts` が `app/page.tsx` の `Note` インターフェースを正しくインポートできていなかった。
- **対策:**
    1.  関数構造を正しく独立させ、`return` 文を正しい位置に戻した。
    2.  `app/page.tsx` で `interface Note` に `export` を付与し、`utils/helpers.ts` で正しくインポートできるようにした。
