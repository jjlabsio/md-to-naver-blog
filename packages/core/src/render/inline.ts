import type { PhrasingContent } from "mdast";
import type { ConvertOptions } from "../index.js";
import { createError } from "../pipeline/errors.js";
import type { RenderContext } from "./block.js";
import {
  createComponentRenderCtx,
  isRegisteredComponentName,
  resolveComponentProps,
  type MdxJsxAttributeLike,
  type MdxJsxExpressionAttributeLike,
} from "./component.js";
import { escapeHtml, resolveUrl } from "./utils.js";

interface MdxJsxTextElementLike {
  type: "mdxJsxTextElement";
  name: string | null;
  attributes: Array<MdxJsxAttributeLike | MdxJsxExpressionAttributeLike>;
  children: PhrasingContentLike[];
}

type PhrasingContentLike =
  | (PhrasingContent & { type: string; [key: string]: unknown })
  | MdxJsxTextElementLike
  | { type: "mdxTextExpression"; value?: string; position?: { start?: { line?: number; column?: number; offset?: number }; end?: { line?: number; column?: number; offset?: number } } };

const INLINE_CODE_STYLE =
  "background-color: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: &quot;Courier New&quot;, monospace; font-size: 0.9em;";

export function renderInline(
  nodes: PhrasingContent[],
  ctx?: RenderContext,
): string {
  const placeholders = new Map<string, string>();
  const mixed = (nodes as PhrasingContentLike[])
    .map((node) => renderNodeToMixedText(node, ctx, placeholders))
    .join("");

  return processInlineMixed(mixed, ctx?.options, placeholders);
}

function renderNodeToMixedText(
  node: PhrasingContentLike,
  ctx: RenderContext | undefined,
  placeholders: Map<string, string>,
): string {
  switch (node.type) {
    case "text":
      return encodeTextWithSoftBreaks(String(node.value ?? ""), placeholders);
    case "emphasis":
      return addPlaceholder(
        `<em style="font-style: italic;">${renderInline(
          (node.children ?? []) as PhrasingContent[],
          ctx,
        )}</em>`,
        placeholders,
      );
    case "strong":
      return addPlaceholder(
        `<strong style="font-weight: bold;">${renderInline(
          (node.children ?? []) as PhrasingContent[],
          ctx,
        )}</strong>`,
        placeholders,
      );
    case "delete":
      return addPlaceholder(
        `<del>${renderInline(
          (node.children ?? []) as PhrasingContent[],
          ctx,
        )}</del>`,
        placeholders,
      );
    case "inlineCode":
      return addPlaceholder(
        `<code style="${INLINE_CODE_STYLE}">${escapeHtml(
          String(node.value ?? ""),
        )}</code>`,
        placeholders,
      );
    case "link":
      return addPlaceholder(
        `<a href="${resolveUrl(
          String(node.url ?? ""),
          "link",
          ctx?.options,
        )}" style="color: #dc3545; text-decoration: underline;">${renderInline(
          (node.children ?? []) as PhrasingContent[],
          ctx,
        )}</a>`,
        placeholders,
      );
    case "image":
      return addPlaceholder(
        `<img src="${resolveUrl(
          String(node.url ?? ""),
          "image",
          ctx?.options,
        )}" alt="${String(node.alt ?? "")}" style="max-width: 100%; height: auto;">`,
        placeholders,
      );
    case "break":
      return addPlaceholder("<br>", placeholders);
    case "mdxJsxTextElement":
      return addPlaceholder(
        renderInlineComponent(node as unknown as MdxJsxTextElementLike, ctx),
        placeholders,
      );
    case "mdxTextExpression":
      ctx?.errors?.pushAll([
        createError("MDX_RUNTIME_EXPR", undefined, node, "info"),
      ]);
      return "";
    default:
      if (Array.isArray(node.children)) {
        return addPlaceholder(
          renderInline(node.children as PhrasingContent[], ctx),
          placeholders,
        );
      }
      return "";
  }
}

function renderInlineComponent(
  node: MdxJsxTextElementLike,
  ctx: RenderContext | undefined,
): string {
  const registeredName = isRegisteredComponentName(
    node.name,
    ctx?.options?.components,
  )
    ? node.name
    : undefined;
  const renderer = registeredName
    ? ctx?.options?.components?.[registeredName]
    : undefined;
  const childContext = renderer
    ? {
        ...ctx,
        depth: (ctx?.depth ?? 0) + 1,
        parentComponentName: registeredName,
        currentComponentIndex: undefined,
      }
    : ctx;
  const childrenHtml = renderInline(
    node.children as PhrasingContent[],
    childContext,
  );

  if (!renderer) {
    return childrenHtml;
  }

  const { props, errors } = resolveComponentProps(node.attributes);
  ctx?.errors?.pushAll(errors);

  return renderer(props, childrenHtml, createComponentRenderCtx(ctx ?? {}));
}

