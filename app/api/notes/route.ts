import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// データベースへの接続設定（環境変数から読み込む）
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const REDIS_KEY = 'simplenote_clone_notes';

// GET /api/notes (メモ一覧の取得)
export async function GET() {
  try {
    // RedisのHashからすべてのメモを取得
    const allNotes: Record<string, any> = await redis.hgetall(REDIS_KEY) || {};
    
    // オブジェクトの値を配列に変換し、更新日時が新しい順に並び替える
    const notes = Object.values(allNotes).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Failed to read notes from DB:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

// POST /api/notes (新しいメモの作成)
export async function POST(request: Request) {
  try {
    const newNoteData = await request.json();

    // Redisから現在の最大IDを取得するために全データを読み込む（簡易的な実装）
    const allNotes: Record<string, any> = await redis.hgetall(REDIS_KEY) || {};
    const ids = Object.keys(allNotes).map(id => parseInt(id));
    const newId = ids.length > 0 ? (Math.max(...ids) + 1).toString() : "1";

    const now = new Date().toISOString();
    const newNote = {
      id: newId,
      content: newNoteData.content || '',
      createdAt: now,
      updatedAt: now,
    };

    // RedisのHashに保存 (キー: REDIS_KEY, フィールド: newId, 値: newNote)
    await redis.hset(REDIS_KEY, { [newId]: newNote });

    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    console.error('Failed to create note in DB:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
