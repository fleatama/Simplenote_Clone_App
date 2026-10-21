# トラブルシューティングレポート: スマートフォン等における「一覧へ戻る」ボタンが機能しなかった問題の原因と対策

## 1. 発生していた問題
スマートフォン（iPhone 13 miniなど小画面の端末）からアプリケーションにアクセスした際、ノート一覧から特定のメモを選択してエディタ画面に遷移した後、ヘッダーに配置した「一覧へ」ボタン（`[ ← 一覧へ ]`）をタップしても、**メモ一覧画面に切り替わらずすぐに最初のノートの編集画面に戻されてしまう**という挙動不整合が発生していました。

---

## 2. 根本原因 (Root Cause)
原因はUIのクリックイベントの不具合ではなく、Reactのライフサイクル（`useEffect`）内における**自動ノート選択ロジックとの競合**にありました。

アプリケーションの初期設計として、データ読み込み時やノートリスト更新時に未選択状態（`selectedNoteId === null`）である場合、ユーザーの利便性を考慮して**「自動的に先頭のノート（`notes[0]`）を選択状態にする」**という `useEffect` の監視フックが常時稼働していました。

```tsx
// 修正前の問題となったコード
useEffect(() => {
  if (notes.length > 0 && !selectedNoteId) handleSelectNote(notes[0]);
  else if (notes.length === 0) { setSelectedNoteId(null); setSelectedNoteContent(""); }
}, [notes, selectedNoteId]);
```

### 競合のメカニズム
1. ユーザーがスマホ画面で「一覧へ」ボタンをタップする。
2. ハンドラー内で `setSelectedNoteId(null)` が実行され、状態が「未選択（一覧表示状態）」に切り替わろうとする。
3. 直後、`useEffect` が `selectedNoteId` が `null` になった変化を検知する。
4. `!selectedNoteId` の条件を満たしているため、即座に `handleSelectNote(notes[0])` が発火し、**「一覧に戻った瞬間、先頭のノートが強制的に再選択される」**というループが発生していた。

---

## 3. 対策・解決方法 (Solution)
この問題を解決するため、**「明示的に一覧を表示している状態」を保持する専用のステート（`mobileShowList`）**を導入しました。

### 修正後の実装アプローチ
1. **`mobileShowList` ステートの追加**:
   - ユーザーが「一覧へ」ボタンを押したときに `setMobileShowList(true)` を実行する。
   - 新規ノート選択時や初期化時には `setMobileShowList(false)` にリセットする。
2. **自動選択 `useEffect` のガード**:
   - `mobileShowList` が `true`（＝ユーザーが明示的に一覧を見ている状態）のときは、自動選択ロジックをバイパス（スキップ）するように条件を追加。
3. **レスポンシブな表示切り替え条件の強化**:
   - スマホ画面において、`selectedNoteId && !mobileShowList` の条件を満たす場合のみエディタを表示し、一覧を表示したいときは常に一覧が前面に出るように制御。

```tsx
// 修正後のコード (概要)
const [mobileShowList, setMobileShowList] = useState<boolean>(false);

useEffect(() => {
  // 明示的に一覧表示中の場合は自動選択をバイパス
  if (mobileShowList) return;

  if (notes.length > 0 && !selectedNoteId) handleSelectNote(notes[0]);
  else if (notes.length === 0) { setSelectedNoteId(null); setSelectedNoteContent(""); }
}, [notes, selectedNoteId, mobileShowList]);
```

---

## 4. 検証結果
この修正により、iPhone 13 mini などのスマートフォン端末を含む小画面デバイスにおいて、エディタ画面から「一覧へ」ボタンをタップした際に、自動再選択のループが発生せず、**確実にスムーズにメモ一覧画面へ戻れる**ようになりました。
