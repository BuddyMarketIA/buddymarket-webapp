// Renders simple markdown in chat messages: bold, italic, links, line breaks
// Safe: no dangerouslySetInnerHTML, uses React elements

import React from "react";

type ChatMarkdownProps = {
  content: string;
  isExpert?: boolean; // affects link color
};

function parseInline(text: string, isExpert: boolean): React.ReactNode[] {
  // Matches: **bold**, *italic*, [text](url)
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      // **bold**
      parts.push(<strong key={match.index}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      // *italic*
      parts.push(<em key={match.index}>{match[2]}</em>);
    } else if (match[3] !== undefined && match[4] !== undefined) {
      // [text](url)
      parts.push(
        <a
          key={match.index}
          href={match[4]}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: isExpert ? "#fed7aa" : "#ea580c",
            textDecoration: "underline",
            wordBreak: "break-all",
          }}
        >
          {match[3]}
        </a>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function ChatMarkdown({ content, isExpert = false }: ChatMarkdownProps) {
  const lines = content.split("\n");

  return (
    <span style={{ display: "block", wordBreak: "break-word" }}>
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {parseInline(line, isExpert)}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </span>
  );
}
