# Simplenote Clone App

本プロジェクトは、シンプルな同期メモアプリ「Simplenote」をベースに、モダンな技術スタックと実用的な機能を盛り込んだフルスタックのクローンアプリケーションです。

---

## 🚀 主な機能・特徴

- **ユーザー認証 (Authentication):** NextAuth (Auth.js) を活用したセキュアなログイン・認証機能。
- **自動保存 (Autosave):** ユーザーのタイピングに合わせてスムーズにデータを保存する仕組み。
- **Markdown & メタデータ対応:** `react-markdown` や `remark-gfm` を用いたリッチなノート編集と、メタデータの管理機能。
- **データベース自動延命機能:** Upstash Redisの無料プランにおける自動削除（30日間の非アクティブ）を防ぐための、Vercel Cron対応型API（`/api/keep-alive`）を搭載。
- **ユニバーサルアクセス & モバイル対応 (Universal Access & Responsive UI):** スマートフォンやタブレット、デスクトップなど、アクセス端末の画面幅に応じて最適化されたレイアウト切り替え機能。小画面でも「一覧へ戻る」ボタンでストレスなく操作可能。

---

## 🛠 使用技術

### フロントエンド / バックエンド (Full-stack)
- **Next.js 16.0.10** (App Router, Turbopack)
- **React 19.2.1**
- **TypeScript 5.x**
- **NextAuth (Auth.js) v5**

### データベース & インフラ
- **Upstash Redis** (`@upstash/redis`)
- **Vercel** (デプロイ & クラウドインフラ)

### UI / デザイン
- **Bootstrap 5.3.8**
- **Bootstrap Icons 1.13.1**
- **React Markdown** (`react-markdown`, `remark-gfm`)

---

## 📁 ディレクトリ構成

```text
simplenote-clone/
├── app/                  # Next.js App Router
│   ├── api/              # APIエンドポイント (auth, notes, keep-alive)
│   ├── components/       # UIコンポーネント (NoteList, MetadataEditor 等)
│   ├── globals.css       # グローバルスタイル
│   ├── layout.tsx        # 共通レイアウト
│   └── page.tsx          # メインページ
├── data/                 # データ処理関連
├── docs/                 # ドキュメント・日報・トラブルシューティング
├── utils/                # ユーティリティ関数
├── auth.ts               # NextAuth 認証設定
├── middleware.ts         # ミドルウェア
├── vercel.json           # Vercel設定・Cronジョブ定義
└── package.json          # 依存関係設定
```

---

## 🔧 工夫したポイント・トラブルシューティング

1. **セキュアな認証とデータ分離:** NextAuthを導入し、ユーザーごとの安全なノート管理を実現。
2. **データベースの自動延命 (Keep-Alive):** Upstash Redisのアーカイブを防ぐため、Vercel Cronから定期的に実行されるセキュアなエンドポイント（`CRON_SECRET` 認証付き）を実装。
3. **ユニバーサルアクセス（スマホ等端末対応）と競合ループの解消:**
   - 768px未満の小画面では1ペイン形式で「メモ一覧」と「エディタ」をスムーズに切り替え。
   - 単純な画面消滅を防ぐため、`useEffect` による自動選択フックとスマホ用状態管理ステート（`mobileShowList`）の競合を解消し、快適なナビゲーションを実現。
4. **最新技術環境への適応:** Next.js 16 (Turbopack) や React 19 の環境下でビルドエラーやルーティングの課題をクリアし最適化。

---

## 🏃‍♂️ 実行・セットアップ方法

1. **リポジトリをクローン**
2. **依存関係のインストール:**
   ```bash
   npm install
   ```
3. **環境変数の設定 (`.env.local`):**
   ```env
   KV_REST_API_URL=your_upstash_redis_url
   KV_REST_API_TOKEN=your_upstash_redis_token
   AUTH_SECRET=your_nextauth_secret
   CRON_SECRET=your_cron_secret
   ```
4. **開発サーバーの起動:**
   ```bash
   npm run dev
   ```
