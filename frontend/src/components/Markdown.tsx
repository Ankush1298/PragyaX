import type { ReactNode } from "react";

/**
 * Minimal, XSS-safe renderer for the subset the AI provider emits:
 * ```code fences```, `inline code`, **bold**, *italic*, "- " / "1. " list lines.
 * Builds React elements; never uses dangerouslySetInnerHTML.
 */
function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1) return <code key={i}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 3) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

const LIST_LINE = /^\s*(-|\d+\.)\s/;

/** Splits a paragraph into runs of plain lines and list lines. */
function renderParagraph(para: string, key: string) {
  const runs: { list: boolean; lines: string[] }[] = [];
  for (const line of para.split("\n")) {
    const list = LIST_LINE.test(line);
    const last = runs[runs.length - 1];
    if (last && last.list === list) last.lines.push(line);
    else runs.push({ list, lines: [line] });
  }
  return runs.map((run, r) => {
    if (run.list) {
      const items = run.lines.map((l, k) => <li key={k}>{inline(l.replace(LIST_LINE, ""))}</li>);
      return /^\s*\d+\./.test(run.lines[0]) ? <ol key={`${key}-${r}`}>{items}</ol> : <ul key={`${key}-${r}`}>{items}</ul>;
    }
    return (
      <p key={`${key}-${r}`}>
        {run.lines.map((l, k) => (
          <span key={k}>
            {k > 0 && <br />}
            {inline(l)}
          </span>
        ))}
      </p>
    );
  });
}

export default function Markdown({ text }: { text: string }) {
  const blocks = text.split(/```(?:\w+)?\n?([\s\S]*?)```/g);
  return (
    <div className="md">
      {blocks.map((block, i) =>
        i % 2 === 1 ? (
          <pre key={i}>
            <code>{block.replace(/\n$/, "")}</code>
          </pre>
        ) : (
          block
            .split(/\n{2,}/)
            .filter((p) => p.trim())
            .map((para, j) => renderParagraph(para.trim(), `${i}-${j}`))
        ),
      )}
    </div>
  );
}
