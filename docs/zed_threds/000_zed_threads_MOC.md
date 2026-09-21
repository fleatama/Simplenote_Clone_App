# Zed Threads MOC (目次)

Zed エディタの AI アシスタント機能（スレッド）を用いて行われた、Simplenote クローンアプリの開発、UI 改善、不具合修正、およびプロジェクト全体の振り返りセッションの記録一覧です。

---

## 🧵 スレッドログ一覧

### 1. [[Simplenote Clone Project Review|Simplenote Clone Project Review (プロジェクト総合レビュー・環境再構築)]]
- **概要**:
  プロジェクト全体の最も長大かつ包括的なセッションログ。
  初期のセットアップ確認、パッケージ構成（React 19, Next.js 16, Bootstrap, Upstash Redis など）の再確認から始まり、Vercel KV 接続エラーの深層デバッグ、二重プロジェクト構造のクリーンアップ、過去の Gemini CLI ログのインポートと引き継ぎ、エクスポート機能の動作確認など、プロジェクトの再起動とブラッシュアップに関わるすべてが網羅されています。
- **主なトピック**:
  - プロジェクト依存関係とディレクトリ構造の監査
  - Vercel KV（Upstash Redis）環境変数の不整合解消
  - 重複ファイル（古い `notes.json` や二重フォルダ）の安全な削除
  - 開発ログ・作業日報の整理と Zed エージェント用カスタムスキルの活用

---

### 2. [[Simplenote Clone Markdown Editor Fixes|Simplenote Clone Markdown Editor Fixes (マークダウンエディタの修正)]]
- **概要**:
  Markdown エディタおよびプレビュー画面の挙動修正に特化したセッションログ。
  文字入力時の違和感、改行の反映（`remark-breaks`）、HTML タグのサニタイズ（`rehype-sanitize`）との連携、チェックボックスの動作安定化などのエディタ体験改善の議論が記録されています。
- **主なトピック**:
  - `react-markdown` のレンダリング調整
  - エディタとプレビューの同期・レイアウト調整
  - Markdown 編集時の操作性向上

---

### 3. [[Resize note title text|Resize note title text (ノートタイトルの動的リサイズ)]]
- **概要**:
  ノートのタイトル表示に関する UI/UX 改善セッションログ。
  長いタイトルや画面幅に応じたタイポグラフィの自動サイズ調整（フォントサイズや折り返し、省略表示）について検討・実装した経緯が記録されています。
- **主なトピック**:
  - CSS / React によるタイトルの動的サイズ変更
  - サイドバーの一覧性向上と、Simplenote らしいミニマルな視認性の確保

---

## 🔗 関連ドキュメントへのリンク
- [[../reports/01_project_inception_and_setup|制作レポート (docs/reports)]]
- [[../troubleshooting/000_トラブルシューティング_MOC|トラブルシューティング MOC (docs/troubleshooting)]]
- [[../tutorial/000_tutorial_MOC|ハンズオン再構築チュートリアル (docs/tutorial)]]
- [[../TECH_STACK|技術スタック (docs/TECH_STACK.md)]]
