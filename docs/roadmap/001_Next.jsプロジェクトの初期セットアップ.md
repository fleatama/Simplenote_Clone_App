# 1. Next.jsプロジェクトの初期セットアップ

Next.jsアプリケーションの土台を作成し、バージョン管理の準備を整えた。

## 主な作業内容

1.  **`create-next-app` の実行:**
    - `npx create-next-app` コマンドを使い、`simplenote-clone` という名前でプロジェクトを初期化。
    - 途中でTypeScriptの使用を選択した。

2.  **Gitの初期設定:**
    - `create-next-app` によって自動的に初期化されたGitリポジトリに対し、最初のコミット (`Initial commit`) を作成。
    - GitHub上でリモートリポジトリを作成し、タイポ (`Simplenote-Cloe-App`) を修正。
    - `git remote set-url` でローカルリポジトリとリモートリポジトリの紐付けを修正し、`git push` で最初のコミットをアップロードした。
