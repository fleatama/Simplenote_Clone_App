import React, { RefObject } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import matter from "gray-matter";

type ViewMode = "source" | "split" | "reading";

interface NoteEditorProps {
  viewMode: ViewMode;
  selectedNoteId: string | null;
  selectedNoteContent: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onContentChange: (content: string) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  viewMode,
  selectedNoteId,
  selectedNoteContent,
  textareaRef,
  onContentChange,
}) => {
  return (
    <div className="flex-grow-1" style={{ overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
      {(viewMode === "source" || viewMode === "split") && (
        <textarea
          ref={textareaRef}
          className="form-control border-0 p-4 fs-5 bg-body text-body note-textarea"
          style={{
            resize: "none",
            width: viewMode === "split" ? "50%" : "100%",
            overflowY: "auto",
            height: "100%",
            position: "relative",
          }}
          value={selectedNoteId !== null ? selectedNoteContent : ""}
          onChange={(e) => onContentChange(e.target.value)}
          disabled={!selectedNoteId}
          placeholder="ここに入力するか、マークダウンツールバーを使用してください..."
        />
      )}
      {(viewMode === "reading" || viewMode === "split") && (
        <div
          className="markdown-preview bg-body text-body"
          style={{
            width: viewMode === "split" ? "50%" : "100%",
            marginLeft: viewMode === "split" ? "50%" : "0",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            height: "100%",
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
            {matter(selectedNoteContent).content.trim()}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default NoteEditor;
