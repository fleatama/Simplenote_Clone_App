---
date: 2026-05-07
created_by: Warp Oz Agent
source: Oz by Warp
tags:
  - vercel
  - cli
  - big-sur
  - macos
  - troubleshooting
  - error
  - compatibility
  - deployment
  - database
  - auth
---

# Big Sur 環境での Vercel CLI 使用不可問題

## 環境
- macOS Big Sur (11.x)
- Node.js v22.20.0 (nvm 管理)
- npm 11.6.2
- Zsh

## 問題の概要
Big Sur 環境下で Vercel CLI をインストール・使用しようとしたが、**OS レベルでのバイナリ互換性不足**と、**Vercel サーバー側のレガシー認証フロー廃止**により、事実上使用不可能となった。

## 試行した手順と結果

### 1. `npx vercel` での実行
```bash
npx vercel login
```
- 結果：`ECOMPROMISED` (npm ロックエラー) → キャッシュクリア後も `esbuild` のビルドエラー

### 2. 最新版のグローバルインストール
```bash
npm install -g vercel@latest
```
- 結果：`esbuild` が **macOS 12.0 (Monterey) 向けにビルド**されているため、Big Sur でシンボル解決失敗
```
dyld: Symbol not found: _SecTrustCopyCertificateChain
  Referenced from: .../esbuild (which was built for Mac OS X 12.0)
```

### 3. 旧版 (v28.20.0) のグローバルインストール
```bash
npm install -g vercel@28.20.0
```
- 結果：インストールは成功。`vercel --version` も動作。
- しかし `vercel login` でブラウザ認証が正常に完了せず、トークン認証で回避。

### 4. トークン認証でのログイン確認
```bash
export VERCEL_TOKEN="<発行したトークン>"
vercel whoami --token=$VERCEL_TOKEN
# → fleatama (成功)
```

### 5. プロジェクト紐付け (`vercel link`)
```bash
vercel link --token=$VERCEL_TOKEN --yes
```
- 結果：**サーバー側でレガシー認証フローが完全に無効化**されており、エラー
```
Error: Unexpected error: The legacy authentication flow is disabled.
Please upgrade the Vercel CLI to the latest version.
```

## 根本原因

| 問題 | 原因 | 回避可能性 |
|---|---|---|
| esbuild のビルドエラー | Big Sur と macOS 12+ 向けバイナリの互換性なし | **なし** (OS アップグレードが必要) |
| レガシー認証フロー無効化 | Vercel サーバー側で旧版 CLI の認証をブロック | **なし** (最新 CLI が必要だがインストール不可) |

## 結論

**Big Sur (macOS 11) では、Vercel CLI を使ったプロジェクト管理は事実上不可能。**

Vercel は 2026 年 2 月以降、レガシー認証フローを廃止。旧版 CLI を使う道も閉ざされた。

## 推奨される代替案

1. **Vercel ダッシュボード（Web UI）を使用**
   - 環境変数管理：`Settings > Environment Variables`
   - デプロイ・ログ確認：`Deployments` / `Logs` タブ
   - これらはブラウザから完結する

2. **別マシン (Monterey 以降) で CLI 操作**
   - 別 PC やスマホ/タブレットで `vercel env pull` などを実行
   - 生成された `.env.local` を手元の Big Sur Mac に転送

3. **Warp 上の AI（Oz）や Gemini CLI でローカル開発を支援**
   - デプロイ以外のコーディング・デバッグはローカルで完結可能

## 関連ファイル
- `.env.local` — ローカル開発用の環境変数（Vercel には手動反映が必要）
- `docs/troubleshooting/vercel_kv_connection_issue.md` — KV/Redis 接続エラーの別ナレッジ
