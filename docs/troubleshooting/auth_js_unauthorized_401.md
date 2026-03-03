# APIリクエスト時の 401 Unauthorized エラー

## 現象
ログインしているはずなのに、新規作成や保存のAPIを叩くと「401 Unauthorized」が返ってきて操作に失敗する。

## 原因
API側でセッション情報（誰がログインしているか）を正しく取得できていない。Auth.jsの設定でセッションの受け渡しが不十分な場合に発生する。

## 解決策
`auth.ts` の `callbacks` 設定に、セッション時にユーザーIDを明示的に含める処理を追加する。
```typescript
callbacks: {
  session: ({ session, token }) => {
    if (session.user && token.sub) {
      session.user.id = token.sub;
    }
    return session;
  },
}
```
