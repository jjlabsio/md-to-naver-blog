import type { PhrasingContent, Root, RootContent } from "mdast";
import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import type { ParseError } from "./pipeline/errors.js";
import { ErrorCollector } from "./pipeline/errors.js";
import { parseMdx } from "./pipeline/parse.js";
import { renderRoot } from "./render/block.js";

export interface UrlContext {
  type: "link" | "image";
  raw: string;
}

export interface ComponentProps {
  [key: string]: string | number | boolean | null;
}

export interface ComponentRenderCtx {
  depth: number;
  index: number;
  parent?: string;
}

export type ComponentRenderer = (
  props: ComponentProps,
  children: string,
  ctx?: ComponentRenderCtx,
) => string;

export interface ConvertOptions {
  transformUrl?: (ctx: UrlContext) => string;
  components?: Record<string, ComponentRenderer>;
}

export interface RenderedBlock {
  id: string;
  type: string;
  html: string;
}

export type RenderCache = Map<string, { type: string; html: string }>;

export interface ConvertResult {
  title: string;
  html: string;
  frontmatter: Record<string, unknown>;
  blocks: RenderedBlock[];
  errors: ParseError[];
}

export function convert(
  markdown: string,
  options?: ConvertOptions,
  cache?: RenderCache,
): ConvertResult {
  const mdxResult = parseMdx(markdown);
  const errors = new ErrorCollector();
  errors.pushAll(mdxResult.errors);
  const frontmatter = mdxResult.frontmatter;
  const mdast = shouldFallbackToMarkdownParse(mdxResult)
    ? parseMarkdownFallback(mdxResult.content)
    : mdxResult.mdast;
  const title = extractTitle(mdast);

  const renderedEntries = renderRoot(mdast as Root & { children: RootContent[] }, {
    options,
    depth: 0,
    cache,
    hash: fnv1a,
    errors,
  });
  const htmlParts = renderedEntries.map((entry) => entry.html);
  const renderedBlocks: RenderedBlock[] = [];
  const idCounts = new Map<string, number>();

  for (const entry of renderedEntries) {
    const seen = idCounts.get(entry.baseId) ?? 0;
    idCounts.set(entry.baseId, seen + 1);
    renderedBlocks.push({
      id: seen === 0 ? entry.baseId : `${entry.baseId}#${seen}`,
      type: entry.type,
      html: entry.html,
    });
  }

  let html = htmlParts.join("\n");

  // Add tags from frontmatter
  if (frontmatter.tags && Array.isArray(frontmatter.tags)) {
    const tagStr = frontmatter.tags.map((t: string) => `#${t}`).join(" ");
    const tagHtml = `<p>${tagStr}</p>`;
    html += tagHtml;
    renderedBlocks.push({
      id: `tags:${fnv1a(tagStr)}`,
      type: "tags",
      html: tagHtml,
    });
  }

  // Trim leading/trailing whitespace and blank <p> tags
  html = html.trim();
  while (html.startsWith("<p>&nbsp;</p>\n")) {
    html = html.slice("<p>&nbsp;</p>\n".length);
  }
  while (html.endsWith("\n<p>&nbsp;</p>")) {
    html = html.slice(0, -"\n<p>&nbsp;</p>".length);
  }

  const blocks = trimBlankBlocks(renderedBlocks);

  return { title, html, frontmatter, blocks, errors: errors.drain() };
}

function shouldFallbackToMarkdownParse(result: {
  mdast: Root;
  content: string;
  errors: ParseError[];
}): boolean {
  return (
    result.mdast.children.length === 0 &&
    result.errors.length > 0 &&
    /\{\{<\s*figure\b/.test(result.content)
  );
}

function parseMarkdownFallback(content: string): Root {
  return unified().use(remarkParse).use(remarkGfm).parse(content) as Root;
}

function extractTitle(mdast: Root): string {
  for (const child of mdast.children) {
    if (child.type === "heading" && child.depth === 1) {
      return extractPhrasingText(child.children).trim();
    }
  }

  return "";
}

function extractPhrasingText(nodes: PhrasingContent[]): string {
  let result = "";

  for (const node of nodes as Array<
    PhrasingContent & { type: string; children?: PhrasingContent[] }
  >) {
    switch (node.type) {
      case "text":
      case "inlineCode":
        result += String(node.value ?? "");
        break;
      case "image":
        result += String(node.alt ?? "");
        break;
      default:
        if (Array.isArray(node.children)) {
          result += extractPhrasingText(node.children);
        }
        break;
    }
  }

  return result;
}

function trimBlankBlocks(blocks: RenderedBlock[]): RenderedBlock[] {
  let start = 0;
  let end = blocks.length;
  while (start < end && blocks[start].type === "blank") start++;
  while (end > start && blocks[end - 1].type === "blank") end--;
  return start === 0 && end === blocks.length
    ? blocks
    : blocks.slice(start, end);
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

// Identity transform kept for API stability; the rendered HTML already
// uses flat <p> blocks that survive SmartEditor ONE's paste normalization.
export function toNaverPasteHtml(html: string): string {
  return html;
}

export function getHtmlClipboardScript(html: string): string {
  const escaped = JSON.stringify(html);
  return `(() => {
  const blob = new Blob([${escaped}], { type: 'text/html' });
  const item = new ClipboardItem({ 'text/html': blob });
  return navigator.clipboard.write([item]);
})()`;
}

export function getTextClipboardScript(text: string): string {
  const escaped = JSON.stringify(text);
  return `(() => {
  return navigator.clipboard.writeText(${escaped});
})()`;
}
