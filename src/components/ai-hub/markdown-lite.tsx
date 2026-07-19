"use client";

// A small, dependency-free renderer that turns the lightweight markdown
// Gemini tends to produce (headings, bold, bullet/numbered lists, blank-line
// paragraphs) into nicely styled JSX — enough to make AI Study Hub results
// look polished without pulling in a full markdown library.

import { Fragment, type ReactNode } from "react";

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-gray-900 dark:text-gray-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>;
  });
}

export function MarkdownLite({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let listBuffer: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  const flushList = () => {
    if (!listBuffer) return;
    const ListTag = listBuffer.ordered ? "ol" : "ul";
    blocks.push(
      <ListTag
        key={`list-${key++}`}
        className={`my-2 ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-300 ${
          listBuffer.ordered ? "list-decimal" : "list-disc"
        }`}
      >
        {listBuffer.items.map((item, i) => (
          <li key={i}>{renderInline(item, `li-${key}-${i}`)}</li>
        ))}
      </ListTag>
    );
    listBuffer = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    const h3 = line.match(/^###\s+(.*)/);
    const h2 = line.match(/^##\s+(.*)/);
    const h1 = line.match(/^#\s+(.*)/);
    const bullet = line.match(/^[-*]\s+(.*)/);
    const numbered = line.match(/^\d+[.)]\s+(.*)/);

    if (h1 || h2 || h3) {
      flushList();
      const content = (h1 || h2 || h3)![1];
      const Tag = h1 ? "h2" : h2 ? "h3" : "h4";
      const cls = h1
        ? "mt-5 mb-2 text-lg font-bold text-gray-900 dark:text-gray-100"
        : h2
        ? "mt-4 mb-2 text-base font-bold text-gray-900 dark:text-gray-100"
        : "mt-3 mb-1.5 text-sm font-bold text-gray-900 dark:text-gray-100";
      blocks.push(
        <Tag key={`h-${key++}`} className={cls}>
          {renderInline(content, `h-${key}`)}
        </Tag>
      );
      continue;
    }

    if (bullet) {
      if (!listBuffer || listBuffer.ordered) {
        flushList();
        listBuffer = { ordered: false, items: [] };
      }
      listBuffer.items.push(bullet[1]);
      continue;
    }

    if (numbered) {
      if (!listBuffer || !listBuffer.ordered) {
        flushList();
        listBuffer = { ordered: true, items: [] };
      }
      listBuffer.items.push(numbered[1]);
      continue;
    }

    flushList();
    blocks.push(
      <p key={`p-${key++}`} className="my-1.5 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
        {renderInline(line, `p-${key}`)}
      </p>
    );
  }
  flushList();

  return <div>{blocks}</div>;
}
