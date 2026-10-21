---
created: 2026-09-25
updated: 2026-09-25
tags: [tutorial, chapter6, redis, vercel-cron, keep-alive, maintenance]
aliases: [第6章：運用・保守と自動延命システムの構築]
---

# 第6章：運用・保守と自動延命システムの構築（Vercel Cron & Upstash Keep-Alive）

本章では、クラウドDB（Upstash Redis / Vercel KV）を無料枠で永続運用するために必要となる**「自動延命システム（Keep-Alive）」**の実装方法と、Vercel Cron Jobsの設定手順について学びます。

---

## 🎯 第6章の学習目標
1. **Upstash Redis の無料枠特性の理解**: 一定期間アクセスがない場合にデータが凍結・削除されるのを防ぐ仕組みを学ぶ。
2. **定期実行APIの自作**: データベースへ軽量なPINGコマンドを発行する API エンドポイント（`/api/keep-alive`）を実装する。
3. **Vercel Cron Jobs の設定**: `vercel.json` を用いて、毎日自動でAPIを叩くスケジュールを構築する。
4. **セキュリティ対策**: `CRON_SECRET` トークンによる認証保護の実装。
5. **トラブルシューティング**: JSONコメントエラーや認証エラー（Unauthorized）の回避方法を体得する。

---

## 🛠️ 1. 定期実行 API エンドポイントの実装

まずは、データベースへアクセスして生存確認（Ping）を行うAPIルートを作成します。

### ファイル作成: `app/api/keep-alive/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(request: Request) {
  try {
    // 認証ヘッダーのチェック（Vercel Cronからのリクエストであることを確認）
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // データベースへの軽量な書き込み・読み込み（Pingの代わり）
    const pingKey = 'keep-alive:last-ping';
    const timestamp = new Date().toISOString();
    await kv.set(pingKey, timestamp);

    return NextResponse.json({
      success: true,
      message: 'Database pinged successfully.',
      timestamp,
    });
  } catch (error: any) {
    console.error('Keep-alive error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## ⏰ 2. Vercel Cron Jobs の設定

Vercelの定期実行機能を利用するため、プロジェクトのルートディレクトリに `vercel.json` を配置します。

### ファイル作成: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/keep-alive",
      "schedule": "0 0 * * *"
    }
  ]
}
```
* ※ `"schedule": "0 0 * * *"` は「毎日UTC 0:00（日本時間午前9:00）」に実行することを意味します。

---

## 🔐 3. 環境変数の設定とテスト

1. **環境変数の追加**: Vercel ダッシュボード、または `.env.local` に `CRON_SECRET` を設定します（記号を含まない強固な英数字文字列を推奨）。
2. **動作確認**:
   ローカルまたは本番環境で以下の `curl` コマンドを実行し、正しく動作するか確認します。

```bash
curl -X GET "https://your-app.vercel.app/api/keep-alive" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

成功すると、以下のレスポンスが返されます：
```json
{
  "success": true,
  "message": "Database pinged successfully.",
  "timestamp": "2026-09-22T12:00:00.000Z"
}
```

---

## 💡 トラブルシューティングの知見
- **JSONの構文エラー**: `vercel.json` 内に `//` などのコメントアウトを記述するとVercelのビルドでエラーになります。JSON標準に従いコメントは排除してください。
- **認証エラー (`Unauthorized`)**: `CRON_SECRET` にシェル上でエスケープが必要な記号が含まれていると、ヘッダー認証が失敗する原因になります。英数字のみのシンプルな文字列にするのが安全です。

お疲れ様でした！これにて、アプリケーションの機能実装からインフラ、そして長期運用のための保守システム（第6章）までが完結しました。
