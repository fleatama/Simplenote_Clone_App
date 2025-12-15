import React from 'react';

export default function Home() {
  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        { /* 左ペイン: メモ一覧 */ }
        <div className="col-md-4 p-3 border-end bd-light d-flex flex-column">
          <h2 className="mb-3">メモ一覧</h2>
          <div className="flex-grow-1 overflow-auto">
            {/* ここにメモ一覧が表示されます */}
            <ul className="list-group">
              <li className="list-group-item">メモ 1</li>
              <li className="list-group-item active">メモ 2(選択中)</li>
              <li className="list-group-item">メモ 3</li>
            </ul>
          </div>
          <button className="btn btn-primary mt-3">新規作成</button>
        </div>
 
      { /* 右ペイン: 編集エリア */ }
      <div className="col-md-8 p-3 d-flex flex-column">
        <h2 className="mb-3">メモを編集</h2>
        <textarea
          className="form-control flex-grow-1"
          placeholder="メモをここに入力..."
          style={{ minHeight: '200px' }}
        ></textarea>
        </div>
      </div>
    </div>
  );
}
