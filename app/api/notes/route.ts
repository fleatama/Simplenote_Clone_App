import { NextResponse } from "next/server";
import fs from 'fs/promises';
import path from 'path';

// JSONファイルのパス
const notesFilePath = path.join(process.cwd(), 'data', 'notes.json');

// GET /api/notes
export async function GET() {
  try {
    const fileContents = await fs.readFile(notesFilePath, 'utf8');
    const notes = JSON.parse(fileContents);
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Failed to read notes;', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

// POST /api/notes
export async function POST(request: Request) {
  try {
    const newNoteData = await request.json(); // リクエストボディから新しいメモデータを取得
    
    const fileContents = await fs.readFile(notesFilePath, 'utf8');
    const notes = JSON.parse(fileContents);

    // 新しいIDを生成(既存のID+1、または1から開始)
    const newId = notes.length > 0 ? (Max.max(...notes.map((note: any) => parseInt(note.id))) + 1).toString() : "1";

    const now = new Date().toISOString();
    const newNote = {
      id: newId,
      content: newNoteData.content || '', // contentがない場合は空文字列
      createdAt: now,
      updatedAt: now,
      ...newNoteData
    };

    notes.push(newNote);

    await fs.writeFile(notesFilePath, JSON.stringify(notes, null, 2), 'utf8'); // 整形して書き込み
    
    return NextResponse.json(newNote, { status: 201 }); // 201 Createdを返す   
  } catch (error) {
    console.error('Failed to create note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

