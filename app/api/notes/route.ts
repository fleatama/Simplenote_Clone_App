import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { auth } from "@/auth";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const getUserKey = (userId: string) => `user:${userId}:notes`;

// GET /api/notes (メモ一覧の取得)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userKey = getUserKey(session.user.id);
    const allNotes: Record<string, any> = await redis.hgetall(userKey) || {};
    
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userKey = getUserKey(session.user.id);
    const newNoteData = await request.json();

    // UUIDを生成 (絶対に重複しないID)
    const newId = crypto.randomUUID();

    const now = new Date().toISOString();
    const newNote = {
      id: newId,
      content: newNoteData.content || '',
      createdAt: now,
      updatedAt: now,
    };

    // Redisに保存
    await redis.hset(userKey, { [newId]: newNote });

    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    console.error('Failed to create note in DB:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
