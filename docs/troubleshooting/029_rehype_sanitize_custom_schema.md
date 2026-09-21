# トラブルシューティング：Rehype-Sanitize によるカスタム属性の消失（インタラクティブ・チェックボックス機能の停止）

Markdownプレビュー画面に配置したチェックボックスから、元のマークダウン上の行を特定するために埋め込んだ `data-` 属性が、レンダリング時に消去されてしまい、クリック操作が機能しなくなった問題の解決記録です。

---

## 1. 発生した問題・エラー

### 状況
- Markdownプレビュー内のチェックボックス要素に、元のマークダウンファイルにおける行番号を紐づけるため、`<input type="checkbox" data-line-number="12" />` のように HTML カスタム属性を生成するように実装した。
- しかし、ブラウザでプレビューを描画すると、生成されたHTMLから `data-line-number` 属性が完全に消失しており、チェックボックスをクリックしても「元データの何行目を書き換えればよいか」をJavaScript側で特定できず、機能が動かなくなった。
- コンソールに明示的なエラーメッセージは出力されないが、DOM要素を確認すると属性が削られている現象。

---

## 2. 原因

- **`rehype-sanitize` によるセキュリティフィルタリング**:
  - 本アプリでは、プレビューの描画に `react-markdown` と、悪意あるスクリプト（XSS）を排除するためのサニタイザー `rehype-sanitize` を使用している。
  - `rehype-sanitize` のデフォルトのホワイトリスト（許可する要素・属性の定義）では、セキュリティ担保のため、非標準の属性（独自の `data-line-number` など）が自動的に排除（クレンジング）される仕様になっていることが原因。

---

## 3. 解決策

`rehype-sanitize` のサニタイズ設定（スキーマ）をカスタマイズし、特定のカスタムデータ属性（`data-*`）を通過させるように設定を変更しました。

### 修正コード例（カスタムスキーマの定義と適用）

```typescript
import reactMarkdown from 'react-markdown';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

// rehype-sanitize のスキーマ設定をカスタマイズ
const customSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    // すべてのタグ、あるいは特定の input タグに対して 'data-line-number' 属性を許可
    '*': [...(defaultSchema.attributes?.['*'] || []), 'data-line-number', 'data-line'],
    input: [...(defaultSchema.attributes?.input || []), 'disabled', 'type', 'checked', 'data-line-number'],
  },
};

// コンポーネントでの使用例
<ReactMarkdown
  rehypePlugins={[[rehypeSanitize, customSchema]]}
>
  {markdownText}
</ReactMarkdown>
```

### 解決手順
1. `rehype-sanitize` から `defaultSchema` をインポート。
2. `attributes` オブジェクトに、私たちが保持したい `data-line-number` や `data-line` を追加。
3. `ReactMarkdown` の `rehypePlugins` に、作成した `customSchema` を配列オプションとして渡す。

これにより、サニタイズの安全性をキープしたまま、インタラクティブ・チェックボックスに必要な `data-line-number` 属性をHTML上に維持し、ズレのない更新処理が完全に動作するようになりました。

---

## 4. 教訓と予防策
1. **マークダウンの拡張性とサニタイズの競合**: HTMLにカスタム属性を埋め込んでJavaScriptから制御するアプローチをとる場合、描画パイプラインの途中に存在するサニタイズ処理（`rehype-sanitize`、`DOMPurify` など）に引っかからないか、常にチェックする。
2. **ホワイトリストによる安全な拡張**: サニタイザーを完全に無効化する（危険な行為）のではなく、必要な属性のみをピンポイントでスキーマ（ホワイトリスト）に追加することで、セキュリティと高度なUI機能を両立させる。
