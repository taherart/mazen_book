import { Fragment } from "react";

// "40–80", "3-4", "30–100%", "1,500–4,000": inside Arabic text the browser would draw the
// second number first. The previous site isolated ranges so they read low → high, left to right;
// we keep that convention everywhere.
const RANGE = /(\d[\d,.]*\s?[–-]\s?\d[\d,.]*%?)/g;

/** Text from the book with numeric ranges kept in reading order. */
export function T({ children }: { children: string }) {
  const parts = children.split(RANGE);
  if (parts.length === 1) return children;
  return parts.map((part, i) =>
    i % 2 ? (
      <bdi key={i} dir="ltr">
        {part}
      </bdi>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
