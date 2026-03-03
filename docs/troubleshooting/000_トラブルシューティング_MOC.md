# トラブルシューティング MOC

このプロジェクトの開発中に発生した主要なエラーと、その解決策の記録です。

## エラー一覧

### 1. 環境・インフラ関連
- [[vercel_build_error_eresolve|Vercelビルド時の依存関係競合 (ERESOLVE)]]
- [[google_auth_redirect_uri_mismatch|Googleログイン時のリダイレクトURI不一致 (400 Error)]]
- [[vercel_server_error_500|Vercel本番環境での 500 Internal Server Error]]

### 2. API・バックエンド関連
- [[nextjs_api_params_promise_error|Next.js APIでの params プロパティアクセスエラー]]
- [[redis_race_condition_id_conflict|新規作成ボタン連打によるID衝突 (Race Condition)]]
- [[auth_js_unauthorized_401|APIリクエスト時の 401 Unauthorized エラー]]

### 3. フロントエンド・UI関連
- [[react_hydration_mismatch|React Hydration Mismatch (ブラウザ拡張機能による干渉)]]
- [[template_literal_backtick_typo|URL指定時のテンプレートリテラル(バッククォート)記述ミス]]

### 4. ツール・エディタ関連 (Neovim)
- [[neovim_which_key_register_error|Neovim which-key の設定読み込み順序エラー]]
- [[neovim_symbol_not_found_os_version|esbuild の OSバージョン互換性エラー (Symbol not found)]]
