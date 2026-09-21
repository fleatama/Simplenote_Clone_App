# 制作レポート MOC (目次)

Simplenote クローンアプリの開発プロセス、機能ごとの制作過程、直面した課題の解決経緯をまとめたレポート一覧です。

---

## 📑 制作過程別レポート（全4部）

### 1. [[01_project_inception_and_setup|01. プロジェクトの誕生と初期セットアップ]]
- **主な内容**:
  - プロジェクトの目的（文中のタイムスタンプ挿入問題の解決、ポートフォリオ化）
  - Neovim (`lazy.nvim`, `which-key`) での開発環境構築
  - 初期のローカルJSON（`data/notes.json`）を用いたCRUD APIの実装
  - NextAuth によるユーザー認証基盤の導入

### 2. [[02_interactive_checkbox_challenge|02. インタラクティブ・チェックボックスのズレ問題と解決]]
- **主な内容**:
  - プレビュー画面のタスクリストをクリックした際の更新位置ズレ問題
  - 4世代にわたる技術的アプローチ（インデックス方式 → テキスト特定 → 文章特定 → 行番号特定 Source Mapping）
  - セキュリティライブラリ（`rehype-sanitize`）の属性削除フィルターの克服

### 3. [[03_vercel_and_database_troubleshooting|03. Vercel とデータベースのトラブルシューティング]]
- **主な内容**:
  - クラウドDB（Upstash Redis / Vercel KV）接続時の環境変数不整合・`ENOTFOUND` の解決
  - macOS Big Sur 環境における Vercel CLI 制限への代替ワークアラウンド（Web GUI、Docker等）
  - メモリ上限時のデータ勝手な削除を防ぐ Redis Eviction ポリシー（`noeviction`）の選定

### 4. [[04_directory_refactoring_and_export_feature|04. ディレクトリ整理、エクスポート機能、および発展的機能]]
- **主な内容**:
  - 二重プロジェクト構造や不要モックデータのクリーンアップ
  - 単一および一括（ZIP圧縮）での Markdown エクスポート機能の実装
  - ノートタイトルの動的リサイズ等の UI 改善
  - 開発を自動化・ナレッジ化する Zed エージェント用カスタムスキルの活用

---

## 📅 作業日報ログ
- [[2026-05-07|2026-05-07 作業レポート (Vercel KV接続とチェックボックス改修)]]
- [[2026-06-19|2026-06-19 作業レポート (エクスポート機能と構造監査)]]

---

## 🔗 関連ドキュメントへのリンク
- [[../tutorial/000_tutorial_MOC|ハンズオン再構築チュートリアル (docs/tutorial)]]
- [[../troubleshooting/000_トラブルシューティング_MOC|トラブルシューティング MOC (docs/troubleshooting)]]
- [[../zed_threds/000_zed_threads_MOC|Zed スレッドログ MOC (docs/zed_threds)]]
- [[../TECH_STACK|技術スタック (docs/TECH_STACK.md)]]
