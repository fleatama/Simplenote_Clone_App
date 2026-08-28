"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { getNoteTitle, formatDateTime, generateFrontMatter, stripFrontMatter } from "../utils/helpers";
import NoteList from "./components/NoteList";
import MetadataEditor from "./components/MetadataEditor";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import matter from "gray-matter";

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    tags: string[];
    aliases: string[];
  };
}

type ViewMode = "source" | "split" | "reading";

export default function Home() {
  const { data: session, status } = useSession();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedNoteContent, setSelectedNoteContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("source");
  const [showMetadata, setShowMetadata] = useState<boolean>(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  
  // Undo / Redo の履歴管理用 State
  const [contentHistory, setContentHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isInternalChangeRef = useRef<boolean>(false); // 履歴更新による変更か、ユーザー入力による変更かを区別するフラグ
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 履歴に現在の状態を追加する関数
  const pushToHistory = (newContent: string) => {
    setContentHistory((prev) => {
      const nextHistory = prev.slice(0, historyIndex + 1);
      // 直前と同じコンテンツならスタックに追加しない
      if (nextHistory[nextHistory.length - 1] === newContent) {
        return prev;
      }
      const updated = [...nextHistory, newContent];
      // 履歴は最大50件保持
      if (updated.length > 50) {
        updated.shift();
      }
      setHistoryIndex(updated.length - 1);
      return updated;
    });
  };

  // Markdown装飾を挿入する関数
  const insertMarkdown = (syntax: string, placeholder: string = "", type: "wrap" | "block" | "line" = "wrap") => {
    if (!textareaRef.current || !selectedNoteId) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let replacement = "";
    let newCursorStart = start;
    let newCursorEnd = end;
    let newContent = text;

    if (type === "wrap") {
      const content = selectedText || placeholder;
      replacement = `${syntax}${content}${syntax}`;
      newCursorStart = start + syntax.length;
      newCursorEnd = newCursorStart + content.length;
      newContent = text.substring(0, start) + replacement + text.substring(end);
    } else if (type === "block") {
      if (syntax === "link") {
        replacement = `[${selectedText || "リンクテキスト"}](https://)`;
        newCursorStart = start + 1;
        newCursorEnd = newCursorStart + (selectedText || "リンクテキスト").length;
      } else if (syntax === "image") {
        replacement = `![${selectedText || "画像説明"}](https://)`;
        newCursorStart = start + 2;
        newCursorEnd = newCursorStart + (selectedText || "画像説明").length;
      } else if (syntax === "codeblock") {
        const content = selectedText || "code";
        replacement = `\n\`\`\`\n${content}\n\`\`\`\n`;
        newCursorStart = start + 5;
        newCursorEnd = newCursorStart + content.length;
      }
      newContent = text.substring(0, start) + replacement + text.substring(end);
    } else if (type === "line") {
      const beforeText = text.substring(0, start);
      const lastNewLine = beforeText.lastIndexOf("\n");
      const lineStart = lastNewLine === -1 ? 0 : lastNewLine + 1;
      
      const lineText = text.substring(lineStart, end);
      replacement = `${syntax}${lineText}`;
      newCursorStart = start + syntax.length;
      newCursorEnd = end + syntax.length;
      newContent = text.substring(0, lineStart) + replacement + text.substring(end);
    }

    isInternalChangeRef.current = true;
    setSelectedNoteContent(newContent);
    pushToHistory(newContent);

    // 処理完了後、テキストエリアにフォーカスを戻し、選択範囲を復元する
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
    }, 0);
  };

  // Undo / Redo ボタンのハンドリング (Reactステート履歴ベース)
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevContent = contentHistory[prevIndex];
      isInternalChangeRef.current = true;
      setHistoryIndex(prevIndex);
      setSelectedNoteContent(prevContent);
      
      // テキストエリアにフォーカスを当てる
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  const handleRedo = () => {
    if (historyIndex < contentHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextContent = contentHistory[nextIndex];
      isInternalChangeRef.current = true;
      setHistoryIndex(nextIndex);
      setSelectedNoteContent(nextContent);
      
      // テキストエリアにフォーカスを当てる
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  const filteredNotes = activeTag 
    ? notes.filter(n => n.metadata?.tags?.includes(activeTag))
    : notes;

  const handleTagClick = (tag: string) => {
    setActiveTag(tag === activeTag ? null : tag);
  };

  const handleExport = () => {
    const note = notes.find(n => n.id === selectedNoteId);
    if (!note) return;
    const frontMatter = generateFrontMatter(note);
    const blob = new Blob([frontMatter + note.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const title = getNoteTitle(note.content) || "untitled";
    a.download = `${title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkExport = async () => {
    if (checkedIds.size === 0) return;
    const zip = new JSZip();
    notes.forEach(note => {
      if (checkedIds.has(note.id)) {
        const frontMatter = generateFrontMatter(note);
        const noteTitle = getNoteTitle(note.content) || `untitled_${note.id}`;
        const safeNoteTitle = noteTitle.replace(/[<>:"/\\|?*]/g, "_");
        zip.file(`${safeNoteTitle}.md`, frontMatter + note.content);
      }
    });
    try {
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "notes.zip");
    } catch (err: any) {
      setError("一括エクスポートに失敗しました");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setLoading(true);
    const newNotes: Note[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.endsWith(".md")) {
        const textContent = await file.text();
        const { data, content } = matter(textContent);
        const metadata = {
          tags: Array.isArray(data.tags) ? data.tags : [],
          aliases: Array.isArray(data.aliases) ? data.aliases : [],
        };
        try {
          const response = await fetch("/api/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: content.trim(), metadata }),
          });
          if (response.ok) {
            const newNote: Note = await response.json();
            newNotes.push(newNote);
          }
        } catch (err) { console.error("Import failed:", err); }
      }
    }
    if (newNotes.length > 0) setNotes((prev) => [...newNotes, ...prev]);
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    alert(`${newNotes.length} 件のメモをインポートしました。`);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("simplenote-theme", newTheme);
    document.documentElement.setAttribute("data-bs-theme", newTheme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("simplenote-theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-bs-theme", savedTheme);
    }
  }, []);

  const handleSaveNote = async (noteId: string, content: string, metadata?: Note["metadata"]) => {
    setSaveStatus("saving");
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, metadata }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const updatedNote: Note = await response.json();
      setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err: any) {
      setSaveStatus("error");
      setError(err.message);
    }
  };

  const handleCreateNewNote = async () => {
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "" }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const newNote: Note = await response.json();
      setNotes((prev) => [newNote, ...prev]);
      handleSelectNote(newNote);
      setViewMode("source");
    } catch (err: any) { setError(err.message); }
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNoteId(note.id);
    setSelectedNoteContent(note.content);
    // 履歴スタックを初期化
    setContentHistory([note.content]);
    setHistoryIndex(0);
    isInternalChangeRef.current = false;
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("削除しますか？")) return;
    try {
      const response = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("削除失敗");
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (selectedNoteId === noteId) {
        setSelectedNoteId(null);
        setSelectedNoteContent("");
      }
    } catch (err: any) { setError(err.message); }
  };

  const handleBulkDelete = async () => {
    if (checkedIds.size === 0) return;
    if (!confirm("一括削除しますか？")) return;
    try {
      const deletePromises = Array.from(checkedIds).map(id => fetch(`/api/notes/${id}`, { method: "DELETE" }));
      await Promise.all(deletePromises);
      setNotes((prev) => prev.filter((n) => !checkedIds.has(n.id)));
      setCheckedIds(new Set());
    } catch (err: any) { setError("一括削除失敗"); }
  };

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (checkedIds.size === notes.length) setCheckedIds(new Set());
    else setCheckedIds(new Set(notes.map((n) => n.id)));
  };

  const handleInsertTimestamp = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const cursor = textarea.selectionStart;
    const ts = new Date().toLocaleString();
    setSelectedNoteContent(selectedNoteContent.substring(0, cursor) + ts + selectedNoteContent.substring(cursor));
    textarea.focus();
    setTimeout(() => textarea.setSelectionRange(cursor + ts.length, cursor + ts.length), 0);
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/notes").then(r => r.json()).then(setNotes).catch(e => setError(e.message)).finally(() => setLoading(false));
    }
  }, [status]);

  useEffect(() => {
    if (notes.length > 0 && !selectedNoteId) handleSelectNote(notes[0]);
    else if (notes.length === 0) { setSelectedNoteId(null); setSelectedNoteContent(""); }
  }, [notes, selectedNoteId]);

  useEffect(() => {
    if (!selectedNoteId) return;
    
    // ユーザー自身によるキーボード入力の場合、履歴スタックに積む
    if (!isInternalChangeRef.current) {
      if (typingTimeout) clearTimeout(typingTimeout);
      const id = setTimeout(() => {
        pushToHistory(selectedNoteContent);
        
        const note = notes.find(n => n.id === selectedNoteId);
        if (note && note.content !== selectedNoteContent) {
          handleSaveNote(selectedNoteId, selectedNoteContent, note.metadata);
        }
      }, 2000);
      setTypingTimeout(id);
      return () => clearTimeout(id);
    } else {
      // 内部での変更（Undo/Redo やツールバーの挿入）の場合は、即時保存タイマーだけセットする
      isInternalChangeRef.current = false; // フラグを戻す
      if (typingTimeout) clearTimeout(typingTimeout);
      const id = setTimeout(() => {
        const note = notes.find(n => n.id === selectedNoteId);
        if (note && note.content !== selectedNoteContent) {
          handleSaveNote(selectedNoteId, selectedNoteContent, note.metadata);
        }
      }, 2000);
      setTypingTimeout(id);
      return () => clearTimeout(id);
    }
  }, [selectedNoteContent, selectedNoteId]);
  
  useEffect(() => {
    if (!selectedNoteId) return;
    const { data } = matter(selectedNoteContent);
    const parsedMetadata = {
      tags: Array.isArray(data.tags) ? data.tags : [],
      aliases: Array.isArray(data.aliases) ? data.aliases : [],
    };
    const currentNote = notes.find(n => n.id === selectedNoteId);
    if (currentNote && JSON.stringify(currentNote.metadata) !== JSON.stringify(parsedMetadata)) {
      setNotes(prev => prev.map(n => n.id === selectedNoteId ? { ...n, metadata: parsedMetadata } : n));
    }
  }, [selectedNoteContent, selectedNoteId]);

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  if (status === "loading") return <div className="vh-100 d-flex justify-content-center align-items-center"><div className="spinner-border" /></div>;

  if (status === "unauthenticated") return <div className="vh-100 d-flex flex-column justify-content-center align-items-center"><h1 className="mb-4">Simplenote Clone</h1><button className="btn btn-primary" onClick={() => signIn("google")}>Googleでログイン</button></div>;

  return (
    <div className="container-fluid p-0 overflow-hidden vh-100 d-flex flex-column">
      <style jsx global>{`
        .markdown-preview { padding: 2.5rem; overflow-y: auto; flex: 1; min-height: 0; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        .markdown-preview h1 { font-size: 1.8rem; font-weight: 700; margin-top: 0; margin-bottom: 1.25rem; border-bottom: 2px solid var(--bs-border-color); padding-bottom: 0.5rem; }
        .markdown-preview h2 { font-size: 1.45rem; font-weight: 600; margin-top: 1.75rem; margin-bottom: 0.85rem; border-bottom: 1px solid var(--bs-border-color-translucent); padding-bottom: 0.3rem; }
        .markdown-preview h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; }
        .markdown-preview p { margin-bottom: 1rem; }
        .markdown-preview code { background-color: var(--bs-tertiary-bg); padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.9em; font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace; }
        .markdown-preview pre { background-color: var(--bs-tertiary-bg); padding: 1rem; border-radius: 6px; overflow-x: auto; margin-bottom: 1.25rem; }
        .markdown-preview pre code { background-color: transparent; padding: 0; border-radius: 0; font-size: 0.9em; }
        .markdown-preview ul, .markdown-preview ol { margin-bottom: 1rem; padding-left: 2rem; }
        .markdown-preview blockquote { border-left: 4px solid var(--bs-primary-border-subtle); color: var(--bs-secondary-color); padding-left: 1rem; margin: 0 0 1rem 0; }
        .markdown-preview table { width: 100%; margin-bottom: 1rem; border-collapse: collapse; }
        .markdown-preview th, .markdown-preview td { padding: 0.5rem 0.75rem; border: 1px solid var(--bs-border-color); }
        .markdown-preview th { background-color: var(--bs-tertiary-bg); }
        .view-mode-active { background-color: var(--bs-primary) !important; color: white !important; }
        
        /* エディタの書きやすさ向上（フォント設定、スムーズなタイピング、レスポンシブな高さ） */
        .note-textarea {
          font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
          line-height: 1.6;
          min-height: 100%;
          outline: none;
          box-shadow: none !important;
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        .note-textarea:focus {
          background-color: var(--bs-body-bg);
        }
      `}</style>
      <div className="row g-0 flex-grow-1 overflow-hidden">
        <div className="col-md-4 border-end d-flex flex-column h-100">
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-body-tertiary">
            {/* ログインユーザー情報表示 */}
            <div className="small text-muted mb-2 d-flex align-items-center gap-2">
              {session?.user?.image && (
                <img src={session.user.image} alt="User" className="rounded-circle" style={{ width: '24px', height: '24px' }} />
              )}
              <div>
                <div>{session?.user?.name || "ユーザー"}</div>
                <div style={{ fontSize: '0.75rem' }}>{session?.user?.email || "未ログイン"}</div>
              </div>
            </div>
            <div className="d-flex align-items-center gap-3">
              {activeTag ? (
                <div className="badge bg-primary rounded-pill d-flex align-items-center gap-1">#{activeTag}<button className="btn-close btn-close-white ms-1" style={{ fontSize: '0.5rem' }} onClick={() => setActiveTag(null)}></button></div>
              ) : (
                <>
                  <input type="checkbox" className="form-check-input m-0" checked={notes.length > 0 && checkedIds.size === notes.length} onChange={toggleSelectAll} />
                  {checkedIds.size > 0 && (
                    <>
                      <button className="btn btn-link text-danger p-0 border-0" onClick={handleBulkDelete}><i className="bi bi-trash-fill fs-5"></i></button>
                      <button className="btn btn-link text-body p-0 border-0" onClick={handleBulkExport}><i className="bi bi-download fs-5"></i></button>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="d-flex align-items-center gap-3">
              <button className="btn btn-link text-body p-0 border-0" onClick={() => fileInputRef.current?.click()}><i className="bi bi-upload fs-5"></i></button>
              <input type="file" ref={fileInputRef} onChange={handleImport} accept=".md" multiple style={{ display: 'none' }} />
              <button className="btn btn-link text-body p-0 border-0" onClick={handleCreateNewNote}><i className="bi bi-pencil-square fs-5"></i></button>
            </div>
          </div>
          <div className="flex-grow-1 overflow-auto bg-body"><NoteList notes={filteredNotes} selectedNoteId={selectedNoteId} checkedIds={checkedIds} loading={loading} onSelectNote={handleSelectNote} onToggleCheck={toggleCheck} /></div>
        </div>

        <div className="col-md-8 d-flex flex-column h-100 bg-body">
          <div className="px-4 py-2 border-bottom d-flex justify-content-between align-items-center bg-body-tertiary" style={{ minHeight: "57px" }}>
            <div className="d-flex align-items-center gap-3">
              <button className={`btn btn-sm border-0 ${showMetadata ? "view-mode-active" : "btn-outline-secondary"}`} onClick={() => setShowMetadata(!showMetadata)}><i className="bi bi-tag"></i></button>
              <div className="d-flex gap-1 bg-secondary-subtle p-1 rounded">
                <button className={`btn btn-sm border-0 ${viewMode === "source" ? "view-mode-active" : ""}`} onClick={() => setViewMode("source")} title="ソースモード"><i className="bi bi-code-slash"></i></button>
                <button className={`btn btn-sm border-0 ${viewMode === "split" ? "view-mode-active" : ""}`} onClick={() => setViewMode("split")} title="分割モード"><i className="bi bi-layout-split"></i></button>
                <button className={`btn btn-sm border-0 ${viewMode === "reading" ? "view-mode-active" : ""}`} onClick={() => setViewMode("reading")} title="閲覧モード"><i className="bi bi-eye"></i></button>
              </div>
              <button className="btn btn-sm btn-outline-secondary border-0" onClick={toggleTheme}><i className={`bi bi-${theme === "light" ? "moon-fill" : "sun-fill"}`}></i></button>
              <button className="btn btn-sm btn-outline-secondary border-0" onClick={handleInsertTimestamp} disabled={!selectedNoteId || viewMode === 'reading'}><i className="bi bi-clock"></i></button>
              <button className="btn btn-sm btn-outline-secondary border-0" onClick={handleExport} disabled={!selectedNoteId}><i className="bi bi-download"></i></button>
              <button className="btn btn-sm btn-outline-danger border-0" onClick={() => selectedNoteId && handleDeleteNote(selectedNoteId)} disabled={!selectedNoteId}><i className="bi bi-trash"></i></button>
            </div>
          </div>
          
          {/* マークダウン編集ツールバー */}
          {(viewMode === "source" || viewMode === "split") && selectedNoteId && (
            <div className="px-4 py-1 border-bottom d-flex align-items-center gap-1 bg-body-secondary flex-wrap">
              <button className="btn btn-sm btn-outline-secondary border-0" onClick={handleUndo} title="元に戻す"><i className="bi bi-arrow-counterclockwise"></i></button>
              <button className="btn btn-sm btn-outline-secondary border-0" onClick={handleRedo} title="やり直す"><i className="bi bi-arrow-clockwise"></i></button>
              <div className="vr mx-1"></div>
              <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => insertMarkdown("**", "太字", "wrap")} title="太字"><i className="bi bi-type-bold"></i></button>
              <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => insertMarkdown("*", "斜体", "wrap")} title="斜体"><i className="bi bi-type-italic"></i></button>
              <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => insertMarkdown("~~", "打ち消し線", "wrap")} title="打ち消し線"><i className="bi bi-type-strikethrough"></i></button>
              <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => insertMarkdown("`", "コード", "wrap")} title="インラインコード"><i className="bi bi-code"></i></button>
              <div className="vr mx-1"></div>
              <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => insertMarkdown("### ", "見出し", "line")} title="見出し"><i className="bi bi-type-h3"></i></button>
              <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => insertMarkdown("- ", "リスト項目", "line")} title="箇条書きリスト"><i className="bi bi-list-task"></i></button>
              <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => insertMarkdown("1. ", "リスト項目", "line")} title="番号付きリスト"><i className="bi bi-list-ol"></i></button>
              <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => insertMarkdown("- [ ] ", "タスク", "line")} title="タスクリスト"><i className="bi bi-check2-square"></i></button>
              <div className="vr mx-1"></div>
              <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => insertMarkdown("link", "", "block")} title="リンク挿入"><i className="bi bi-link-45deg"></i></button>
              <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => insertMarkdown("image", "", "block")} title="画像挿入"><i className="bi bi-image"></i></button>
              <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => insertMarkdown("codeblock", "", "block")} title="コードブロック"><i className="bi bi-terminal"></i></button>
            </div>
          )}
          <div className="flex-grow-1 overflow-hidden d-flex">
            {(viewMode === "source" || viewMode === "split") && (
              <textarea ref={textareaRef} className="form-control border-0 p-4 fs-5 bg-body text-body note-textarea" style={{ resize: "none", width: viewMode === "split" ? "50%" : "100%" }} value={selectedNoteId !== null ? selectedNoteContent : ""} onChange={(e) => setSelectedNoteContent(e.target.value)} disabled={!selectedNoteId} placeholder="ここに入力するか、マークダウンツールバーを使用してください..."></textarea>
            )}
            {(viewMode === "reading" || viewMode === "split") && (
              <div className="markdown-preview bg-body text-body" style={{ width: viewMode === "split" ? "50%" : "100%", display: "flex", flexDirection: "column" }}>
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                  {matter(selectedNoteContent).content.trim()}
                </ReactMarkdown>
              </div>
            )}
            {showMetadata && selectedNote && (
              <MetadataEditor
                key={selectedNote.id}
                note={selectedNote}
                onUpdate={(u) => {
                  const frontMatter = generateFrontMatter(u);
                  // 堅牢な stripFrontMatter 関数を使って本文のみを完全に取得（ゴミデータも自動で一掃）
                  const cleanContent = stripFrontMatter(u.content);
                  const newContent = `${frontMatter}\n${cleanContent}`;
                  const finalNote = { ...u, content: newContent };
                  setNotes((prev) => prev.map((n) => (n.id === finalNote.id ? finalNote : n)));
                  setSelectedNoteContent(newContent);
                  handleSaveNote(finalNote.id, newContent, finalNote.metadata);
                }}
                onTagClick={handleTagClick}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
