import { describe, it, expect } from "vitest";
import { getNoteTitle, generateFrontMatter, stripFrontMatter } from "./helpers";
import { sortNotes, SortMode } from "./sorting";
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

describe("sortNotes", () => {
  const notes: Note[] = [
    { id: "1", content: "Banana note", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-02T00:00:00Z", metadata: { tags: [], aliases: [] } },
    { id: "2", content: "Apple note", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-03T00:00:00Z", metadata: { tags: [], aliases: [] } },
    { id: "3", content: "", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-04T00:00:00Z", metadata: { tags: [], aliases: [] } },
  ];

  it("should sort by updated date descending", () => {
    const sorted = sortNotes(notes, "updatedDesc");
    expect(sorted[0].id).toBe("3");
    expect(sorted[1].id).toBe("2");
    expect(sorted[2].id).toBe("1");
  });

  it("should sort by updated date ascending", () => {
    const sorted = sortNotes(notes, "updatedAsc");
    expect(sorted[0].id).toBe("1");
    expect(sorted[1].id).toBe("2");
    expect(sorted[2].id).toBe("3");
  });

  it("should sort by title ascending with empty at the end", () => {
    const sorted = sortNotes(notes, "titleAsc");
    expect(sorted[0].content).toBe("Apple note");
    expect(sorted[1].content).toBe("Banana note");
    expect(sorted[2].content).toBe("");
  });

  it("should sort by title descending with empty at the end", () => {
    const sorted = sortNotes(notes, "titleDesc");
    expect(sorted[0].content).toBe("Banana note");
    expect(sorted[1].content).toBe("Apple note");
    expect(sorted[2].content).toBe("");
  });
});
