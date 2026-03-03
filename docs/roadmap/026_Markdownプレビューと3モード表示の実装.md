# 26. Markdownプレビューと3モード表示の実装

Obsidianのユーザー体験を参考に、編集と閲覧をシームレスに行える高度なMarkdown環境を実装した。

## 主な作業内容

1.  **Markdownエンジンの導入:**
    - `react-markdown` をベースに、`remark-gfm` (GitHub拡張) と `remark-breaks` (自然な改行) を導入。
    - `rehype-sanitize` により、安全なHTML出力を実現。

2.  **3モード切り替え (Obsidianスタイル):**
    - `viewMode` 状態 ('source' | 'split' | 'reading') を追加。
    - **Source:** 編集に集中する全画面エディタ。
    - **Split:** 左エディタ、右プレビューのリアルタイム並列表示。
    - **Reading:** 閲覧専用の全画面プレビュー。

3.  **リンクの挙動改善:**
    - Markdown内のリンクをクリックした際、アプリを離れずに新しいタブで開くよう `target="_blank"` 属性を自動付与するカスタムコンポーネントを実装。

4.  **UI/UXの調整:**
    - ツールバーに直感的なアイコンボタンを配置。
    - CSSの微調整により、テーブルや引用、コードブロックの見た目を向上させた。
