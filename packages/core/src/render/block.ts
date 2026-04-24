import type {
  Blockquote,
  Code,
  Heading,
  Image,
  List,
  ListItem,
  Paragraph,
  RootContent,
  Table,
  TableCell,
  TableRow,
} from "mdast";
import type { ConvertOptions, RenderCache } from "../index.js";
import { createError, type ParseError } from "../pipeline/errors.js";
import {
  isRegisteredComponentName,
  renderComponent,
  type MdxJsxFlowElementLike,
} from "./component.js";
import { highlightCode } from "./code-highlight.js";
import { renderInline } from "./inline.js";
import { escapeHtml, resolveUrl } from "./utils.js";

interface PositionPointLike {
  line?: number;
}

interface PositionLike {
  start?: PositionPointLike;
  end?: PositionPointLike;
}

interface HtmlLike {
  type: "html";
  value: string;
  position?: PositionLike;
}

interface DefinitionLike {
  type: "definition";
  position?: PositionLike;
}

interface FootnoteDefinitionLike {
  type: "footnoteDefinition";
  position?: PositionLike;
}

interface MdxjsEsmLike {
  type: "mdxjsEsm";
  value?: string;
  position?: PositionLike;
}

interface MdxFlowExpressionLike {
  type: "mdxFlowExpression";
  value?: string;
  position?: PositionLike;
}

type RootContentLike =
  | (RootContent & {
      type: string;
      position?: PositionLike;
      [key: string]: unknown;
    })
  | MdxJsxFlowElementLike
  | HtmlLike
  | DefinitionLike
  | FootnoteDefinitionLike
  | MdxjsEsmLike
  | MdxFlowExpressionLike;

export interface RenderContext {
  options?: ConvertOptions;
  depth: number;
  cache?: RenderCache;
  hash?: (input: string) => string;
  errors?: {
    pushAll(errors: ParseError[]): void;
  };
  currentComponentIndex?: number;
  parentComponentName?: string;
  componentCursor?: {
    value: number;
  };
}

export interface RenderEntry {
  baseId: string;
  type: string;
  html: string;
}

interface FlatListEntry {
  depth: number;
  html: string;
  number?: number;
}

const CODE_BLOCK_STYLE =
  "background-color: rgb(246, 248, 250); border: 1px solid rgb(221, 221, 221); border-radius: 6px; padding: 16px; font-family: &quot;Courier New&quot;, monospace; font-size: 0.9em; color: rgb(36, 41, 46);";
const BLOCKQUOTE_STYLE =
  "border-left: 4px solid rgb(220, 53, 69); padding: 1em 1.5em; background-color: rgb(246, 248, 250); color: rgb(36, 41, 46); border-radius: 4px;";
const BULLET_CHARS = ["•", "◦", "▪"] as const;
const NBSP_PER_LEVEL = 6;
const HUGO_FIGURE_PATTERN =
  /\{\{<\s*figure\s+src="([^"]+)"\s+alt="([^"]+)"\s+caption="([^"]+)"\s*>\}\}/;

export function renderRoot(
  root: { children: RootContent[]; position?: PositionLike },
  ctx: RenderContext,
): RenderEntry[] {
  const nodes = root.children as RootContentLike[];
  const entries: RenderEntry[] = [];
  const firstLine = getStartLine(nodes[0]);

  if (firstLine !== undefined && firstLine > 1) {
    pushBlankEntries(entries, firstLine - 1, ctx);
  }

  entries.push(
    ...renderChildEntries(nodes, {
      ...ctx,
      componentCursor: { value: 0 },
    }),
  );

  const lastEndLine = getEndLine(nodes[nodes.length - 1]);
  const rootEndLine = root.position?.end?.line;
  if (
    lastEndLine !== undefined &&
    rootEndLine !== undefined &&
    rootEndLine > lastEndLine
  ) {
    pushBlankEntries(entries, rootEndLine - lastEndLine, ctx);
  }

  return entries;
}

