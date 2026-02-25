"use client";

import React, { useState, useEffect, useRef } from "react";

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedNoteContent, setSelectedNoteContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // ダークモード用の状態
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // テーマ切り替え
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('simplenote-theme', newTheme);
    document.documentElement.setAttribute('data-bs-theme', newTheme);
  };

  // 初期テーマの読み込み
  useEffect(() => {
    const savedTheme = localStorage.getItem('simplenote-theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-bs-theme', savedTheme);
    }
  }, []);

  // メモを保存する関数
  const handleSaveNote = async (noteId: string, content: string) => {
    setSaveStatus('saving');
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const updatedNote: Note = await response.json();
      setNotes(prevNotes =>
        prevNotes.map(note => (note.id === updatedNote.id ? updatedNote : note))
      );
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveStatus('error');
      setError(err.message);
    }
  };

  // 新規メモ作成
  const handleCreateNewNote = async () => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '' }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const newNote: Note = await response.json();
      setNotes(prevNotes => [newNote, ...prevNotes]);
      handleSelectNote(newNote);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNoteId(note.id);
    setSelectedNoteContent(note.content);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('このメモを削除してもよろしいですか？')) return;
    try {
      const response = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('削除に失敗しました');
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      if (selectedNoteId === noteId) {
        setSelectedNoteId(null);
        setSelectedNoteContent('');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleInsertTimestamp = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;
    const now = new Date();
    const timestamp = now.toLocaleString();
    const newContent = selectedNoteContent.substring(0, cursorPosition) + timestamp + selectedNoteContent.substring(cursorPosition);
    setSelectedNoteContent(newContent);
    textarea.focus();
    setTimeout(() => {
      textarea.setSelectionRange(cursorPosition + timestamp.length, cursorPosition + timestamp.length);
    }, 0);
  };

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch('/api/notes');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data: Note[] = await response.json();
        setNotes(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  useEffect(() => {
    if (!selectedNoteId) return;
    if (typingTimeout) clearTimeout(typingTimeout);
    const newTimeout = setTimeout(() => {
      const originalNote = notes.find(n => n.id === selectedNoteId);
      if (originalNote && originalNote.content !== selectedNoteContent) {
        handleSaveNote(selectedNoteId, selectedNoteContent);
      }
    }, 2000);
    setTypingTimeout(newTimeout);
    return () => { if (newTimeout) clearTimeout(newTimeout); };
  }, [selectedNoteContent, selectedNoteId]);

  const getNoteTitle = (content: string) => {
    const firstLine = content.trim().split('\n')[0];
    return firstLine.length > 25 ? firstLine.substring(0, 25) + '...' : firstLine;
  };

  const formatDateTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('ja-JP', { 
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  if (loading) return <div className="vh-100 d-flex justify-content-center align-items-center"><div className="spinner-border text-secondary" /></div>;
  if (error) return <div className="vh-100 d-flex justify-content-center align-items-center text-danger">Error: {error}</div>;

  return (
    <div className="container-fluid p-0 overflow-hidden">
      <div className="row g-0 vh-100">
        {/* 左ペイン: メモ一覧 */}
        <div className="col-md-4 border-end d-flex flex-column h-100">
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-body-tertiary">
            <h6 className="mb-0 fw-bold text-secondary text-uppercase tracking-wider" style={{ fontSize: '0.75rem' }}>All Notes</h6>
            <button className="btn btn-link text-body p-0 border-0" onClick={handleCreateNewNote} title="新規作成">
              <i className="bi bi-pencil-square fs-5"></i>
            </button>
          </div>
          <div className="flex-grow-1 overflow-auto bg-body">
            {notes.length === 0 ? (
              <div className="p-4 text-center text-muted small">メモがありません</div>
            ) : (
              <div className="list-group list-group-flush">
                {notes.map((note) => (
                  <a
                    href="#"
                    key={note.id}
                    onClick={(e) => { e.preventDefault(); handleSelectNote(note); }}
                    className={`list-group-item list-group-item-action py-3 border-bottom ${
                      note.id === selectedNoteId ? 'active' : ''
                    }`}
                  >
                    <div className="d-flex w-100 justify-content-between align-items-center">
                      <h6 className={`mb-1 fw-semibold ${note.id === selectedNoteId ? 'text-white' : 'text-body'}`}>
                        {getNoteTitle(note.content) || '無題のメモ'}
                      </h6>
                      <small className={note.id === selectedNoteId ? 'text-white-50' : 'text-muted'} style={{ fontSize: '0.7rem' }}>
                        {formatDateTime(note.updatedAt)}
                      </small>
                    </div>
                    <p className={`mb-0 small text-truncate ${note.id === selectedNoteId ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.8rem' }}>
                      {note.content.split('\n').slice(1).join(' ') || '内容なし'}
                    </p>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右ペイン: 編集エリア */}
        <div className="col-md-8 d-flex flex-column h-100">
          <div className="px-4 py-2 border-bottom d-flex justify-content-between align-items-center bg-body-tertiary" style={{ minHeight: '57px' }}>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              {selectedNote && (
                <>
                  <span className="me-3">作成: {formatDateTime(selectedNote.createdAt)}</span>
                  <span>更新: {formatDateTime(selectedNote.updatedAt)}</span>
                </>
              )}
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="save-status">
                {saveStatus === 'saving' && <small className="text-muted animate-pulse">保存中...</small>}
                {saveStatus === 'saved' && <small className="text-success fw-bold">✓ 保存済み</small>}
                {saveStatus === 'error' && <small className="text-danger">⚠️ 失敗</small>}
              </div>
              <div className="d-flex gap-2">
                {/* テーマ切り替えボタン */}
                <button className="btn btn-sm btn-outline-secondary border-0" onClick={toggleTheme} title="テーマ切り替え">
                  <i className={`bi bi-${theme === 'light' ? 'moon-fill' : 'sun-fill'}`}></i>
                </button>
                <button className="btn btn-sm btn-outline-secondary border-0" onClick={handleInsertTimestamp} disabled={!selectedNoteId} title="タイムスタンプ挿入">
                  <i className="bi bi-clock"></i>
                </button>
                <button className="btn btn-sm btn-outline-danger border-0" onClick={() => selectedNoteId && handleDeleteNote(selectedNoteId)} disabled={!selectedNoteId} title="削除">
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            className="form-control border-0 flex-grow-1 p-4 fs-5 bg-body text-body"
            placeholder="ここにメモを入力..."
            style={{ 
              resize: 'none', 
              boxShadow: 'none', 
              lineHeight: '1.6', 
            }}
            value={selectedNoteId !== null ? selectedNoteContent : ""}
            onChange={(e) => setSelectedNoteContent(e.target.value)}
            disabled={!selectedNoteId}
          ></textarea>
        </div>
      </div>
    </div>
  );
}
