# 第1章：プロジェクトの立ち上げとローカルJSON APIの構築

目次に戻る: [[000_tutorial_MOC]] | 次の章へ: [[chapter2_next_auth_and_ui]]

---

## 🎯 この章のゴール
- Next.js の App Router 環境を理解し、APIを作成できるようになる。
- 外部データベースを使う前に、ローカルファイル（`data/notes.json`）を読み書きするモックAPIを自力で構築する。
- RESTful な 4大メソッド（`GET`, `POST`, `PUT`, `DELETE`）を手打ちで書き、CRUD（作成・読取・更新・削除）の基礎を身体に染み込ませる。

---

## 1. ノートの「データ構造（型）」を決めよう

プログラミングで最も大切なのは、**「どんなデータを取り扱うか」** を明確にすることです。
まず、Simplenote で扱うメモデータの「型（Type）」を定義します。

### ノートの基本形（TypeScript）
メモ帳に必要な情報は驚くほどシンプルです。

```typescript
// types/note.ts
export interface Note {
  id: string;        // メモを一意に識別するID（例: "1", "abc-123"）
  content: string;   // メモの本文（タイトルもマークダウンの1行目に含まれる）
  createdAt: string; // 作成日時（ISO 8601形式の文字列）
  updatedAt: string; // 最終更新日時
}
```

> **💡 解説**:
> Simplenote には「タイトル入力欄」という独立した項目がありません。**「1行目が自動的にタイトルになる」** という極めて合理的な仕様になっています。そのため、データとしては `content`（本文）が1つあれば十分なのです。

---

## 2. ローカルモック用 JSON ファイルの作成

最初は複雑なクラウドデータベースを使わず、パソコン内のファイルにデータを保存する仕組みを作りましょう。これが理解できれば、バックエンドの仕組みが丸見えになります。

プロジェクトの直下に `data/notes.json` を作成し、初期データを手で入力します。

```json
[
  {
    "id": "1",
    "content": "# 初めてのノート\n\nSimplenoteクローンへようこそ！",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
]
```

---

## 3. 全ノート取得（GET）と新規作成（POST）APIを作ろう

Next.js App Router では、フォルダの階層構造がそのまま URL になります。
`app/api/notes/route.ts` を作成します。

### コードの手打ちハンズオン (`app/api/notes/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// notes.json の絶対パスを解決する
const filePath = path.join(process.cwd(), 'data', 'notes.json');

// ヘルパー関数: ファイルからノート一覧を読み出す
function getNotes(): any[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const fileData = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileData);
}

// ヘルパー関数: ファイルにノート一覧を書き込む
function saveNotes(notes: any[]) {
  fs.writeFileSync(filePath, JSON.stringify(notes, null, 2), 'utf-8');
}

// 1. GET: 全てのノートを取得する
export async function GET() {
  try {
    const notes = getNotes();
    // 日時が新しい順（降順）に並び替えて返す
    notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return NextResponse.json(notes, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'データの読み込みに失敗しました' }, { status: 500 });
  }
}

// 2. POST: 新しいノートを1件作成する
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const notes = getNotes();

    const now = new Date().toISOString();
    const newNote = {
      id: Date.now().toString(), // 簡易的なユニークID生成
      content: body.content || '',
      createdAt: now,
      updatedAt: now,
    };

    // 配列の先頭に追加
    notes.unshift(newNote);
    saveNotes(notes);

    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'ノートの作成に失敗しました' }, { status: 500 });
  }
}
```

---

## 4. 個別ノートの更新（PUT）と削除（DELETE）APIを作ろう

特定のノートを指定して更新したり削除したりするには、URLにメモのIDを含めます（例: `/api/notes/1`）。
Next.js では `app/api/notes/[id]/route.ts` という「角括弧」を使ったフォルダを作ります。

### コードの手打ちハンズオン (`app/api/notes/[id]/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'notes.json');

function getNotes(): any[] {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveNotes(notes: any[]) {
  fs.writeFileSync(filePath, JSON.stringify(notes, null, 2), 'utf-8');
}

// 3. PUT: 特定のノートを更新する
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Next.js 15以降は params が Promise
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const notes = getNotes();

    const targetIndex = notes.findIndex((n) => n.id === id);
    if (targetIndex === -1) {
      return NextResponse.json({ error: 'ノートが見つかりません' }, { status: 404 });
    }

    // 更新日時を現在にして内容を書き換え
    notes[targetIndex] = {
      ...notes[targetIndex],
      content: body.content !== undefined ? body.content : notes[targetIndex].content,
      updatedAt: new Date().toISOString(),
    };

    saveNotes(notes);
    return NextResponse.json(notes[targetIndex], { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  }
}

// 4. DELETE: 特定のノートを削除する
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let notes = getNotes();

    const filteredNotes = notes.filter((n) => n.id !== id);
    if (notes.length === filteredNotes.length) {
      return NextResponse.json({ error: 'ノートが見つかりません' }, { status: 404 });
    }

    saveNotes(filteredNotes);
    return NextResponse.json({ message: '削除しました' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });
  }
}
```

---

## 5. つまずきやすいエラーと解決策（デバッグ道場）

### ⚠️ エラー1: `params` に直接アクセスして怒られる
- **現象**: `const id = params.id;` と書くと型エラー、または実行時エラーになる。
- **原因**: Next.js 15から、動的ルーティングの `params` は **Promise** に変更されました。
- **解決策**: 必ず `const { id } = await params;` のように `await` して取り出しましょう。
- 関連ドキュメント: [[../troubleshooting/nextjs_api_params_promise_error|nextjs_api_params_promise_error]]

### ⚠️ エラー2: `request.json()` でパースエラー
- **現象**: `SyntaxError: Unexpected end of JSON input`
- **原因**: 送られてきたリクエストのボディが空（Bodyが空のまま送信した）のときに発生します。
- **解決策**: フロント側でリクエストを投げる際、必ず `headers: { 'Content-Type': 'application/json' }` を指定し、`body: JSON.stringify({ ... })` をセットします。

---

## チェックテスト（自分で確認してみよう）
1. ターミナルから `curl http://localhost:3000/api/notes` を叩き、初期メモが配列で返ってくるか？
2. `curl -X POST -H "Content-Type: application/json" -d '{"content":"テストメモ"}' http://localhost:3000/api/notes` を実行したとき、`data/notes.json` の中に新しいメモが書き込まれているか？

これが確認できたら、APIの根幹は完成です！

---

### 次に進む
バックエンドの基礎ができたら、次は画面（UI）を作り、ユーザーログイン機能を追加しましょう。
👉 **[[chapter2_next_auth_and_ui|第2章：NextAuthによる認証と、3カラムUIの構築]]** へ進む。
