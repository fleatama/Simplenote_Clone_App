# 第4章：最難関：Markdownプレビューとチェックボックス双方向連動

前へ: [[chapter3_vercel_kv_integration]] | 目次に戻る: [[000_tutorial_MOC]] | 次の章へ: [[chapter5_export_and_final_polishing]]

---

## 🎯 この章のゴール
- あなたが発案した**「Obsidian風 3モード切り替え（Edit / Preview / Split）」**を実装する。
- プレビュー内のチェックボックスをクリックした際、元データのエディタ側がリアルタイムに `[ ]` ⇄ `[x]` と書き換わる「インタラクティブ・チェックボックス」を完成させる。
- 何度も直面した「チェック位置のズレ」を完全に克服した**「行番号特定方式（Source Mapping）」**を手打ちで理解し、コードを書けるようになる。
- セキュリティライブラリ（`rehype-sanitize`）の属性削除フィルターを正しくカスタマイズする。

---

## 1. あなたの発案：Obsidian風 3モード切り替えUI

画面が狭いときにエディタとプレビューが両方並んでいると執筆に集中できません。
そこで、あなたが提案した「3モード切り替え」を実装します。

### モードの型定義と状態管理
```typescript
// 3つの表示モード
type ViewMode = 'edit' | 'preview' | 'split';

// コンポーネント内の State
const [viewMode, setViewMode] = useState<ViewMode>('edit');
```

