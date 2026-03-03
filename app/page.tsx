"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { getNoteTitle, formatDateTime } from "../utils/helpers";
import NoteList from "./components/NoteList";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// 表示モードの型定義
type ViewMode = 'source' | 'split' | 'reading';

export default function Home() {
  const { data: session, status } = useSession();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedNoteContent, setSelectedNoteContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  
  // Obsidian風の表示モード状態
  const [viewMode, setViewMode] = useState<ViewMode>('source');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // テーマ切り替え
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('simplenote-theme', newTheme);
    document.documentElement.setAttribute('data-bs-theme', newTheme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('simplenote-theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-bs-theme', savedTheme);
    }
  }, []);

  // メモを保存
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
      setViewMode('source'); // 新規作成時は編集モードにする
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNoteId(note.id);
    setSelectedNoteContent(note.content);
  };

  // 個別削除
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('このメモを削除してもよろしいですか？')) return;
    try {
      const response = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('削除に失敗しました');
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      setCheckedIds(prev => {
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
      if (selectedNoteId === noteId) {
        setSelectedNoteId(null);
        setSelectedNoteContent('');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // 一括削除
  const handleBulkDelete = async () => {
    if (checkedIds.size === 0) return;
    if (!confirm(`${checkedIds.size} 件のメモを一括削除してもよろしいですか？`)) return;
    try {
      const deletePromises = Array.from(checkedIds).map(id => fetch(`/api/notes/${id}`, { method: 'DELETE' }));
      await Promise.all(deletePromises);
      setNotes(prevNotes => prevNotes.filter(note => !checkedIds.has(note.id)));
      if (selectedNoteId && checkedIds.has(selectedNoteId)) {
        setSelectedNoteId(null);
        setSelectedNoteContent('');
      }
      setCheckedIds(new Set());
    } catch (err: any) {
      setError('一括削除に失敗しました');
    }
  };

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (checkedIds.size === notes.length) setCheckedIds(new Set());
    else setCheckedIds(new Set(notes.map(n => n.id)));
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
    if (status === "authenticated") {
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
    }
  }, [status]);

  useEffect(() => {
    if (notes.length > 0 && !selectedNoteId) {
      handleSelectNote(notes[0]);
    } else if (notes.length === 0) {
      setSelectedNoteId(null);
      setSelectedNoteContent('');
    }
  }, [notes, selectedNoteId]);

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

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  if (status === "loading") return <div className="vh-100 d-flex justify-content-center align-items-center bg-body"><div className="spinner-border text-secondary" /></div>;

  if (status === "unauthenticated") {
    return (
      <div className="vh-100 d-flex flex-column justify-content-center align-items-center bg-body">
        <h1 className="mb-4 fw-bold">Simplenote Clone</h1>
        <p className="text-muted mb-4">書きたいときに、すぐに。シンプルで高速なメモアプリ。</p>
        <button className="btn btn-primary btn-lg d-flex align-items-center gap-2" onClick={() => signIn("google")}>
          <i className="bi bi-google"></i> Googleでログイン
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 overflow-hidden">
      <style jsx global>{`
        .markdown-preview {
          padding: 2rem;
          height: 100%;
          overflow-y: auto;
          line-height: 1.6;
        }
        .markdown-preview h1, .markdown-preview h2, .markdown-preview h3 {
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--bs-border-color);
          padding-bottom: 0.3rem;
        }
        .markdown-preview code {
          background-color: var(--bs-tertiary-bg);
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
        }
        .markdown-preview pre {
          background-color: var(--bs-tertiary-bg);
          padding: 1rem;
          border-radius: 8px;
        }
        .markdown-preview blockquote {
          border-left: 4px solid var(--bs-border-color);
          padding-left: 1rem;
          color: var(--bs-secondary-color);
        }
        .markdown-preview table {
          width: 100%;
          margin-bottom: 1rem;
          border-collapse: collapse;
        }
        .markdown-preview th, .markdown-preview td {
          border: 1px solid var(--bs-border-color);
          padding: 0.5rem;
        }
        .view-mode-active {
          background-color: var(--bs-primary) !important;
          color: white !important;
        }
      `}</style>
      <div className="row g-0 vh-100">
        <div className="col-md-4 border-end d-flex flex-column h-100">
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-body-tertiary">
            <div className="d-flex align-items-center gap-3">
              <input type="checkbox" className="form-check-input m-0" checked={notes.length > 0 && checkedIds.size === notes.length} onChange={toggleSelectAll} title="すべて選択/解除" />
              {checkedIds.size > 0 && (
                <button className="btn btn-link text-danger p-0 border-0" onClick={handleBulkDelete} title="選択したメモを削除">
                  <i className="bi bi-trash-fill fs-5"></i>
                </button>
              )}
            </div>
            <button className="btn btn-link text-body p-0 border-0" onClick={handleCreateNewNote} title="新規作成">
              <i className="bi bi-pencil-square fs-5"></i>
            </button>
          </div>
          <div className="flex-grow-1 overflow-auto bg-body">
            <NoteList notes={notes} selectedNoteId={selectedNoteId} checkedIds={checkedIds} loading={loading} onSelectNote={handleSelectNote} onToggleCheck={toggleCheck} />
          </div>
          <div className="p-3 border-top bg-body-tertiary d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2 overflow-hidden">
              {session?.user?.image && <img src={session.user.image} width={24} height={24} className="rounded-circle" alt="User" />}
              <small className="text-muted text-truncate">{session?.user?.name}</small>
            </div>
            <button className="btn btn-sm btn-link text-muted p-0 border-0" onClick={() => signOut()} title="ログアウト">
              <i className="bi bi-box-arrow-right fs-5"></i>
            </button>
          </div>
        </div>

        <div className="col-md-8 d-flex flex-column h-100 bg-body">
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
              <div className="d-flex gap-1 bg-secondary-subtle p-1 rounded">
                {/* モード切り替えボタン群 */}
                <button className={`btn btn-sm border-0 ${viewMode === 'source' ? 'view-mode-active' : ''}`} onClick={() => setViewMode('source')} title="ソースモード">
                  <i className="bi bi-code-slash"></i>
                </button>
                <button className={`btn btn-sm border-0 ${viewMode === 'split' ? 'view-mode-active' : ''}`} onClick={() => setViewMode('split')} title="分割モード">
                  <i className="bi bi-layout-split"></i>
                </button>
                <button className={`btn btn-sm border-0 ${viewMode === 'reading' ? 'view-mode-active' : ''}`} onClick={() => setViewMode('reading')} title="閲覧モード">
                  <i className="bi bi-eye"></i>
                </button>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-secondary border-0" onClick={toggleTheme} title="テーマ切り替え">
                  <i className={`bi bi-${theme === 'light' ? 'moon-fill' : 'sun-fill'}`}></i>
                </button>
                <button className="btn btn-sm btn-outline-secondary border-0" onClick={handleInsertTimestamp} disabled={!selectedNoteId || viewMode === 'reading'} title="タイムスタンプ挿入">
                  <i className="bi bi-clock"></i>
                </button>
                <button className="btn btn-sm btn-outline-danger border-0" onClick={() => selectedNoteId && handleDeleteNote(selectedNoteId)} disabled={!selectedNoteId} title="削除">
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-grow-1 overflow-hidden d-flex">
            {/* エディタ部分 (Source または Split モードで表示) */}
            {(viewMode === 'source' || viewMode === 'split') && (
              <textarea
                ref={textareaRef}
                className={`form-control border-0 p-4 fs-5 bg-body text-body ${viewMode === 'split' ? 'border-end' : ''}`}
                placeholder="ここにメモを入力..."
                style={{ resize: 'none', boxShadow: 'none', lineHeight: '1.6', width: viewMode === 'split' ? '50%' : '100%' }}
                value={selectedNoteId !== null ? selectedNoteContent : ""}
                onChange={(e) => setSelectedNoteContent(e.target.value)}
                disabled={!selectedNoteId}
              ></textarea>
            )}
            
            {/* プレビュー部分 (Reading または Split モードで表示) */}
            {(viewMode === 'reading' || viewMode === 'split') && (
              <div 
                className="markdown-preview bg-body text-body" 
                style={{ width: viewMode === 'split' ? '50%' : '100%' }}
              >
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm, remarkBreaks]} 
                  rehypePlugins={[rehypeSanitize]}
                  components={{
                    // リンクタグ（a）の動作をカスタマイズ
                    a: ({ node, ...props }) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" />
                    ),
                  }}
                >
                  {selectedNoteContent}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
