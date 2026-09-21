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

---

## ドキュメント・学習ナビゲーション
- [[tutorial/000_tutorial_MOC|初心者向け ハンズオン再構築チュートリアル]]
- [[reports/000_reports_MOC|制作レポート MOC]]
- [[troubleshooting/000_トラブルシューティング_MOC|トラブルシューティング MOC]]
- [[roadmap/000_roadmap_MOC|開発ロードマップ MOC]]
- [[zed_threds/000_zed_threads_MOC|Zed スレッドログ MOC]]
