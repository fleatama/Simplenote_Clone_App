# 認証キー（CRON_SECRET）の記号混入によるUnauthorizedエラー

- **現象:** 
  `/api/keep-alive` エンドポイントに対して `curl` でBearer認証付きリクエストを送った際、本番URLへの接続は成功しているにもかかわらず `Unauthorized` が返続けた。

- **原因:** 
  環境変数 `CRON_SECRET` に記号（特殊文字）が含まれていたため、シェル（ターミナル）での解釈やHTTPヘッダーの送信時に値が正しく伝わらず、サーバー側の認証チェック（`authHeader !== ...`）で不一致となり拒否されていた。

- **対策:** 
  `CRON_SECRET` の値を**アルファベットと数字のみ**のシンプルな文字列に変更したうえで再度リクエストを送信し、無事に `{"success":true,"message":"Database pinged successfully."}` が返ることを確認した。
