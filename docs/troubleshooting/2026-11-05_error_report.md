# 編集履歴リファクタリングに伴うランタイム参照エラーとビルド環境の制限

- **現象:** 
    1. リファクタリング中に `setContentHistory` が未定義となり、`handleSelectNote` 実行時に `Runtime ReferenceError` が発生した。
    2. `npm run build` 実行時に Turbopack がポートバインドを試みて `Operation not permitted` (os error 1) で失敗し、ビルド不可となった。

- **原因:**
    1. 編集履歴ロジックをカスタムフック `useEditorHistory` に分離した際、`page.tsx` 内の `handleSelectNote` 関数が依然として古いステート管理関数（`setContentHistory`, `setHistoryIndex`）を参照していたため。
    2. ビルドエラーは、サンドボックス環境の実行権限制限により、Turbopack が内部的に必要とするネットワーク通信（ポート割り当て）が許可されていないため。

- **対策:**
    1. `useEditorHistory` フックに `resetHistory` メソッドを追加し、`page.tsx` 側でステートを直接操作する代わりにこのメソッドを呼び出す形に書き換えた。
    2. Turbopack のエラーはコードの問題ではないため、`tsc --noEmit` による静的型解析に合格することでコードの論理的正当性を確認した。
