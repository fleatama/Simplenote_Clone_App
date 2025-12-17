"use client"; // クライアントコンポーネントであることを宣言
import React, { useState, useEffect } from "react";

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
  }, []); // 空の依存配列でコンポーネントマウント時に一度だけ実行

  // メモのタイトルを生成するヘルパー関数
  const getNoteTitle = (content: string) => {
    const firstLines = content.split('\n')[0];
    return firstLines.length > 30 ? firstLines.substring(0, 30) + '...' : firstLines;
  };

  // 日付をフォーマットするヘルパー関数
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString(); // ロケールに合わせた形式で表示
  };

  if (loading) {
  return (
    <div className="container-fluid vh-100 d-flex justify-content-center align-items-center">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading notes...</span>
      </div>
    </div>
  );
}

if (error) {
  return (
    <div className="container-fluid vh-100 d-flex justify-content-center align-items-center text-danger">
      Error: {error}
    </div>
  );
}

  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        {/* 左ペイン: メモ一覧 */}
        <div className="col-md-4 p-3 border-end bd-light d-flex flex-column">
          <h2 className="mb-3">メモ一覧</h2>
          <div className="flex-grow-1 overflow-auto">
            {notes.length === 0 ? (
              <p>メモがありません。「新規作成」ボタンで作成してください。</p>
            ) : (
              <div className="list-group">
                {notes.map((note) => (
                  <a
                    href="#" // TODO: クリックで編集できるようにする
                    key={note.id}
                    className="list-group-item list-group-item-action flex-column align-items-start"
                    >
                      <div className="d-flex w-100 justify-content-between">
                        <h5 className="mb-1">{getNoteTitle(note.content)}</h5>
                        <small className="text-muted">{formatDateTime(note.updatedAt)}</small>
                      </div>
                      <p className="mb-1 text-muted small">ID: {note.id}</p>
                    </a>
                ))}
              </div>
            )}
          </div>
          <button className="btn btn-primary mt-3">新規作成</button>
        </div>

        {/* 右ペイン: 編集エリア */}
        <div className="col-md-8 p-3 d-flex flex-column">
          <h2 className="mb-3">メモを編集</h2>
          <textarea
            className="form-control flex-grow-1"
            placeholder="メモをここに入力..."
            style={{ minHeight: "200px" }}
            value={notes.length > 0 ? notes[0].content : ''} // とりあえず最初のメモを表示
            readOnly // TODO: 編集可能にする
          ></textarea>
        </div>
      </div>
    </div>
  );
}
