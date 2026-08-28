# Simplenote Clone 技術スタック

このプロジェクトは、モダンなウェブ技術を使用して構築されたMarkdown対応のノートアプリです。

## フロントエンド・フレームワーク
- **React 19**: UI構築用ライブラリ
- **Next.js 16**: フレームワーク（ルーティング、サーバーサイド処理）
- **NextAuth.js (Auth.js) v5**: 認証システム（Google OAuth）

## スタイリング・デザイン
- **Bootstrap 5**: CSSフレームワークによるレスポンシブデザイン
- **Bootstrap Icons**: アイコンライブラリ

## Markdown 関連
- **react-markdown**: Markdownのレンダリング
- **remark-gfm**: GitHub Flavored Markdownサポート
- **remark-breaks**: Markdown内での改行処理
- **gray-matter**: フロントマター（YAMLメタデータ）の解析

## ユーティリティ・外部連携
- **JSZip / file-saver**: ノートの一括エクスポート機能
- **@upstash/redis**: Redisを利用したデータストア
- **TypeScript**: 静的型付けによる堅牢なコード管理

## テスト・品質保証
- **Vitest**: 高速なユニットテストフレームワーク
- **Testing Library (React/Jest DOM)**: コンポーネントのテスト
