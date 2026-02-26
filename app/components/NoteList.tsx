"use client";

import React from "react";
import { getNoteTitle, formatDateTime } from "../../utils/helpers";

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  checkedIds: Set<string>;
  loading: boolean;
  onSelectNote: (note: Note) => void;
  onToggleCheck: (id: string) => void;
}

export default function NoteList({
  notes,
  selectedNoteId,
  checkedIds,
  loading,
  onSelectNote,
  onToggleCheck,
}: NoteListProps) {
  if (loading) {
    return <div className="p-4 text-center"><div className="spinner-border spinner-border-sm text-secondary" /></div>;
  }

  if (notes.length === 0) {
    return <div className="p-4 text-center text-muted small">No notes found.</div>;
  }

  return (
    <div className="list-group list-group-flush">
      {notes.map((note) => (
        <div key={note.id} className="d-flex align-items-stretch border-bottom">
          <div className="px-3 d-flex align-items-center bg-body">
            <input 
              type="checkbox" 
              className="form-check-input" 
              checked={checkedIds.has(note.id)}
              onChange={() => onToggleCheck(note.id)}
              aria-label={`Select: ${getNoteTitle(note.content)}`}
            />
          </div>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onSelectNote(note); }}
            className={`list-group-item list-group-item-action py-3 border-0 flex-grow-1 ${
              note.id === selectedNoteId ? "active" : ""
            }`}
          >
            <div className="d-flex w-100 justify-content-between align-items-center">
              <h6 className={`mb-1 fw-semibold ${note.id === selectedNoteId ? "text-white" : "text-body"}`}>
                {getNoteTitle(note.content) || "Untitled"}
              </h6>
              <small className={note.id === selectedNoteId ? "text-white-50" : "text-muted"} style={{ fontSize: "0.7rem" }}>
                {formatDateTime(note.updatedAt)}
              </small>
            </div>
            <p className={`mb-0 small text-truncate ${note.id === selectedNoteId ? "text-white-50" : "text-muted"}`} style={{ fontSize: "0.8rem" }}>
              {note.content.split("\n").slice(1).join(" ") || "No content"}
            </p>
          </a>
        </div>
      ))}
    </div>
  );
}
