# JSX構文エラー（Unterminated regexp literal / Parsing ecmascript source code failed）

- **現象:** `app/page.tsx` のコンパイル時に Turbopack / SWC にて `Unterminated regexp literal` や `Parsing ecmascript source code failed` などの構文解析エラーが繰り返し発生し、ビルドが失敗した。
- **原因:**
  1. `style jsx global` 内の CSS メディアクエリの構文ミス（`@min-width: 768px` という不正なアットルール指定）。これによってパーサーが破綻し、以降の JSX 解析で正規表現リテラルの未完了と誤認された。
  2. コンポーネント編集時に `NoteList` や `div` の閉じタグの階層構造が一部崩れ、重複していたこと。
- **対策:**
  1. `@min-width: 768px` を正しい CSS メディアクエリ表記 `@media (min-width: 768px)` に修正。
  2. `app/page.tsx` 内の `return` 文以下の JSX タグ（`col-md-4` 内の DOM 要素）を正確な開閉階層に整理・クリーンアップ。
