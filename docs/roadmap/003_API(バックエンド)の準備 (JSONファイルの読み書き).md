# 3. API(バックエンド)の準備 (JSONファイルの読み書き)

メモデータを保存、取得、更新、削除するためのバックエンドAPIを実装した。データストアにはシンプルなJSONファイル (`data/notes.json`) を使用。

## 主な作業内容

1.  **GET / POST エンドポイントの実装:**
    - `app/api/notes/route.ts` を作成。
    - `GET` メソッド: すべてのメモを `notes.json` から読み込んで返す。
    - `POST` メソッド: 新しいメモを受け取り、IDを採番して `notes.json` に追記する。
    - デバッグ: `POST` 時に `Max.max` を `Math.max` に修正するタイプミスを解決した。

2.  **PUT / DELETE エンドポイントの実装:**
    - `app/api/notes/[id]/route.ts` を作成し、特定のIDを持つメモを操作するエンドポイントを実装。
    - `PUT` メソッド: 指定されたIDのメモの内容を更新する。
    - `DELETE` メソッド: 指定されたIDのメモを削除する。
    - デバッグ:
        - `console.error` のタイプミスを修正。
        - Next.jsの実行環境で `params` オブジェクトからIDを正常に取得できない問題を、`request.url` から直接IDを解析する方法で回避し、解決した。