### 切替ボタンのUI
```tsx
<div className="flex items-center gap-1 bg-gray-100 p-1 rounded-md">
  <button
    onClick={() => setViewMode('edit')}
    className={`px-3 py-1 text-xs font-medium rounded ${viewMode === 'edit' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
  >
    ✏️ 編集中
  </button>
  <button
    onClick={() => setViewMode('preview')}
    className={`px-3 py-1 text-xs font-medium rounded ${viewMode === 'preview' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
  >
    👁️ 閲覧
  </button>
  <button
    onClick={() => setViewMode('split')}
    className={`px-3 py-1 text-xs font-medium rounded ${viewMode === 'split' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
  >
    🌓 2画面
  </button>
</div>
```

---

## 2. インタラクティブ・チェックボックスの苦闘と「行番号特定方式」

### なぜインデックス（連番）では失敗したのか？
最初は「プレビューにある上から2番目のチェックボックスが押されたから、元のマークダウンの上から2番目の `[ ]` を置換する」という単純な連番方式でした。
しかし、マークダウンの途中に別のリストや表が挟まると、**プレビュー上の連番とマークダウン上の連番がズレてしまい、全然違う行が書き換わってしまう大事故**が発生しました。

### 究極の解決策：行番号特定方式（Source Mapping）
これを解決したのが、あなたがAIと共に見つけ出した**「要素に元のマークダウンの行番号（1行目、2行目...）を焼き付ける」**というアプローチです。

```text
[マークダウン原文]
1行目: # 今日の予定
2行目: - [ ] 牛乳を買う       ──(レンダリング)──>  <input data-line-number="2" />
3行目: メモ：特売日らしい
4行目: - [ ] メールを送る     ──(レンダリング)──>  <input data-line-number="4" />
```

プレビューでチェックをクリックした際、「`data-line-number` が 4 だから、元のマークダウンの **4行目だけ** を書き換える！」とすることで、絶対にズレない完全な連動を実現しました。

---

## 3. 実装ハンズオン：行番号の埋め込みとクリック処理

### 1. `rehype-sanitize` のカスタムスキーマを用意
`data-line-number` という独自属性がセキュリティフィルターで消されないように、ホワイトリストに追加します。

```typescript
// utils/sanitizeSchema.ts
import { defaultSchema } from 'rehype-sanitize';

export const customSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    // input タグに data-line-number 属性の保持を許可する
    input: [...(defaultSchema.attributes?.input || []), 'data-line-number', 'disabled', 'checked', 'type'],
  },
};
```

### 2. チェックボックスの置換関数
クリックされた行番号（例: 4行目）を受け取り、その行の `[ ]` と `[x]` を反転させるロジックを手打ちします。

```typescript
// utils/toggleCheckbox.ts
export function toggleCheckboxAtLine(markdown: string, targetLineNumber: number): string {
  const lines = markdown.split('\n');
  const index = targetLineNumber - 1; // 1-based index から 0-based index に変換

  if (index < 0 || index >= lines.length) return markdown;

  const line = lines[index];

  // 未チェック [ ] を チェック済み [x] に
  if (line.includes('- [ ]')) {
    lines[index] = line.replace('- [ ]', '- [x]');
  } else if (line.includes('- [x]')) {
    // チェック済み [x] を 未チェック [ ] に
    lines[index] = line.replace('- [x]', '- [ ]');
  }

  return lines.join('\n');
}
```

### 3. Markdownプレビューコンポーネントでの適用
`react-markdown` の `components` プロパティを使い、`<input type="checkbox">` のレンダリングを上書きします。

```tsx
// components/MarkdownPreview.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeSanitize from 'rehype-sanitize';
import { customSanitizeSchema } from '@/utils/sanitizeSchema';
import { toggleCheckboxAtLine } from '@/utils/toggleCheckbox';

interface Props {
  content: string;
  onChangeContent: (newContent: string) => void;
}

export const MarkdownPreview: React.FC<Props> = ({ content, onChangeContent }) => {
  return (
    <div className="prose max-w-none p-6 overflow-y-auto h-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[[rehypeSanitize, customSanitizeSchema]]}
        components={{
          input: ({ node, ...props }) => {
            if (props.type === 'checkbox') {
              // node.position から元のマークダウンの開始行番号を取得！
              const lineNumber = node?.position?.start.line;

              return (
                <input
                  type="checkbox"
                  checked={props.checked}
                  data-line-number={lineNumber}
                  className="cursor-pointer mr-2 accent-blue-600 rounded"
                  onChange={() => {
                    if (lineNumber) {
                      const updated = toggleCheckboxAtLine(content, lineNumber);
                      onChangeContent(updated);
                    }
                  }}
                />
              );
            }
            return <input {...props} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
```

---

## 4. つまずきやすいエラーと解決策（デバッグ道場）

### ⚠️ エラー1: チェックボックスを押しても無反応（属性が消えている）
- **原因**: `rehype-sanitize` を使っているのに、`customSanitizeSchema` で `data-line-number` を許可していないため、レンダリング時に属性が除去されています。
- **解決策**: スキーマの `attributes.input` 配列に `'data-line-number'` を必ず追加してください。
- 関連ドキュメント: [[../troubleshooting/029_rehype_sanitize_custom_schema|029_rehype_sanitize_custom_schema]]

### ⚠️ エラー2: 同じ名前のタスクがあるときに違う方が切り替わる
- **原因**: 文字列検索（`content.indexOf('- [ ] 買い物')` など）で置換していると、上にある同名タスクが誤爆します。
- **解決策**: 文字列全体から検索するのではなく、`node.position.start.line` で取得した「行番号の配列インデックス」だけをピンポイントで書き換えます。
- 関連ドキュメント: [[../troubleshooting/027_interactive_checkbox_struggle|027_interactive_checkbox_struggle]]

---

## チェックテスト（自分で確認してみよう）
1. 以下のテキストをエディタに入力してみる：
   ```markdown
   # チェックリスト
   - [ ] 1番目のタスク
   無関係な行
   - [ ] 2番目のタスク
   - [ ] 1番目のタスク（同名のタスク）
   ```
2. プレビュー画面で「2番目のタスク」をクリックしたとき、エディタ側の「2番目のタスク」だけが正確に `- [x]` に変わるか？

これが動いた瞬間、あなたのアプリは一般的なメモアプリを遥かに超える、本格的なインタラクティブ・マークダウンエディタへと進化を遂げています！

---

### 次に進む
いよいよ最終章！あなたのもう1つの重要提案「一括Markdownエクスポート」を実装し、アプリをデプロイして仕上げます。
👉 **[[chapter5_export_and_final_polishing|第5章：最終仕上げ：一括エクスポート機能の実装とデプロイ]]** へ進む。
