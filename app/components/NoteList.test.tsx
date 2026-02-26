import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NoteList from "./NoteList";

describe("NoteList Component", () => {
  const mockOnSelectNote = vi.fn();
  const mockOnToggleCheck = vi.fn();

  it("should display 'No notes found.' when note list is empty", () => {
    render(
      <NoteList
        notes={[]}
        selectedNoteId={null}
        checkedIds={new Set()}
        loading={false}
        onSelectNote={mockOnSelectNote}
        onToggleCheck={mockOnToggleCheck}
      />
    );

    expect(screen.getByText("No notes found.")).toBeDefined();
  });

  it("should display note titles when notes are provided", () => {
    const mockNotes = [
      { id: "1", content: "Test Note 1", createdAt: "2024-01-01", updatedAt: "2024-01-01" },
      { id: "2", content: "Test Note 2", createdAt: "2024-01-02", updatedAt: "2024-01-02" },
    ];

    render(
      <NoteList
        notes={mockNotes}
        selectedNoteId={null}
        checkedIds={new Set()}
        loading={false}
        onSelectNote={mockOnSelectNote}
        onToggleCheck={mockOnToggleCheck}
      />
    );

    expect(screen.getByText("Test Note 1")).toBeDefined();
    expect(screen.getByText("Test Note 2")).toBeDefined();
  });

  it("should show a loading spinner when loading is true", () => {
    render(
      <NoteList
        notes={[]}
        selectedNoteId={null}
        checkedIds={new Set()}
        loading={true}
        onSelectNote={mockOnSelectNote}
        onToggleCheck={mockOnToggleCheck}
      />
    );

    const spinner = document.querySelector(".spinner-border");
    expect(spinner).toBeDefined();
  });
});
