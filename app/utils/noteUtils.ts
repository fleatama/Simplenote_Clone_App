import JSZip from "jszip";
import { saveAs } from "file-saver";

export const handleExport = (notes: any[], format: "zip" | "text") => {
  if (format === "zip") {
    const zip = new JSZip();
    notes.forEach((note) => {
      zip.file(`${note.id}.md`, note.content);
    });
    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, "notes.zip");
    });
  }
};

export const insertMarkdown = (
  textarea: HTMLTextAreaElement,
  text: string
) => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  const replacement = `${text.replace("SELECTED_TEXT", selectedText)}`;
  const newContent =
    textarea.value.substring(0, start) +
    replacement +
    textarea.value.substring(end);
  return { newContent, newCursorStart: start + replacement.length };
};
