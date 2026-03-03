# 対策マニュアル：Vercel ビルド時の依存関係競合エラー (ERESOLVE)

## 1. 現象
Vercel でのデプロイ（ビルド）時に、以下のようなエラーメッセージが表示されて停止する。

```text
npm error ERESOLVE unable to resolve dependency tree
npm error Conflicting peer dependency: react@18.x
...
npm error Fix the upstream dependency conflict, or retry
npm error this command with --force or --legacy-peer-deps
```

## 2. 原因
プロジェクトで使用している主要なライブラリ（例：React 19）と、新しく導入した開発用ツール（例：@testing-library/react 15）が必要とするバージョンの条件が一致しない場合に発生する。

npm は安全のために「互換性が保証されていない組み合わせ」のインストールを自動的に停止するが、実際には動作に問題がないケースも多い。

## 3. 解決策
npm に対して、「厳密な互換性チェックをスキップしてインストールを強行する」ように指示を出す。

### 手順
1. **Vercel ダッシュボード** にログイン。
2. 対象のプロジェクトを選択し、**[Settings]** タブをクリック。
3. 左サイドメニューの **[General]** を選択。
4. **[Build & Development Settings]** セクションまでスクロール。
5. **[Install Command]** のトグルスイッチを **ON (OVERRIDE)** に変更。
6. 入力欄に以下のコマンドを入力。
   ```bash
   npm install --legacy-peer-deps
   ```
7. **[Save]** ボタンを押して保存。
8. **[Deployments]** タブから、失敗したデプロイを **[Redeploy]** する。

## 4. 補足：関連する英単語
- **Conflicting:** 衝突している、矛盾している。
- **Peer Dependency:** 「仲間（Peer）」となるべきライブラリへの依存。今回の場合は、テストツールが「仲間の React 18 を連れてきて！」と言っている状態。
- **Legacy:** 過去の遺産、古い形式。`--legacy-peer-deps` は「古い（緩い）基準でチェックして」という意味。
