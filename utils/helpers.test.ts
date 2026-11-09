import { describe, it, expect } from "vitest";
import { getNoteTitle, generateFrontMatter, stripFrontMatter, sortNotes, SortMode } from "./helpers";
import { Note } from "../app/page";

// フロントマター（ノートのメタデータ）の解析とクリーンアップ機能のテスト
describe("Front Matter Parser and Stripper", () => {
  
  // 1. 基本機能: きれいなフロントマターが正しく取り除かれるか
  it("should successfully strip clean front matter", () => {
    const contentWithFrontMatter = `---
created: 2026-08-18
updated: 2026-08-18
tags: [test, debug]
aliases: []
---
This is the real content.
With some markdown.`;

    const clean = stripFrontMatter(contentWithFrontMatter);
    // 「---」で囲まれた部分は消え、本文だけが残ることを期待します
    expect(clean).toBe("This is the real content.\nWith some markdown.");
  });

  // 2. 空白の扱い: 前後に余計な改行があっても大丈夫か
  it("should handle front matter with leading whitespace/newline", () => {
    const contentWithWhitespace = `
    
---
tags: [dirty]
---
Actual body here.`;

    const clean = stripFrontMatter(contentWithWhitespace);
    // 余分な空白や改行を無視して、本文だけを抽出できることを確認します
    expect(clean).toBe("Actual body here.");
  });

  // 3. なにもない場合: フロントマターがない場合に壊れないか
  it("should not strip content if there is no front matter", () => {
    const pureContent = "No front matter here. Just text.";
    const clean = stripFrontMatter(pureContent);
    // 何も加工されずにそのまま戻ってくることを期待します
    expect(clean).toBe(pureContent);
  });

  // 4. 水平線の扱い: 本文中のMarkdown（---）をフロントマターと誤認しないか
  it("should handle nested dashes in body correctly (do not strip body dashes)", () => {
    const nestedDashes = `---
tags: [nested]
---
Hello World
---
This is a markdown horizontal rule.`;

    const clean = stripFrontMatter(nestedDashes);
    // 本文中の「---」は水平線記法なので、そのまま残ることを確認します
    expect(clean).toBe("Hello World\n---\nThis is a markdown horizontal rule.");
  });

  // 5. 破損データの修復: 重複や不整合なゴミデータが含まれていても正しく復旧できるか
  it("should recover and strip dirty/broken duplicated front matter if they exist", () => {
    const corruptedContent = `---
created: 2026-08-18
updated: 2026-08-18
tags: [new]
---
]
---
This is the note body.`;

    const body = stripFrontMatter(corruptedContent);
    // 途中に混入した不要な「]」や孤立した「---」を完全に無視できるかを確認します
    expect(body).toBe("This is the note body.");
  });

  // 6. 強力な修復: 繰り返しゴミがあっても大丈夫か
  it("should clean highly corrupted recursive front matter trash", () => {
    const highlyCorrupted = `---
created: 2026-08-18
updated: 2026-08-18
tags: [new]
---
]
---
]
---
This is the final clean note body.`;

    const body = stripFrontMatter(highlyCorrupted);
    // 複雑に蓄積したゴミデータもきれいさっぱり消せることを確認します
    expect(body).toBe("This is the final clean note body.");
  });
});

describe("sortNotes function", () => {
  const sampleNotes: Note[] = [
    {
      id: "1",
      content: "Apple",
      createdAt: "2026-01-01T10:00:00Z",
      updatedAt: "2026-01-03T10:00:00Z",
      metadata: { tags: [], aliases: [] },
    },
    {
      id: "2",
      content: "Banana",
      createdAt: "2026-01-02T10:00:00Z",
      updatedAt: "2026-01-02T10:00:00Z",
      metadata: { tags: [], aliases: [] },
    },
    {
      id: "3",
      content: "", // 空タイトル
      createdAt: "2026-01-03T10:00:00Z",
      updatedAt: "2026-01-05T10:00:00Z",
      metadata: { tags: [], aliases: [] },
    },
    {
      id: "4",
      content: "Apple", // タイトル重複 (id 1 と同じ)
      createdAt: "2026-01-04T10:00:00Z",
      updatedAt: "2026-01-04T10:00:00Z",
      metadata: { tags: [], aliases: [] },
    },
  ];

  it("should sort by updated-desc by default", () => {
    const sorted = sortNotes(sampleNotes);
    expect(sorted.map((n) => n.id)).toEqual(["3", "4", "1", "2"]);
  });

  it("should sort by created-desc", () => {
    const sorted = sortNotes(sampleNotes, "created-desc");
    expect(sorted.map((n) => n.id)).toEqual(["4", "3", "2", "1"]);
  });

  it("should sort by title-asc placing empty title at the end", () => {
    const sorted = sortNotes(sampleNotes, "title-asc");
    // Apple (updatedAt 2026-01-04) -> Apple (updatedAt 2026-01-03) -> Banana -> 空
    expect(sorted.map((n) => n.id)).toEqual(["4", "1", "2", "3"]);
  });

  it("should sort by title-desc placing empty title at the end", () => {
    const sorted = sortNotes(sampleNotes, "title-desc");
    // Banana -> Apple (updatedAt 2026-01-04) -> Apple (updatedAt 2026-01-03) -> 空
    expect(sorted.map((n) => n.id)).toEqual(["2", "4", "1", "3"]);
  });

  it("should not mutate original array", () => {
    const originalIds = sampleNotes.map((n) => n.id);
    sortNotes(sampleNotes, "title-asc");
    expect(sampleNotes.map((n) => n.id)).toEqual(originalIds);
  });
});
