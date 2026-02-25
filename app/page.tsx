"use client"; // クライアントコンポーネントであることを宣言

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
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // メモを保存する関数
  const handleSaveNote = async (noteId: string, content: string) => {
    setSaveStatus('saving');
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedNote: Note = await response.json();
      console.log('メモが更新されました:', updatedNote);

      setNotes(prevNotes =>
        prevNotes.map(note => (note.id === updatedNote.id ? updatedNote : note))
      );
      setSaveStatus('saved');
      // 3秒後にステータスをリセット
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      console.error('メモの更新中にエラーが発生しました:', err);
      setSaveStatus('error');
      setError(err.message);
    }
  };

  // 新規メモ作成
  const handleCreateNewNote = async () => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: '' }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
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

  // メモを削除する関数
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('このメモを削除してもよろしいですか？')) return;

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('削除に失敗しました');
      }

      // 画面上のリストから削除したメモを除外する
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));

      // もし削除したメモが今選択中のものだったら、選択を解除する
      if (selectedNoteId === noteId) {
        setSelectedNoteId(null);
        setSelectedNoteContent('');
      }
    } catch (err: any) {
      console.error('削除中にエラーが発生しました:', err);
      setError(err.message);
    }
  };

  // タイムスタンプ挿入
  const handleInsertTimestamp = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;
    const now = new Date();
    const timestamp = now.toLocaleString();
      
    const newContent =
      selectedNoteContent.substring(0, cursorPosition) +
      timestamp +
      selectedNoteContent.substring(cursorPosition);
    
    setSelectedNoteContent(newContent);
    
    textarea.focus();
    setTimeout(() => {
      textarea.setSelectionRange(cursorPosition + timestamp.length, cursorPosition + timestamp.length);
    }, 0);
  };

  // 初回データ取得
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch('/api/notes');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
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

  // 自動選択
  useEffect(() => {
    if (notes.length > 0 && !selectedNoteId) {
      handleSelectNote(notes[0]);
    } else if (notes.length === 0) {
      setSelectedNoteId(null);
      setSelectedNoteContent('');
    }
  }, [notes, selectedNoteId]);

  // 自動保存のデバウンス処理
  useEffect(() => {
    if (!selectedNoteId) return;

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const newTimeout = setTimeout(() => {
      const originalNote = notes.find(n => n.id === selectedNoteId);
      if (originalNote && originalNote.content !== selectedNoteContent) {
        handleSaveNote(selectedNoteId, selectedNoteContent);
      }
    }, 2000);

    setTypingTimeout(newTimeout);

    return () => {
      if (newTimeout) clearTimeout(newTimeout);
    };
  }, [selectedNoteContent, selectedNoteId]);

  // ヘルパー関数
  const getNoteTitle = (content: string) => {
    const firstLine = content.split('\n')[0];
    return firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine;
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  if (loading) return <div className="container-fluid vh-100 d-flex justify-content-center align-items-center"><div className="spinner-border text-primary" /></div>;
  if (error) return <div className="container-fluid vh-100 d-flex justify-content-center align-items-center text-danger">Error: {error}</div>;

  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        <div className="col-md-4 p-3 border-end bg-light d-flex flex-column">
          <h2 className="mb-3">メモ一覧</h2>
          <div className="flex-grow-1 overflow-auto">
            {notes.length === 0 ? (
              <p>メモがありません。「新規作成」ボタンで作成してください。</p>
            ) : (
              <div className="list-group">
                {notes.map((note) => (
                  <a
                    href="#"
                    key={note.id}
                    onClick={(e) => { e.preventDefault(); handleSelectNote(note); }}
                    className={`list-group-item list-group-item-action flex-column align-items-start ${
                      note.id === selectedNoteId ? 'active' : ''
                    }`}
                  >
                    <div className="d-flex w-100 justify-content-between">
                      <h5 className="mb-1">{getNoteTitle(note.content) || '無題のメモ'}</h5>
                      <small className={note.id === selectedNoteId ? 'text-white' : 'text-muted'}>
                        {formatDateTime(note.updatedAt)}
                      </small>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
          <button className="btn btn-primary mt-3 d-flex align-items-center justify-content-center" onClick={handleCreateNewNote} title="新規作成">
            <i className="bi bi-plus-lg"></i>
          </button>
        </div>

        <div className="col-md-8 p-3 d-flex flex-column">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="mb-0">
              メモを編集
              {saveStatus === 'saving' && <small className="ms-3 text-muted" style={{ fontSize: '0.5em' }}>保存中...</small>}
              {saveStatus === 'saved' && <small className="ms-3 text-success" style={{ fontSize: '0.5em' }}>✓ 保存済み</small>}
              {saveStatus === 'error' && <small className="ms-3 text-danger" style={{ fontSize: '0.5em' }}>⚠️ 保存失敗</small>}
            </h2>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-danger d-flex align-items-center" onClick={() => selectedNoteId && handleDeleteNote(selectedNoteId)} disabled={selectedNoteId === null} title="削除">
                <i className="bi bi-trash"></i>
              </button>
              <button className="btn btn-secondary d-flex align-items-center" onClick={handleInsertTimestamp} disabled={selectedNoteId === null} title="タイムスタンプ挿入">
                <i className="bi bi-clock"></i>
              </button>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            className="form-control flex-grow-1"
            placeholder="メモを選択するか、新規作成してください。"
            style={{ minHeight: "200px" }}
            value={selectedNoteId !== null ? selectedNoteContent : ""}
            onChange={(e) => setSelectedNoteContent(e.target.value)}
            disabled={selectedNoteId === null}
          ></textarea>
        </div>
      </div>
    </div>
  );
}
