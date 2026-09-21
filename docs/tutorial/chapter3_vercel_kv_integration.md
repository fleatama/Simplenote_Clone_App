# 第3章：インフラ連携：ローカルJSONからVercel KV (Redis) への移行

前へ: [[chapter2_next_auth_and_ui]] | 目次に戻る: [[000_tutorial_MOC]] | 次の章へ: [[chapter4_interactive_checkbox_and_markdown]]

---

## 🎯 この章のゴール
- なぜローカルJSONファイル（`fs.writeFileSync`）が本番環境（Vercel）で動かないのか、その根本理由を理解する。
- **Upstash Redis (Vercel KV)** を導入し、クラウドデータベースへの安全な接続を行う。
- macOS Big Sur 環境など、OSの制約がある中でも確実にデプロイと環境変数同期を行うノウハウを身につける。
- データの消失を防ぐための「Redis Evictionポリシー」の重要性を学ぶ。

---

## 1. なぜ Vercel では `notes.json` が使えないのか？（サーバーレスの掟）

第1章では `notes.json` というパソコン上のファイルにメモを保存していました。
ローカル開発（`npm run dev`）では完璧に動きますが、これを Vercel にデプロイすると以下の問題が発生します。

> **⚠️ サーバーレス環境（Vercel）の落とし穴**:
> Vercel の関数（Serverless Functions）は、アクセスがあるたびに一瞬だけ起動し、処理が終わるとすぐに消滅（破棄）します。ローカルファイルに書き込んでも、次にアクセスされた時には別のまっさらな環境が立ち上がるため、**書き込んだメモが綺麗さっぱり消去されてしまう**のです。

このため、データは外部の永続的なデータベース（Vercel KV / Redis）に保存しなければなりません。

---

## 2. Upstash Redis のセットアップ

超高速なキー・バリューストアである **Upstash Redis** を使います。HTTPリクエスト経由でアクセスできるため、サーバーレス環境と最高の相性を誇ります。

### 1. ライブラリのインストール
```bash
npm install @upstash/redis
```

### 2. 環境変数ファイル（`.env.local`）の作成
Upstash または Vercel のダッシュボードから取得した接続情報をローカルに設定します。

```text
# .env.local
KV_REST_API_URL="https://xxxx-xxxx.upstash.io"
KV_REST_API_TOKEN="Axxxxxxx="
```

### 3. Redis クライアントの作成 (`lib/redis.ts`)
```typescript
// lib/redis.ts
import { Redis } from '@upstash/redis';

// 環境変数が正しくセットされているかチェック
if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  throw new Error('KV_REST_API_URL および KV_REST_API_TOKEN を設定してください');
}

export const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// ユーザーごとのキーを生成するヘルパー関数
export function getUserNotesKey(userId: string): string {
  return `user:${userId}:notes`;
}
```

---

## 3. APIルートを Redis 読み書きに書き換える

`app/api/notes/route.ts` を、JSONファイル読み書きから Redis への保存（HashやJSON文字列）へ書き換えます。

```typescript
// app/api/notes/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { redis, getUserNotesKey } from '@/lib/redis';

// GET: ログイン中ユーザーの全ノートを取得
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const userKey = getUserNotesKey(session.user.id);
  // Redis の Hash から全データを取得（IDをフィールドキーとして格納）
  const allNotesRecord = await redis.hgetall<Record<string, any>>(userKey);

  if (!allNotesRecord) {
    return NextResponse.json([]);
  }

  const notes = Object.values(allNotesRecord);
  // 更新日時が新しい順にソート
  notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return NextResponse.json(notes);
}

// POST: 新規ノートの追加
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await request.json();
  const userKey = getUserNotesKey(session.user.id);

  const newId = Date.now().toString();
  const now = new Date().toISOString();
  const newNote = {
    id: newId,
    content: body.content || '',
    createdAt: now,
    updatedAt: now,
  };

  // Redis の Hash に保存: hset(キー, { [フィールド名]: 値 })
  await redis.hset(userKey, { [newId]: newNote });

  return NextResponse.json(newNote, { status: 201 });
}
```

---

## 4. つまずきやすいエラーと解決策（デバッグ道場）

### ⚠️ エラー1: `ENOTFOUND` や `unauthorized` エラー
- **現象**: データを保存しようとすると `getaddrinfo ENOTFOUND` や `Unauthorized` が出る。
- **原因**: `.env.local` の変数名と、コード側で参照している変数名が一致していない（例: `REDIS_URL` と `KV_REST_API_URL` の不一致）。
- **解決策**: Vercel ダッシュボードに自動生成された変数名（`KV_REST_API_URL`）と、コード側の指定を完全に揃えます。
- 関連ドキュメント: [[../troubleshooting/vercel_kv_connection_issue|vercel_kv_connection_issue]]

### ⚠️ エラー2: macOS Big Sur で Vercel CLI が動かない問題
- **現象**: ターミナルから `vercel env pull` などを叩くと、OSやNodeの互換性エラーでコマンドが落ちる。
- **解決策（ワークアラウンド）**: 無理に古いMac環境へ最新のCLIを入れようとせず、**「Vercel Webダッシュボード上で環境変数を手動設定し、GitHubへのプッシュ（Git Push）をトリガーにして自動デプロイする」** という現場的な回避策をとる。
- 関連ドキュメント: [[../troubleshooting/big_sur_vercel_cli_issue|big_sur_vercel_cli_issue]]

### ⚠️ エラー3: 勝手に古いメモが消える！？（Redis Evictionの危険）
- **現象**: データ量が増えてきたら、過去の大事なメモがいつの間にか消失していた。
- **原因**: Redis の自動データ削除ポリシー（Eviction Policy）が `allkeys-lru` などの「キャッシュ用」になっていると、容量上限時に古いデータから勝手に削除されてしまいます。
- **解決策**: Upstash / Vercel KV の設定で、必ず **`noeviction`**（容量上限時はエラーを返し、既存データは絶対に消さない）ポリシーを選択する。
- 関連ドキュメント: [[../troubleshooting/030_redis_eviction_policy_data_loss_prevention|030_redis_eviction_policy_data_loss_prevention]]

---

## チェックテスト（自分で確認してみよう）
1. ローカルでメモを作成した後、別のブラウザやシークレットウィンドウで開いても、同じGoogleアカウントでログインすれば同じメモが表示されるか？
2. Vercel KV のダッシュボードを開いて、`user:xxxx:notes` というキーの中にデータが保存されていることを目視できたか？

これが確認できたら、あなたのアプリは世界水準のサーバーレス・クラウドデータベースと完全に連携できています！

---

### 次に進む
いよいよ、このプロジェクト最大の技術的難所であり、あなたが情熱を注いだ「チェックボックスの連動」と「3モード切り替え」に挑戦します！
👉 **[[chapter4_interactive_checkbox_and_markdown|第4章：最難関：Markdownプレビューとチェックボックス双方向連動]]** へ進む。
