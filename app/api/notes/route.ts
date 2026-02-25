import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// JSONファイルのパス
const notesFilePath = path.join(process.cwd(), 'data', 'notes.json');

// GET /api/notes (メモ一覧の取得)
export async function GET() {
  try {
    const fileContents = await fs.readFile(notesFilePath, 'utf8');
    const notes = JSON.parse(fileContents);
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Failed to read notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

// POST /api/notes (新しいメモの作成)
export async function POST(request: Request) {
  try {
    const newNoteData = await request.json();

    const fileContents = await fs.readFile(notesFilePath, 'utf8');
    const notes = JSON.parse(fileContents);

    // 新しいIDを生成
    const newId = notes.length > 0 ? (Math.max(...notes.map((note: any) => parseInt(note.id))) + 1).toString() : "1";

    const now = new Date().toISOString();
    const newNote = {
      id: newId,
      content: newNoteData.content || '',
      createdAt: now,
      updatedAt: now,
    };

    notes.push(newNote);

    await fs.writeFile(notesFilePath, JSON.stringify(notes, null, 2), 'utf8');

    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    console.error('Failed to create note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
