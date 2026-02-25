import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const REDIS_KEY = 'simplenote_clone_notes';

// PUT /api/notes/[id] (メモの更新)
export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const updatedNoteData = await request.json();

    // Redisから既存のメモを取得
    const existingNote: any = await redis.hget(REDIS_KEY, id);

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updatedNote = {
      ...existingNote,
      ...updatedNoteData,
      updatedAt: now,
      id: id,
    };

    // Redisに上書き保存
    await redis.hset(REDIS_KEY, { [id]: updatedNote });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('Failed to update note in DB:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

// DELETE /api/notes/[id] (メモの削除)
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // RedisのHashから指定したIDのフィールドを削除
    const deletedCount = await redis.hdel(REDIS_KEY, id);

    if (deletedCount === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Failed to delete note from DB:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
