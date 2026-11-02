import { useState, useEffect } from "react";
import { Note } from "../page";

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notes");
      if (!res.ok) throw new Error("Failed to fetch notes");
      const data = await res.json();
      setNotes(data);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Failed to fetch notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const saveNote = async (noteId: string, content: string, metadata?: Note["metadata"]) => {
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, metadata }),
      });
      if (!res.ok) throw new Error("Failed to save note");
      const updatedNote: Note = await res.json();
      setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
      return updatedNote;
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      throw err;
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      throw err;
    }
  };

  return { notes, setNotes, loading, error, saveNote, deleteNote, fetchNotes };
};
