import { Note } from "../app/page";
import { getNoteTitle } from "./helpers";

export type SortMode = "updatedDesc" | "updatedAsc" | "titleAsc" | "titleDesc";

export const sortNotes = (notes: Note[], mode: SortMode): Note[] => {
  const sorted = [...notes].sort((a, b) => {
    if (mode === "updatedDesc") {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    if (mode === "updatedAsc") {
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }

    const titleA = getNoteTitle(a.content) || "";
    const titleB = getNoteTitle(b.content) || "";

    // 空タイトルを末尾に固定
    if (!titleA && titleB) return 1;
    if (titleA && !titleB) return -1;
    if (!titleA && !titleB) {
      // どちらも空の場合はUpdatedAtで比較（安定化）
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }

    const comparison = titleA.localeCompare(titleB, "ja");
    if (comparison === 0) {
      // タイトルが同じ場合はUpdatedAtで安定化
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }

    return mode === "titleAsc" ? comparison : -comparison;
  });

  return sorted;
};
