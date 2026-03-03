# 2. Bootstrapの導入と基本的なレイアウト作成

アプリケーションの基本的な見た目の骨格を作成した。

## 主な作業内容

1.  **Bootstrapのインストール:**
    - `npm install bootstrap` コマンドで、Bootstrapライブラリをプロジェクトに追加した。

2.  **CSSのグローバル適用:**
    - `app/layout.tsx` ファイルに `import 'bootstrap/dist/css/bootstrap.min.css';` を追記し、アプリケーション全体でBootstrapのスタイルが適用されるように設定した。

3.  **2ペインレイアウトの作成:**
    - `app/page.tsx` の内容を、Bootstrapのグリッドシステム (`container-fluid`, `row`, `col-md-4`, `col-md-8`) を使って書き換え。
    - 左にメモ一覧、右に編集エリアという基本的な2画面構成のレイアウトを実装した。
