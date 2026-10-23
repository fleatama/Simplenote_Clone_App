# トラブルシューティングログ：Vercelビルドエラー (Unterminated regexp literal)

## 発生日時
2026-10-23

## エラー内容
Vercelのビルドプロセスで以下のエラーが発生し、デプロイに失敗しました。

```
Error: Turbopack build failed with 1 errors:
./app/page.tsx:591:6
Parsing ecmascript source code failed
...
Unterminated regexp literal
```

## 原因
`app/page.tsx` において、`MetadataEditor` コンポーネントを囲むタグ構造に不整合がありました。
具体的には、対応する開きタグがない不要な `</div>` タグが588行目に存在していました。これにより、JSXのパースが正しく行われず、ビルドエンジン（Turbopack）が誤って正規表現の開始や終了として解釈し、構文エラーを引き起こしていました。

## 解決策
`app/page.tsx` の588行目にあった余分な `</div>` を削除し、コンポーネントの閉じタグとの整合性を正しく修正しました。

## 学び
- JSXの階層が複雑な場合、エディタのインデントだけでは閉じタグの不整合を見落とすことがあります。
- 「Unterminated regexp literal」や「Unexpected token」といった不可解な構文エラーがJSXで出た場合、まずはタグの対応関係（開きタグと閉じタグの数）を疑うべきです。
- 開発環境（`npm run dev`）ではエラーにならない場合でも、ビルドプロセスではより厳密な構文チェックが行われるため、定期的なビルドチェックが重要です。
