# 第2章：NextAuthによる認証と、3カラムUIの構築

前へ: [[chapter1_setup_and_json_api]] | 目次に戻る: [[000_tutorial_MOC]] | 次の章へ: [[chapter3_vercel_kv_integration]]

---

## 🎯 この章のゴール
- Simplenote のミニマルで洗練された「3カラムUI」を自力で構築する。
- あなたが発案した核となる機能**「タイムスタンプ自動挿入ボタン」**をエディタに実装する。
- `NextAuth` を導入し、メモデータをログインユーザーごとに保護する基盤を整える。

---

## 1. Simplenoteのレイアウト構造を理解する（3カラムUI）

Simplenote の使いやすさの秘密は、画面が3つに美しく分割されている点にあります。

```text
+----------------+--------------------------+------------------------------------+
| 1. サイドバー   | 2. ノート一覧             | 3. エディタ領域                     |
|  (メニュー/タグ)|  (タイトル・日時の一覧)  |  (タイムスタンプボタン / 入力欄)    |
|                |                          |                                    |
| [＋ 新規ノート] | ・買い物リスト            | # 買い物リスト                      |
|                |   2026/09/20             |                                    |
| [全ノート]     | ・アイデアメモ           | - [ ] 牛乳                          |
| [ゴミ箱]       |   2026/09/19             | - [ ] パン                          |
+----------------+--------------------------+------------------------------------+
```

### レイアウトの基本骨格（Flexbox）
CSS Flexbox を使うと、驚くほど簡単に3カラムが作れます。

```tsx
<div className="flex h-screen w-full overflow-hidden bg-white">
  {/* 1. 一番左: ナビゲーションサイドバー (幅: 約 200px) */}
  <aside className="w-48 border-r border-gray-200 bg-gray-50 p-4">
    {/* 新規作成ボタンやタグ一覧 */}
  </aside>

  {/* 2. 中央: ノート一覧 (幅: 約 320px) */}
  <section className="w-80 border-r border-gray-200 overflow-y-auto">
    {/* ノートのカード一覧 */}
  </section>

  {/* 3. 右側: メインエディタ (画面いっぱいに広がる) */}
  <main className="flex-1 flex flex-col h-full">
    {/* ツールバー & テキスト入力エリア */}
  </main>
</div>
```

---

## 2. あなたの発案機能：タイムスタンプ挿入の実装

エディタのカーソル位置、あるいはメモの末尾に、ボタン一発で現在の日時（例: `2026/09/20 15:30`）を挿入する機能を実装します。

### タイムスタンプ生成ヘルパー関数
まずは日時をきれいに日本語フォーマットする関数を作ります。

```typescript
// utils/formatDate.ts
export function getFormattedTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  // 例: "2026/09/20 15:30"
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}
```

### 挿入ボタンのロジック
Reactの `textarea` を参照（`useRef`）して、カーソルの位置にテキストを差し込みます。

```tsx
// components/EditorToolbar.tsx
import React from 'react';
import { getFormattedTimestamp } from '@/utils/formatDate';

interface Props {
  content: string;
  onChangeContent: (newContent: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export const EditorToolbar: React.FC<Props> = ({ content, onChangeContent, textareaRef }) => {
  const insertTimestamp = () => {
    const timestamp = `\n\n### ${getFormattedTimestamp()}\n`;
    
    const textarea = textareaRef.current;
    if (!textarea) {
      // refが取れない場合は末尾に追加
      onChangeContent(content + timestamp);
      return;
    }

    // カーソルの位置を取得してその間にタイムスタンプを割り込ませる
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const newContent = 
      content.substring(0, startPos) + timestamp + content.substring(endPos);

    onChangeContent(newContent);

    // カーソルを挿入したテキストの後ろに移動させる
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(startPos + timestamp.length, startPos + timestamp.length);
    }, 0);
  };

  return (
    <div className="flex items-center gap-2 p-2 border-b bg-gray-50">
      <button
        onClick={insertTimestamp}
        className="px-3 py-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-100 text-sm font-medium"
      >
        🕒 タイムスタンプ挿入
      </button>
    </div>
  );
};
```

---

## 3. NextAuth による認証の導入

ユーザーごとにメモを完全に分離するため、`next-auth`（Auth.js）を設定します。

### 1. 認証設定ファイル (`auth.ts`) の手打ち作成
```typescript
// auth.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    // セッションにユーザー固有のIDを含める
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
```

### 2. ルートハンドラー (`app/api/auth/[...nextauth]/route.ts`)
```typescript
import { handlers } from '@/auth';
export const { GET, POST } = handlers;
```

---

## 4. つまずきやすいエラーと解決策（デバッグ道場）

### ⚠️ エラー1: React Hydration Mismatch
- **現象**: ブラウザコンソールに `Warning: Text content did not match. Server: "..." Client: "..."` が表示される。
- **原因**: サーバー（SSR）がレンダリングした時刻と、クライアント（ブラウザ）でレンダリングされた時刻がミリ秒単位でズレる、またはブラウザの翻訳拡張機能などがHTMLを勝手に書き換えた場合に発生。
- **解決策**: 日時表示部分は、クライアントでマウントが完了してから表示する（`useEffect` でフラグを管理する）か、日時文字列をサーバー側から統一して渡すようにします。
- 関連ドキュメント: [[../troubleshooting/react_hydration_mismatch|react_hydration_mismatch]]

### ⚠️ エラー2: 401 Unauthorized エラー
- **現象**: メモを取得・保存しようとすると `401 Unauthorized` が返る。
- **原因**: APIルート側でセッションチェック（`const session = await auth()`）を入れているのに、クライアントが未ログイン状態でアクセスしている。
- **解決策**: 未ログインの場合はエディタを表示せず、「ログインしてノートを書き始めましょう」というウェルカム画面を表示するように条件分岐（ガード）を入れます。
- 関連ドキュメント: [[../troubleshooting/auth_js_unauthorized_401|auth_js_unauthorized_401]]

---

## チェックテスト（自分で確認してみよう）
1. 画面が左・中央・右の「3カラム」で綺麗に並んで表示されているか？
2. 「🕒 タイムスタンプ挿入」ボタンを押したとき、エディタ内のカーソル位置にきれいな日時が挿入されるか？

これが確認できたら、アプリの使い勝手は本物のSimplenoteを超え始めています！

---

### 次に進む
ローカルのJSONではなく、世界中どこからでもアクセスできるクラウドデータベース（Upstash Redis / Vercel KV）へ接続しましょう。
👉 **[[chapter3_vercel_kv_integration|第3章：インフラ連携：ローカルJSONからVercel KV (Redis) への移行]]** へ進む。
