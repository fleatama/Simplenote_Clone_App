/**
 * Extracts a cleaner title from note content.
 * Handles Markdown headers and skips initial empty lines.
 */
export const getNoteTitle = (content: string): string => {
  if (!content) return "";

  // 全体の余白を除去して行ごとに分割
  const lines = content.trim().split("\n");

  // 空ではない最初の行を探す
  let title = lines.find(line => line.trim() !== "") || "";

  // Markdownの見出し記号 (例: "# ", "## ") を取り除く
  title = title.replace(/^#+\s+/, "").trim();

  // タイトルが空なら空文字を返す
  if (!title) return "";

  // 長すぎる場合は省略記号を付ける
  return title.length > 30 ? title.substring(0, 30) + "..." : title;
};

/**
 * Converts ISO date string to a locale string.
 */
export const formatDateTime = (isoString: string): string => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleString("ja-JP", { 
    year: "numeric", month: "2-digit", day: "2-digit", 
    hour: "2-digit", minute: "2-digit" 
  });
};
