import type { RootContent } from "mdast";
import { renderChildren, type RenderContext } from "./block.js";

export interface MdxJsxAttributeLike {
  type: "mdxJsxAttribute";
  name: string;
  value?: unknown;
}

export interface MdxJsxExpressionAttributeLike {
  type: "mdxJsxExpressionAttribute";
}

export interface MdxJsxFlowElementLike {
  type: "mdxJsxFlowElement";
  name: string | null;
  attributes: Array<MdxJsxAttributeLike | MdxJsxExpressionAttributeLike>;
  children: RootContent[];
  position?: {
    start?: { line?: number };
    end?: { line?: number };
  };
}

export function renderComponent(
  node: MdxJsxFlowElementLike,
  ctx: RenderContext,
): string {
  const childrenHtml = renderChildren(node.children, {
    ...ctx,
    depth: ctx.depth + 1,
  }).join("\n");

  if (node.name === null) {
    return childrenHtml;
  }

  if (!/^[A-Z]/.test(node.name)) {
    return childrenHtml;
  }

  const renderer = ctx.options?.components?.[node.name];
  if (!renderer) {
    return childrenHtml;
  }

  return renderer(extractStringProps(node.attributes), childrenHtml);
}

export function extractStringProps(
  attributes: Array<MdxJsxAttributeLike | MdxJsxExpressionAttributeLike>,
): Record<string, string> {
  const props: Record<string, string> = {};

  for (const attribute of attributes) {
    if (
      attribute.type === "mdxJsxAttribute" &&
      typeof attribute.value === "string"
    ) {
      props[attribute.name] = attribute.value;
    }
  }

  return props;
}
