# Googleログイン時のリダイレクトURI不一致 (400 Error)

## 現象
本番環境でGoogleログインボタンを押すと、Google側の画面で「エラー 400: redirect_uri_mismatch」が表示される。

## 原因
Google Cloud Consoleに登録した「承認済みのリダイレクトURI」と、アプリが実際にGoogleへ送信しているリダイレクトURIが、1文字でも異なっている場合に発生する。反映待ち（伝播待ち）の場合もある。

## 解決策
1. Google Cloud Console の「認証情報」設定を開く。
2. リダイレクトURIが `https://(アプリドメイン)/api/auth/callback/google` になっているか確認。
3. Vercelの環境変数 `AUTH_URL` が正しいドメインになっているか確認。
4. 設定変更後は、Google側の反映を数分〜数十分待つ。