export function renderBlock(node: RootContent, ctx: RenderContext): string {
  return renderNodeEntries(node as RootContentLike, ctx)
    .map((entry) => entry.html)
    .join("\n");
}

export function renderChildren(
  children: RootContent[],
  ctx: RenderContext,
): string[] {
  return renderChildEntries(
    children as RootContentLike[],
    ctx.componentCursor ? ctx : { ...ctx, componentCursor: { value: 0 } },
  ).map(
    (entry) => entry.html,
  );
}

function renderChildEntries(
  children: RootContentLike[],
  ctx: RenderContext,
): RenderEntry[] {
  const entries: RenderEntry[] = [];
  let prevEndLine: number | undefined;

  for (const child of children) {
    const startLine = getStartLine(child);
    if (
      prevEndLine !== undefined &&
      startLine !== undefined &&
      startLine - prevEndLine > 1
    ) {
      pushBlankEntries(entries, startLine - prevEndLine - 1, ctx);
    }

    entries.push(...renderNodeEntries(child, getChildRenderContext(child, ctx)));

    const endLine = getEndLine(child);
    if (endLine !== undefined) {
      prevEndLine = endLine;
    }
  }

  return entries;
}

function renderNodeEntries(
  node: RootContentLike,
  ctx: RenderContext,
): RenderEntry[] {
  switch (node.type) {
    case "heading":
      return [
        createCachedEntry("heading", node, ctx, () =>
          renderHeadingNode(node as Heading, ctx),
        ),
      ];
    case "paragraph":
      return renderParagraphEntries(node as Paragraph, ctx);
    case "code":
      return [
        createCachedEntry("code", node, ctx, () =>
          renderCodeBlockNode(node as Code),
        ),
      ];
    case "blockquote":
      return [
        createCachedEntry("blockquote", node, ctx, () =>
          renderBlockquoteNode(node as Blockquote, ctx),
        ),
      ];
    case "list": {
      const list = node as List;
      if (list.ordered && list.spread) {
        return renderLooseOrderedListEntries(list, ctx);
      }

      return [
        createCachedEntry(
          list.ordered ? "ordered-list" : "unordered-list",
          list,
          ctx,
          () => (list.ordered ? renderOrderedList(list, ctx) : renderUnorderedList(list, ctx)),
        ),
      ];
    }
    case "table":
      return [
        createCachedEntry("table", node, ctx, () =>
          renderTableNode(node as Table, ctx),
        ),
      ];
    case "thematicBreak":
      return [
        createCachedEntry("hr", node, ctx, () =>
          '<hr style="border: 0; border-top: 1px solid #ddd;">',
        ),
      ];
    case "image":
      return [
        createCachedEntry("image", node, ctx, () =>
          renderImageNode(node as Image, ctx.options),
        ),
      ];
    case "html":
      return [
        createCachedEntry("html", node, ctx, () => (node as HtmlLike).value),
      ];
    case "definition":
    case "footnoteDefinition":
      return [];
    case "mdxjsEsm": {
      const esmNode = node as MdxjsEsmLike;
      const esmValue = (esmNode.value ?? "").trimStart();
      const esmCode = esmValue.startsWith("export")
        ? "MDX_EXPORT" as const
        : "MDX_IMPORT" as const;
      ctx.errors?.pushAll([createError(esmCode, undefined, esmNode, "info")]);
      return [];
    }
    case "mdxFlowExpression": {
      ctx.errors?.pushAll([
        createError("MDX_RUNTIME_EXPR", undefined, node, "info"),
      ]);
      return [];
    }
    case "mdxJsxFlowElement":
      return [
        createCachedEntry("component", node, ctx, () =>
          renderComponent(node as MdxJsxFlowElementLike, ctx),
        ),
      ];
    default:
      return [];
  }
}

