import React, { useState, useEffect } from "react";
import { Note } from "../page";

interface MetadataEditorProps {
  note: Note;
  onUpdate: (updatedNote: Note) => void;
  onTagClick: (tag: string) => void;
}

export default function MetadataEditor({ note, onUpdate, onTagClick }: MetadataEditorProps) {
  // ローカルステートで入力を文字列として管理する
  const [tagInput, setTagInput] = useState(note.metadata?.tags.join(', ') || '');
  const [aliasInput, setAliasInput] = useState(note.metadata?.aliases.join(', ') || '');

  // メモが変わった時に同期
  useEffect(() => {
    setTagInput(note.metadata?.tags.join(', ') || '');
    setAliasInput(note.metadata?.aliases.join(', ') || '');
  }, [note.id, note.metadata]);

  const handleSave = () => {
    onUpdate({
      ...note,
      metadata: {
        tags: tagInput.split(',').map(s => s.trim()).filter(Boolean),
        aliases: aliasInput.split(',').map(s => s.trim()).filter(Boolean),
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
  };

  return (
    <div className="p-3 border-start bg-body-tertiary h-100" style={{ width: '300px' }}>
      <h6>プロパティ</h6>
      <div className="mb-3">
        <label className="form-label small text-muted">タグ (カンマ区切り)</label>
        <div className="d-flex flex-wrap gap-1 mb-2">
          {tagInput.split(',').filter(Boolean).map((tag, i) => (
            <span 
              key={i} 
              className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill"
              style={{ cursor: 'pointer' }}
              onClick={() => onTagClick(tag.trim())}
            >
              #{tag.trim()}
            </span>
          ))}
        </div>
        <input
          type="text"
          className="form-control form-control-sm"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="mb-3">
        <label className="form-label small text-muted">エイリアス (カンマ区切り)</label>
        <div className="d-flex flex-wrap gap-1 mb-2">
          {aliasInput.split(',').filter(Boolean).map((alias, i) => (
            <span key={i} className="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill">
              {alias.trim()}
            </span>
          ))}
        </div>
        <input
          type="text"
          className="form-control form-control-sm"
          value={aliasInput}
          onChange={(e) => setAliasInput(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
