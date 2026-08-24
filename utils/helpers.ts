import { Note } from "../app/page"; // 修正: Note インターフェースのインポートが必要です

/**
 * Extracts a cleaner title from note content.
 * Handles Markdown headers and skips initial empty lines.
 */
export const getNoteTitle = (content: string): string => {
  if (!content) return "";

  // 全体の余白を除去して行ごとに分割
  const lines = content.trim().split("\n");

  // 空ではない最初の行を探す
  let title = lines.find((line) => line.trim() !== "") || "";

  // Markdownの見出し記号 (例: "# ", "## ") を取り除く
  title = title.replace(/^#+\s+/, "").trim();

  // タイトルが空なら空文字を返す
  if (!title) return "";

  // 長すぎる場合は省略記号を付ける
  return title.length > 30 ? title.substring(0, 30) + "..." : title;
};

// フロントマター生成用の関数
export const generateFrontMatter = (note: Note): string => {
  const { createdAt, updatedAt, metadata } = note;
  const tags = metadata?.tags || [];
  const aliases = metadata?.aliases || [];

  // 日付を YYYY-MM-DD 形式に変換
  const createdDate = new Date(createdAt).toISOString().split("T")[0];
  const updatedDate = new Date(updatedAt).toISOString().split("T")[0];

  // フロントマター生成
  return `---
created: ${createdDate}
updated: ${updatedDate}
tags: [${tags.join(", ")}]
aliases: [${aliases.join(", ")}]
---
`;
};

/**
 * フロントマター（--- で囲まれた部分）およびそれに付随する
 * タグ編集バグで蓄積したゴミ（「]」や孤立した「---」など）を完全に一掃し、
 * 純粋な本文のみを抽出する堅牢な関数。
 */
export const stripFrontMatter = (content: string): string => {
  if (!content) return "";

  // 文字列全体の先頭の空白を除去
  let current = content.trim();

  // 蓄積したゴミ（「]」や「---」などの重複）を再帰的・ループ的にクリーンアップする
  let previous = "";
  while (current !== previous) {
    previous = current;

    // もし先頭が「]」で始まっていたら除去（バグで取り残された閉じブラケット）
    if (current.startsWith("]")) {
      current = current.substring(1).trim();
      continue;
    }

    // 正しいフロントマター、もしくは浮いた「---」をクリーンアップ
    if (current.startsWith("---")) {
      const nextDashesIndex = current.indexOf("---", 3);
      if (nextDashesIndex !== -1) {
        // 2番目の "---" の直後から本文を抽出
        current = current.substring(nextDashesIndex + 3).trim();
      } else {
        // 閉じられていない浮いた "---" はバグのゴミなので除去
        current = current.substring(3).trim();
      }
    }
  }

  return current;
};

/**
 * Converts ISO date string to a locale string.
 */
export const formatDateTime = (isoString: string): string => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