function renderParagraphEntries(
  node: Paragraph,
  ctx: RenderContext,
): RenderEntry[] {
  const linkedImage = getLinkedImage(node);
  if (linkedImage) {
    return [
      createCachedEntry("linked-image", linkedImage, ctx, () =>
        renderLinkedImageNode(
          linkedImage.image,
          linkedImage.url,
          ctx.options,
        ),
      ),
    ];
  }

  const image = getStandaloneImage(node);
  if (image) {
    return [
      createCachedEntry("image", image, ctx, () =>
        renderImageNode(image, ctx.options),
      ),
    ];
  }

  const hugoFigure = getHugoFigure(node);
  if (hugoFigure) {
    return [
      createCachedEntry("hugo-figure", hugoFigure, ctx, () =>
        renderHugoFigure(hugoFigure, ctx.options),
      ),
    ];
  }

  return [
    createCachedEntry("paragraph", node, ctx, () =>
      `<p>${renderInline(node.children, ctx)}</p>`,
    ),
  ];
}

function renderHeadingNode(node: Heading, ctx: RenderContext): string {
  const level = node.depth || 1;
  const sizes: Record<number, string> = {
    1: "2em",
    2: "1.5em",
    3: "1.17em",
    4: "1em",
    5: "0.83em",
    6: "0.67em",
  };
  const tag = `h${level}`;
  return `<${tag} style="font-size: ${sizes[level]}; font-weight: bold;">${renderInline(node.children, ctx)}</${tag}>`;
}

function renderCodeBlockNode(node: Code): string {
  const lang = node.lang || "";
  const codeLines = node.value.split("\n");
  const renderedLines = codeLines.map((line) => {
    const highlighted = highlightCode(line, lang);
    return `<div>${highlighted}</div>`;
  });

  return `<div style="${CODE_BLOCK_STYLE}">${renderedLines.join("")}</div>`;
}

function renderBlockquoteNode(node: Blockquote, ctx: RenderContext): string {
  const content = node.children
    .map((child) => {
      if (child.type === "paragraph") {
        return renderInline((child as Paragraph).children, ctx);
      }
      return renderBlock(child as RootContent, ctx);
    })
    .filter((value) => value !== "")
    .join("<br>");

  return `<div style="${BLOCKQUOTE_STYLE}">\n<p>${content}</p>\n</div>`;
}

function renderOrderedList(node: List, ctx: RenderContext): string {
  const lines = flattenTightList(node, ctx).map((item) => {
    const indent = "&nbsp;".repeat(item.depth * NBSP_PER_LEVEL);
    return `<p class="se-text-paragraph se-text-paragraph-align-left" style="line-height: 1.8;"><span class="se-ff-nanumgothic se-fs15 __se-node" style="color: rgb(0, 0, 0);">${indent}${item.number}. ${item.html}</span></p>`;
  });

  return lines.join("\n");
}

function renderUnorderedList(node: List, ctx: RenderContext): string {
  const lines = flattenTightList(node, ctx).map((item) => {
    const bulletChar = BULLET_CHARS[Math.min(item.depth, BULLET_CHARS.length - 1)];
    const bullet =
      bulletChar === "▪"
        ? `<span style="font-size: 0.7em;">${bulletChar}</span>`
        : bulletChar;
    const indent = "&nbsp;".repeat(item.depth * NBSP_PER_LEVEL);
    return `<p class="se-text-paragraph se-text-paragraph-align-left" style="line-height: 1.8;"><span class="se-ff-nanumgothic se-fs15 __se-node" style="color: rgb(0, 0, 0);">${indent}${bullet} ${item.html}</span></p>`;
  });

  return lines.join("\n");
}

function flattenTightList(
  list: List,
  ctx: RenderContext,
  depth = 0,
): FlatListEntry[] {
  const entries: FlatListEntry[] = [];
  const start = list.start ?? 1;

  list.children.forEach((item, index) => {
    const listItem = item as ListItem;
    const paragraph = listItem.children.find(
      (child): child is Paragraph => child.type === "paragraph",
    );

    if (paragraph) {
      entries.push({
        depth,
        html: renderInline(paragraph.children, ctx),
        number: list.ordered ? start + index : undefined,
      });
    }

    for (const child of listItem.children) {
      if (child.type === "list") {
        entries.push(...flattenTightList(child as List, ctx, depth + 1));
      }
    }
  });

  return entries;
}

