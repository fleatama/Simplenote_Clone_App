/**
 * Extracts title from note content.
 * Returns first 25 chars of the first line, with "..." if truncated.
 */
export const getNoteTitle = (content: string): string => {
  if (!content) return "";
  const firstLine = content.trim().split("\n")[0];
  if (firstLine.length > 25) {
    return firstLine.substring(0, 25) + "...";
  }
  return firstLine;
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
