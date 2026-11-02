import React from "react";

interface EditorToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  onInsertMarkdown: (syntax: string, placeholder?: string, type?: "wrap" | "block" | "line") => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onUndo,
  onRedo,
  onInsertMarkdown,
}) => {
  return (
    <div className="px-4 py-1 border-bottom d-flex align-items-center gap-1 bg-body-secondary flex-wrap" style={{ zIndex: 10, flexShrink: 0 }}>
      <button className="btn btn-sm btn-outline-secondary border-0" onClick={onUndo} title="元に戻す"><i className="bi bi-arrow-counterclockwise"></i></button>
      <button className="btn btn-sm btn-outline-secondary border-0" onClick={onRedo} title="やり直す"><i className="bi bi-arrow-clockwise"></i></button>
      <div className="vr mx-1"></div>
      <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => onInsertMarkdown("**", "太字", "wrap")} title="太字"><i className="bi bi-type-bold"></i></button>
      <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => onInsertMarkdown("*", "斜体", "wrap")} title="斜体"><i className="bi bi-type-italic"></i></button>
      <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => onInsertMarkdown("~~", "打ち消し線", "wrap")} title="打ち消し線"><i className="bi bi-type-strikethrough"></i></button>
      <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => onInsertMarkdown("`", "コード", "wrap")} title="インラインコード"><i className="bi bi-code"></i></button>
      <div className="vr mx-1"></div>
      <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => onInsertMarkdown("# ", "見出し 1", "line")} title="見出し 1"><i className="bi bi-type-h1"></i></button>
      <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => onInsertMarkdown("## ", "見出し 2", "line")} title="見出し 2"><i className="bi bi-type-h2"></i></button>
      <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => onInsertMarkdown("### ", "見出し 3", "line")} title="見出し 3"><i className="bi bi-type-h3"></i></button>
      <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => onInsertMarkdown("#### ", "見出し 4", "line")} title="見出し 4"><i className="bi bi-type-h4"></i></button>
      <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => onInsertMarkdown("##### ", "見出し 5", "line")} title="見出し 5"><i className="bi bi-type-h5"></i></button>
      <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => onInsertMarkdown("###### ", "見出し 6", "line")} title="見出し 6"><i className="bi bi-type-h6"></i></button>
      <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => onInsertMarkdown("- ", "リスト項目", "line")} title="箇条書きリスト"><i className="bi bi-list-task"></i></button>
      <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => onInsertMarkdown("1. ", "リスト項目", "line")} title="番号付きリスト"><i className="bi bi-list-ol"></i></button>
      <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => onInsertMarkdown("- [ ] ", "タスク", "line")} title="タスクリスト"><i className="bi bi-check2-square"></i></button>
      <div className="vr mx-1"></div>
      <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => onInsertMarkdown("link", "", "block")} title="リンク挿入"><i className="bi bi-link-45deg"></i></button>
      <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => onInsertMarkdown("image", "", "block")} title="画像挿入"><i className="bi bi-image"></i></button>
      <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => onInsertMarkdown("codeblock", "", "block")} title="コードブロック"><i className="bi bi-terminal"></i></button>
    </div>
  );
};

export default EditorToolbar;