function renderLooseOrderedListEntries(
  node: List,
  ctx: RenderContext,
): RenderEntry[] {
  const entries: RenderEntry[] = [];
  let prevEndLine: number | undefined;
  const start = node.start ?? 1;

  node.children.forEach((item, index) => {
    let firstBlock = true;

    for (const child of (item as ListItem).children as RootContentLike[]) {
      const startLine = getStartLine(child);
      if (
        prevEndLine !== undefined &&
        startLine !== undefined &&
        startLine - prevEndLine > 1
      ) {
        pushBlankEntries(entries, startLine - prevEndLine - 1, ctx);
      }

      if (firstBlock && child.type === "paragraph") {
        entries.push(
          createCachedEntry(
            "paragraph",
            {
              prefix: `${start + index}. `,
              node: child,
            },
            ctx,
            () =>
              renderPrefixedParagraph(
                child as Paragraph,
                `${start + index}. `,
                ctx,
              ),
          ),
        );
      } else {
        entries.push(...renderNodeEntries(child, ctx));
      }

      const endLine = getEndLine(child);
      if (endLine !== undefined) {
        prevEndLine = endLine;
      }
      firstBlock = false;
    }
  });

  return entries;
}

function renderPrefixedParagraph(
  node: Paragraph,
  prefix: string,
  ctx: RenderContext,
): string {
  return `<p>${prefix}${renderInline(node.children, ctx)}</p>`;
}

function renderTableNode(node: Table, ctx: RenderContext): string {
  const lines: string[] = [];
  lines.push(
    '<table style="border-collapse: collapse; width: 100%; border: 1px solid #ddd;">',
  );
  lines.push('<thead style="background-color: #f6f8fa;">');
  lines.push('<tr style="border-bottom: 1px solid #ddd;">');

  const headerRow = node.children[0] as TableRow | undefined;
  for (const cell of headerRow?.children ?? []) {
    lines.push(
      `<th style="border: 1px solid #ddd; padding: 8px 12px; font-weight: bold; text-align: left;">${renderInline(
        (cell as TableCell).children,
        ctx,
      )}</th>`,
    );
  }

  lines.push("</tr>");
  lines.push("</thead>");

  const bodyLines: string[] = [];
  const rows = node.children.slice(1) as TableRow[];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const prefix = rowIndex === 0 ? "<tbody>" : "";
    bodyLines.push(`${prefix}<tr style="border-bottom: 1px solid #ddd;">`);
    for (const cell of rows[rowIndex].children) {
      bodyLines.push(
        `<td style="border: 1px solid #ddd; padding: 8px 12px;">${renderInline(
          (cell as TableCell).children,
          ctx,
        )}</td>`,
      );
    }
    bodyLines.push("</tr>");
  }
  bodyLines.push("</tbody></table>");

  return lines.join("\n") + "\n" + bodyLines.join("\n");
}

function renderImageNode(image: Image, options?: ConvertOptions): string {
  const src = resolveUrl(image.url, "image", options);
  return `<div><img src="${src}" alt="${image.alt ?? ""}" style="max-width: 100%; height: auto;"></div>`;
}

function renderLinkedImageNode(
  image: Image,
  url: string,
  options?: ConvertOptions,
): string {
  const src = resolveUrl(image.url, "image", options);
  const href = resolveUrl(url, "link", options);
  return `<div><a href="${href}"><img src="${src}" alt="${image.alt ?? ""}" style="max-width: 100%; height: auto;"></a></div>`;
}

