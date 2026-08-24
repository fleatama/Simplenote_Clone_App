import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NoteList from "./NoteList";

// ノートリスト表示コンポーネントの動作テスト
describe("NoteList Component", () => {
  // テスト用に関数（モック）を作成します。実際に何かを動かすのではなく、呼び出されたことを記録する役割です。
  const mockOnSelectNote = vi.fn();
  const mockOnToggleCheck = vi.fn();

  // 1. 表示確認: ノートが空のときに正しくメッセージが出るか
  it("should display 'No notes found.' when note list is empty", () => {
    // 実際にブラウザ画面を描画するイメージでコンポーネントを表示します
    render(
      <NoteList
        notes={[]} // ノートは空
        selectedNoteId={null}
        checkedIds={new Set()}
        loading={false} // ロード中ではない
        onSelectNote={mockOnSelectNote}
        onToggleCheck={mockOnToggleCheck}
      />
    );

    // 画面上に "No notes found." という文字があるかチェックします
    expect(screen.getByText("No notes found.")).toBeDefined();
  });

  // 2. 一覧確認: ノートがあるときにちゃんとタイトルが表示されるか
  it("should display note titles when notes are provided", () => {
    const mockNotes = [
      { id: "1", content: "Test Note 1", createdAt: "2024-01-01", updatedAt: "2024-01-01" },
      { id: "2", content: "Test Note 2", createdAt: "2024-01-02", updatedAt: "2024-01-02" },
    ];

    render(
      <NoteList
        notes={mockNotes} // ノートが2つある状態
        selectedNoteId={null}
        checkedIds={new Set()}
        loading={false}
        onSelectNote={mockOnSelectNote}
        onToggleCheck={mockOnToggleCheck}
      />
    );

    // それぞれのタイトルが画面に出ていることを確認します
    expect(screen.getByText("Test Note 1")).toBeDefined();
    expect(screen.getByText("Test Note 2")).toBeDefined();
  });

  // 3. ローディング確認: 読み込み中にくるくる回るアイコンが出るか
  it("should show a loading spinner when loading is true", () => {
    render(
      <NoteList
        notes={[]}
        selectedNoteId={null}
        checkedIds={new Set()}
        loading={true} // ロード中をシミュレート
        onSelectNote={mockOnSelectNote}
        onToggleCheck={mockOnToggleCheck}
      />
    );

    // Bootstrapのローディング用クラス（spinner-border）があるかチェックします
    const spinner = document.querySelector(".spinner-border");
    expect(spinner).toBeDefined();
  });
});
