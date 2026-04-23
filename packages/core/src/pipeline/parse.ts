import matter from "gray-matter";
import type { Root } from "mdast";
import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";

export interface ParseError {
  code: string;
  message: string;
  severity: "error" | "warning" | "info";
  position?: { line: number; column: number; offset?: number };
}

interface ObjectLike {
  [key: string]: unknown;
}

type NormalizedPosition = NonNullable<ParseError["position"]>;

export function parseMdx(source: string): {
  mdast: Root;
  frontmatter: Record<string, unknown>;
  errors: ParseError[];
} {
  let content = source;
  let frontmatter: Record<string, unknown> = {};
  let frontmatterLineOffset = 0;
  let frontmatterByteOffset = 0;

  try {
    const parsed = matter(source);
    content = parsed.content;
    frontmatter = normalizeFrontmatter(parsed.data);
    frontmatterLineOffset = countFrontmatterLines(source, content);
    frontmatterByteOffset = countFrontmatterBytes(source, content);
  } catch (error) {
    return {
      mdast: createEmptyRoot(),
      frontmatter: {},
      errors: [createParseError(error)],
    };
  }

  try {
    const mdast = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMdx)
      .parse(content) as Root;

    return {
      mdast,
      frontmatter,
      errors: [],
    };
  } catch (error) {
    return {
      mdast: createEmptyRoot(),
      frontmatter,
      errors: [createParseError(error, frontmatterLineOffset, frontmatterByteOffset)],
    };
  }
}

function createEmptyRoot(): Root {
  return {
    type: "root",
    children: [],
  };
}

function createParseError(
  error: unknown,
  lineOffset = 0,
  byteOffset = 0,
): ParseError {
  const position = applyFrontmatterOffset(
    normalizePosition(error),
    lineOffset,
    byteOffset,
  );

  return {
    code: "MDX_PARSE_ERROR",
    message: getErrorMessage(error),
    severity: "error",
    ...(position ? { position } : {}),
  };
}

function getErrorMessage(error: unknown): string {
  if (isObjectLike(error)) {
    if (typeof error.reason === "string" && error.reason.length > 0) {
      return error.reason;
    }

    if (typeof error.message === "string" && error.message.length > 0) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return "Failed to parse MDX input";
}

function normalizeFrontmatter(value: unknown): Record<string, unknown> {
  if (!isObjectLike(value) || Array.isArray(value)) {
    return {};
  }

  return value;
}

function normalizePosition(value: unknown): ParseError["position"] {
  if (!isObjectLike(value)) {
    return undefined;
  }

  return (
    normalizePoint(value.place) ??
    normalizePoint(value.position) ??
    normalizePoint(value) ??
    extractMarkPosition(value) ??
    extractPositionFromText(value.name) ??
    extractPositionFromText(value.reason) ??
    extractPositionFromText(value.message)
  );
}

function applyFrontmatterOffset(
  position: ParseError["position"],
  lineOffset: number,
  byteOffset: number,
): ParseError["position"] {
  if (!position || (lineOffset === 0 && byteOffset === 0)) {
    return position;
  }

  return {
    ...position,
    line: position.line + lineOffset,
    offset:
      position.offset !== undefined ? position.offset + byteOffset : position.offset,
  };
}

function countFrontmatterLines(original: string, content: string): number {
  const prefix = getFrontmatterPrefix(original, content);

  return prefix.match(/\r\n|\r|\n/g)?.length ?? 0;
}

function countFrontmatterBytes(original: string, content: string): number {
  return getFrontmatterPrefix(original, content).length;
}

function getFrontmatterPrefix(original: string, content: string): string {
  if (original.length <= content.length) {
    return "";
  }

  return original.slice(0, original.length - content.length);
}

function normalizePoint(value: unknown): NormalizedPosition | undefined {
  if (!isObjectLike(value)) {
    return undefined;
  }

  const nested = isObjectLike(value.start) ? value.start : value;
  const line = toFiniteNumber(nested.line);
  const column = toFiniteNumber(nested.column);
  const offset = toFiniteNumber(nested.offset);

  if (line === undefined || column === undefined) {
    return undefined;
  }

  return offset === undefined ? { line, column } : { line, column, offset };
}

function extractMarkPosition(value: unknown): NormalizedPosition | undefined {
  if (!isObjectLike(value) || !isObjectLike(value.mark)) {
    return undefined;
  }

  const line = toFiniteNumber(value.mark.line);
  const column = toFiniteNumber(value.mark.column);
  const offset = toFiniteNumber(value.mark.position);

  if (line === undefined && column === undefined && offset === undefined) {
    return undefined;
  }

  return {
    line: line === undefined ? 1 : line + 1,
    column: column === undefined ? 1 : column + 1,
    ...(offset === undefined ? {} : { offset }),
  };
}

function extractPositionFromText(value: unknown): NormalizedPosition | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const match = /(?:^|\()(\d+):(\d+)(?:-\d+:\d+)?(?:\)|$)/.exec(value);

  if (!match) {
    return undefined;
  }

  return {
    line: Number(match[1]),
    column: Number(match[2]),
  };
}

function toFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isObjectLike(value: unknown): value is ObjectLike {
  return typeof value === "object" && value !== null;
}
