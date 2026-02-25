import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const notesFilePath = path.join(process.cwd(), 'data', 'notes.json');

// PUT /api/notes/[id] (メモの更新)
export async function PUT(request: Request) {
  try {
    // URLからIDを取得
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const updatedNoteData = await request.json();

    const fileContents = await fs.readFile(notesFilePath, 'utf8');
    let notes = JSON.parse(fileContents);

    const noteIndex = notes.findIndex((note: any) => note.id === id);

    if (noteIndex === -1) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    notes[noteIndex] = {
      ...notes[noteIndex],
      ...updatedNoteData,
      updatedAt: now,
      id: id,
    };

    await fs.writeFile(notesFilePath, JSON.stringify(notes, null, 2), 'utf8');

    return NextResponse.json(notes[noteIndex]);
  } catch (error) {
    console.error('Failed to update note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

// DELETE /api/notes/[id] (メモの削除)
export async function DELETE(request: Request) {
  try {
    // URLからIDを取得
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const fileContents = await fs.readFile(notesFilePath, 'utf8');
    let notes = JSON.parse(fileContents);

    const initialLength = notes.length;
    notes = notes.filter((note: any) => note.id !== id);

    if (notes.length === initialLength) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    await fs.writeFile(notesFilePath, JSON.stringify(notes, null, 2), 'utf8');

    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Failed to delete note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
