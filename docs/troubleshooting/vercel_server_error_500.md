# Vercel本番環境での 500 Internal Server Error

## 現象
デプロイは成功しているが、アプリを操作（メモの読み込みや保存）しようとすると「500 Internal Server Error」が発生する。

## 原因
Vercelのサーバー側で、データベース（Redis）に接続するための環境変数が設定されていないため、サーバーサイドの処理がクラッシュしている。

## 解決策
1. Vercelのプロジェクト設定「Settings > Environment Variables」を開く。
2. `KV_REST_API_URL` と `KV_REST_API_TOKEN` を手動で追加する。
3. 追加後、必ず「Redeploy」を実行して環境変数を反映させる。