function addPlaceholder(
  html: string,
  placeholders: Map<string, string>,
): string {
  const marker = String.fromCodePoint(0xe000 + placeholders.size);
  placeholders.set(marker, html);
  return marker;
}

function encodeTextWithSoftBreaks(
  value: string,
  placeholders: Map<string, string>,
): string {
  const parts = value.split("\n");

  if (parts.length === 1) {
    return value;
  }

  return parts
    .map((part, index) =>
      index === 0 ? part : `${addPlaceholder("<br>", placeholders)}${part}`,
    )
    .join("");
}

function processInlineMixed(
  text: string,
  options?: ConvertOptions,
  placeholders?: Map<string, string>,
): string {
  let result = "";
  let i = 0;

  while (i < text.length) {
    const placeholderHtml = placeholders?.get(text[i]);
    if (placeholderHtml !== undefined) {
      result += placeholderHtml;
      i++;
      continue;
    }

    // Inline code
    if (text[i] === "`") {
      const end = text.indexOf("`", i + 1);
      if (end !== -1) {
        const code = text.slice(i + 1, end);
        result += `<code style="${INLINE_CODE_STYLE}">${escapeHtml(code)}</code>`;
        i = end + 1;
        continue;
      }
    }

    // Bold+Italic (*** or ___)
    if (text.slice(i, i + 3) === "***" || text.slice(i, i + 3) === "___") {
      const marker = text.slice(i, i + 3);
      const end = text.indexOf(marker, i + 3);
      if (end !== -1) {
        const inner = processInlineMixed(
          text.slice(i + 3, end),
          options,
          placeholders,
        );
        result += `<em style="font-style: italic;"><strong style="font-weight: bold;">${inner}</strong></em>`;
        i = end + 3;
        continue;
      }
    }

    // Bold (**)
    if (text.slice(i, i + 2) === "**") {
      const end = findClosingMarker(text, i + 2, "**");
      if (end !== -1) {
        const inner = processInlineMixed(
          text.slice(i + 2, end),
          options,
          placeholders,
        );
        result += `<strong style="font-weight: bold;">${inner}</strong>`;
        i = end + 2;
        continue;
      }
    }

    // Strikethrough
    if (text.slice(i, i + 2) === "~~") {
      const end = text.indexOf("~~", i + 2);
      if (end !== -1) {
        const inner = processInlineMixed(
          text.slice(i + 2, end),
          options,
          placeholders,
        );
        result += `<del>${inner}</del>`;
        i = end + 2;
        continue;
      }
    }

    // Italic (* or _) - but not ** or __
    if (
      (text[i] === "*" && text[i + 1] !== "*") ||
      (text[i] === "_" && text[i + 1] !== "_")
    ) {
      const marker = text[i];
      const end = findClosingSingleMarker(text, i + 1, marker);
      if (end !== -1 && end > i + 1) {
        const inner = processInlineMixed(
          text.slice(i + 1, end),
          options,
          placeholders,
        );
        result += `<em style="font-style: italic;">${inner}</em>`;
        i = end + 1;
        continue;
      }
    }

    // Link: [text](url)
    if (text[i] === "[") {
      const linkMatch = text.slice(i).match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const [full, linkText, url] = linkMatch;
        const inner = processInlineMixed(linkText, options, placeholders);
        const href = resolveUrl(url, "link", options);
        result += `<a href="${href}" style="color: #dc3545; text-decoration: underline;">${inner}</a>`;
        i += full.length;
        continue;
      }
    }

    // Image: ![alt](url)
    if (text[i] === "!" && text[i + 1] === "[") {
      const imgMatch = text.slice(i).match(/^!\[([^\]]*)\]\(([^)]+)\)/);
      if (imgMatch) {
        const [full, alt, src] = imgMatch;
        const resolvedSrc = resolveUrl(src, "image", options);
        result += `<img src="${resolvedSrc}" alt="${alt}" style="max-width: 100%; height: auto;">`;
        i += full.length;
        continue;
      }
    }

    result += escapeHtml(text[i]);
    i++;
  }

  return result;
}

function findClosingMarker(text: string, start: number, marker: string): number {
  let i = start;
  while (i <= text.length - marker.length) {
    if (text[i] === "`") {
      const end = text.indexOf("`", i + 1);
      if (end !== -1) {
        i = end + 1;
        continue;
      }
    }
    if (text.slice(i, i + marker.length) === marker) {
      return i;
    }
    i++;
  }
  return -1;
}

function findClosingSingleMarker(
  text: string,
  start: number,
  marker: string,
): number {
  let i = start;
  while (i < text.length) {
    if (text[i] === "`") {
      const end = text.indexOf("`", i + 1);
      if (end !== -1) {
        i = end + 1;
        continue;
      }
    }
    if (
      text[i] === marker &&
      (i + 1 >= text.length || text[i + 1] !== marker)
    ) {
      return i;
    }
    i++;
  }
  return -1;
}
