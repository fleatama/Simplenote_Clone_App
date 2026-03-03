# Next.js APIでの params プロパティアクセスエラー

## 現象
APIルート (`[id]/route.ts`) で、`params.id` にアクセスしようとすると、「params is a Promise and must be unwrapped with await」というエラーが出る。

## 原因
Next.jsのバージョンアップにより、APIの `params` オブジェクトが非同期（Promise）として扱われるようになった。直接アクセスすると未定義やエラーになる。

## 解決策
`params` オブジェクトに頼るのをやめ、リクエストオブジェクトから直接URLを解析する。
```typescript
const url = new URL(request.url);
const id = url.pathname.split('/').pop();
```
これにより、環境の違いに左右されず確実にIDを取得できる。
