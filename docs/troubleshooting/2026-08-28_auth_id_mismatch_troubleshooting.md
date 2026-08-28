# 認証ID不一致とセッション管理のトラブルシューティング

## 概要
Google認証（OAuth）において、ブラウザや環境によって同一のGoogleアカウントにも関わらず異なる `sub` ID が発行され、データが同期されない（別のユーザーとして扱われる）問題が発生した。また、Vercel環境にて `AUTH_SECRET` が正常に読み込まれない問題も同時に解決した。

## 発生した現象
- Chrome, Iron, Safari 等の異なるブラウザでログインすると、同じ Gmail アドレスなのに `session.user.id` が別々の値になる。
- そのため、保存されるメモデータが同期されず、ブラウザごとに「空のメモ帳」が表示される状態となった。
- Vercel環境において環境変数の読み込みが不安定（`Secret Check: MISSING`）な状態であった。

## 原因
1. **Google OAuth の識別子 (`sub`) の不安定性**: NextAuth.js がデフォルトで利用していた `sub` ID が、環境やブラウザのセッション状況によって不確定な値として生成されていた。
2. **`AUTH_SECRET` の環境変数不備**: Vercel 上で `AUTH_SECRET` が正しく環境変数として登録されておらず、ブラウザごとに暗号化キーが不一致を起こしていた。

## 解決策

### 1. ユーザーIDの識別ロジックを Email に統一
`auth.ts` において、不安定な `sub` ID の代わりに、一意であることが保証されている `email` をユーザーIDとして強制的にマッピングするロジックに変更した。

```typescript
// auth.ts の修正方針
jwt({ token, user }) {
  if (user && user.email) {
    token.sub = user.email; // IDの代わりにEmailを識別子として固定
  }
  return token;
},
```

### 2. 環境変数の修正とデプロイ手順の確立
- Vercelダッシュボードの「Environment Variables」に `AUTH_SECRET` を手動で追加。
- `openssl rand -base64 32` コマンドで生成した強力な乱数文字列をシークレットとして採用。
- 環境変数を更新した後、必ず Vercel 上で「Redeploy」を実行することで設定を反映させる運用を徹底。

## 今後の教訓
- **認証の識別子は Email を優先する**: 外部サービス（Google等）が返す `sub` ID に頼るよりも、不変である `email` をアプリ側のユーザー識別子として利用する方が、セッションの揺らぎに強くなる。
- **環境変数の管理**: `AUTH_SECRET` 等の機密情報は、Vercel の設定とローカルの `.env.local` で常に一致させておくこと。デプロイ時は環境変数の追加・更新後に必ず手動で `Redeploy` する必要がある。
