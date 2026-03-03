# React Hydration Mismatch

## 現象
ブラウザのコンソールに「A tree hydrated but some attributes... didn't match」という警告またはエラーが出る。

## 原因
サーバーが作ったHTMLと、ブラウザでReactが動いた直後のHTMLが異なっている。多くの場合、ブラウザ拡張機能（Gyazoなど）が勝手にHTMLタグに属性を書き加えることが原因。

## 解決策
1. ブラウザのシークレットモードで動作確認する（拡張機能の影響を排除）。
2. プログラム側で `app/layout.tsx` の `<html>` タグに `suppressHydrationWarning` 属性を追加して、軽微な不一致を無視するように設定する。
