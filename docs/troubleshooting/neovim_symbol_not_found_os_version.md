# esbuild の OSバージョン互換性エラー (Symbol not found)

## 現象
ライブラリのインストール時や、Vitest の実行時に `dyld: Symbol not found: _SecTrustCopyCertificateChain` というエラーが出てクラッシュする。

## 原因
開発ツールの esbuild 等が macOS 12.0 以降を前提にビルドされていたが、現在のOS (macOS 11.6 Big Sur) にはそのシステム機能（Symbol）が存在しないため。

## 解決策
1. OSのバージョンでも動作する「少し古い安定版」のライブラリを指定してインストールした。
2. インストール時に `--legacy-peer-deps` フラグを使い、React 19 とのバージョンの不一致による停止を回避した。
```bash
npm install -D vitest@1.6.0 @vitejs/plugin-react@4.3.0 jsdom@24.1.0 ... --legacy-peer-deps
```
これにより、古いOS環境でも安定してテストを実行できるようになった。
