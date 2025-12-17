import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const notesFilePath = path.join(process.cwd(), "data", "notes.json");

// PUT /api/notes/[id]
export async function PUT(
  request: Request,
  context: { params: { id: string } },
) {
  try {
    // ここから変更
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const id = pathSegments[pathSegments.length - 1];
    // ここまで変更
    const updateNoteData = await request.json();

    const fileContents = await fs.readFile(notesFilePath, "utf8");
    let notes = JSON.parse(fileContents);

    const noteIndex = notes.findIndex((note: any) => note.id == id);

    if (noteIndex === -1) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    notes[noteIndex] = {
      ...notes[noteIndex],
      ...updateNoteData,
      updatedAt: now,
      id: id, // IDは変更しない
    };

    await fs.writeFile(notesFilePath, JSON.stringify(notes, null, 2), "utf8");

    return NextResponse.json(notes[noteIndex]);
  } catch (error) {
    console.error(`Failed to update note:`, error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 },
    );
  }
}

// DELETE /api/notes/[id]
export async function DELETE(
  request: Request,
  params: { params: { id: string } },
) {
  try {
    // ここから変更
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const id = pathSegments[pathSegments.length - 1];
    // ここまで変更

    const fileContents = await fs.readFile(notesFilePath, "utf8");
    let notes = JSON.parse(fileContents);

    const initialLength = notes.length;
    notes = notes.filter((note: any) => note.id !== id);

    if (notes.length === initialLength) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    await fs.writeFile(notesFilePath, JSON.stringify(notes, null, 2), "utf8");

    return NextResponse.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error(`Failed to delete note :`, error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 },
    );
  }
}
