import { useState } from "react";

export function useEditorHistory(initialContent: string) {
  const [contentHistory, setContentHistory] = useState<string[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushToHistory = (newContent: string) => {
    const nextHistory = contentHistory.slice(0, historyIndex + 1);
    nextHistory.push(newContent);
    setContentHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const undo = (currentContent: string) => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      return contentHistory[newIndex];
    }
    return currentContent;
  };

  const redo = (currentContent: string) => {
    if (historyIndex < contentHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      return contentHistory[newIndex];
    }
    return currentContent;
  };

  const resetHistory = (initialContent: string) => {
    setContentHistory([initialContent]);
    setHistoryIndex(0);
  };

  return { pushToHistory, undo, redo, resetHistory };
}