function renderHugoFigure(content: string, options?: ConvertOptions): string {
  const match = content.match(HUGO_FIGURE_PATTERN);
  if (!match) {
    return `<p>${escapeHtml(content)}</p>`;
  }

  const src = resolveUrl(match[1], "image", options);
  return `<div><img src="${src}" alt="${match[2]}" style="max-width: 100%; height: auto;"></div><div><span class="figure-caption" style="font-size: 0.9em; background-color: #fee; padding: 4px 8px; display: inline-block; margin-top: 4px; font-style: italic;">${escapeHtml(match[3])}</span></div>`;
}

function getStandaloneImage(node: Paragraph): Image | undefined {
  if (node.children.length !== 1) {
    return undefined;
  }

  const child = node.children[0];
  return child.type === "image" ? (child as Image) : undefined;
}

function getLinkedImage(
  node: Paragraph,
): { image: Image; url: string } | undefined {
  if (node.children.length !== 1 || node.children[0].type !== "link") {
    return undefined;
  }

  const link = node.children[0] as {
    type: "link";
    url: string;
    children: RootContent[];
  };

  if (link.children.length !== 1 || link.children[0].type !== "image") {
    return undefined;
  }

  return {
    image: link.children[0] as unknown as Image,
    url: link.url,
  };
}

function getHugoFigure(node: Paragraph): string | undefined {
  const text = extractPlainText(
    node.children as unknown as Array<{ [key: string]: unknown }>,
  );
  return HUGO_FIGURE_PATTERN.test(text) ? text : undefined;
}

function extractPlainText(nodes: Array<{ [key: string]: unknown }>): string {
  let result = "";

  for (const node of nodes) {
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
          result += extractPlainText(
            node.children as Array<{ [key: string]: unknown }>,
          );
        }
        break;
    }
  }

  return result;
}

function createCachedEntry(
  type: string,
  keySource: unknown,
  ctx: RenderContext,
  render: () => string,
): RenderEntry {
  const key = stableSerialize(keySource);
  const baseId = `${type}:${ctx.hash ? ctx.hash(`${type}\u0001${key}`) : key}`;
  const cacheKey = createCacheKey(baseId, ctx);
  const cached = ctx.cache?.get(cacheKey);

  if (cached && cached.type === type) {
    return { baseId, type, html: cached.html };
  }

  const html = render();
  ctx.cache?.set(cacheKey, { type, html });
  return { baseId, type, html };
}

function pushBlankEntries(
  entries: RenderEntry[],
  count: number,
  ctx: RenderContext,
): void {
  for (let i = 0; i < count; i++) {
    entries.push(
      createCachedEntry("blank", "blank", ctx, () => "<p>&nbsp;</p>"),
    );
  }
}

function getStartLine(node: { position?: PositionLike } | undefined): number | undefined {
  return node?.position?.start?.line;
}

function getEndLine(node: { position?: PositionLike } | undefined): number | undefined {
  return node?.position?.end?.line;
}

function getChildRenderContext(
  node: RootContentLike,
  ctx: RenderContext,
): RenderContext {
  if (
    node.type !== "mdxJsxFlowElement" ||
    !isRegisteredComponentName(node.name, ctx.options?.components)
  ) {
    return ctx;
  }

  const index = ctx.componentCursor?.value ?? 0;
  if (ctx.componentCursor) {
    ctx.componentCursor.value = index + 1;
  }

  return {
    ...ctx,
    currentComponentIndex: index,
  };
}

function createCacheKey(baseId: string, ctx: RenderContext): string {
  const renderCtx = stableSerialize({
    depth: ctx.depth,
    index: ctx.currentComponentIndex,
    parent: ctx.parentComponentName,
  });

  return ctx.hash ? `${baseId}@${ctx.hash(renderCtx)}` : `${baseId}@${renderCtx}`;
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  const objectValue = value as Record<string, unknown>;
  const keys = Object.keys(objectValue)
    .filter((key) => key !== "position" && key !== "data")
    .sort();

  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(objectValue[key])}`)
    .join(",")}}`;
}
