import type { RootContent } from "mdast";
import type {
  ComponentProps,
  ComponentRenderCtx,
  ComponentRenderer,
} from "../index.js";
import { createError, type ParseError } from "../pipeline/errors.js";
import { renderChildren, type RenderContext } from "./block.js";

interface PositionPointLike {
  line?: number;
  column?: number;
  offset?: number;
}

interface PositionLike {
  start?: PositionPointLike;
  end?: PositionPointLike;
}

interface EstreeLiteralLike {
  type?: string;
  value?: unknown;
}

interface EstreeExpressionStatementLike {
  type?: string;
  expression?: EstreeLiteralLike;
}

interface EstreeProgramLike {
  body?: EstreeExpressionStatementLike[];
}

interface MdxJsxAttributeValueExpressionLike {
  type: "mdxJsxAttributeValueExpression";
  value?: string;
  data?: {
    estree?: EstreeProgramLike;
  };
}

export interface MdxJsxAttributeLike {
  type: "mdxJsxAttribute";
  name: string;
  value?: unknown;
  position?: PositionLike;
}

export interface MdxJsxExpressionAttributeLike {
  type: "mdxJsxExpressionAttribute";
  value?: string;
  position?: PositionLike;
  data?: {
    estree?: EstreeProgramLike;
  };
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
  const registeredName = isRegisteredComponentName(
    node.name,
    ctx.options?.components,
  )
    ? node.name
    : undefined;
  const renderer = registeredName
    ? getRegisteredComponentRenderer(registeredName, ctx.options?.components)
    : undefined;
  const childBlocks = renderChildren(
    node.children,
    renderer && registeredName
      ? createRegisteredChildContext(ctx, registeredName)
      : createPassthroughChildContext(ctx),
  );
  const childrenHtml = childBlocks.join("\n");

  if (!renderer) {
    return childrenHtml;
  }

  const { props, errors } = resolveComponentProps(node.attributes);
  ctx.errors?.pushAll(errors);

  return renderer(props, childrenHtml, {
    ...createComponentRenderCtx(ctx),
    childBlocks,
  });
}

export function resolveComponentProps(
  attributes: Array<MdxJsxAttributeLike | MdxJsxExpressionAttributeLike>,
): {
  props: ComponentProps;
  errors: ParseError[];
} {
  const props: ComponentProps = {};
  const errors: ParseError[] = [];

  for (const attribute of attributes) {
    const result = evaluateAttribute(attribute);

    if ("skip" in result) {
      if (result.error) {
        errors.push(result.error);
      }
      continue;
    }

    props[result.key] = result.value;
  }

  return { props, errors };
}

export function evaluateAttribute(
  attribute: MdxJsxAttributeLike | MdxJsxExpressionAttributeLike,
):
  | { key: string; value: ComponentProps[string] }
  | { skip: true; error?: ParseError } {
  if (attribute.type === "mdxJsxExpressionAttribute") {
    return {
      skip: true,
      error: createError("MDX_SPREAD_ATTR", undefined, attribute, "info"),
    };
  }

  if (attribute.value === null || attribute.value === undefined) {
    return {
      key: attribute.name,
      value: true,
    };
  }

  if (typeof attribute.value === "string") {
    return {
      key: attribute.name,
      value: attribute.value,
    };
  }

  const literal = extractLiteralValue(attribute.value);
  if (literal.ok) {
    return {
      key: attribute.name,
      value: literal.value,
    };
  }

  return {
    skip: true,
    error: createError(
      "MDX_NON_LITERAL_ATTR",
      attribute.name,
      attribute,
      "info",
    ),
  };
}

export function isRegisteredComponentName(
  name: string | null,
  components?: Record<string, ComponentRenderer>,
): name is string {
  return isComponentName(name) && components?.[name] !== undefined;
}

export function createComponentRenderCtx(ctx: {
  depth?: number;
  currentComponentIndex?: number;
  parentComponentName?: string;
}): ComponentRenderCtx {
  return {
    depth: ctx.depth ?? 0,
    index: ctx.currentComponentIndex ?? 0,
    childBlocks: [],
    ...(ctx.parentComponentName ? { parent: ctx.parentComponentName } : {}),
  };
}

function createRegisteredChildContext(
  ctx: RenderContext,
  name: string,
): RenderContext {
  return {
    ...ctx,
    depth: ctx.depth + 1,
    parentComponentName: name,
    currentComponentIndex: undefined,
    componentCursor: { value: 0 },
  };
}

function createPassthroughChildContext(ctx: RenderContext): RenderContext {
  return {
    ...ctx,
    currentComponentIndex: undefined,
  };
}

function extractLiteralValue(
  value: unknown,
): { ok: true; value: ComponentProps[string] } | { ok: false } {
  if (!isAttributeValueExpression(value)) {
    return { ok: false };
  }

  const statement = value.data?.estree?.body?.[0];
  if (statement?.type !== "ExpressionStatement") {
    return { ok: false };
  }

  const expression = statement.expression;
  if (expression?.type !== "Literal") {
    return { ok: false };
  }

  const literalValue = expression.value;
  if (
    typeof literalValue === "string" ||
    typeof literalValue === "number" ||
    typeof literalValue === "boolean" ||
    literalValue === null
  ) {
    return { ok: true, value: literalValue };
  }

  return { ok: false };
}

function isAttributeValueExpression(
  value: unknown,
): value is MdxJsxAttributeValueExpressionLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "mdxJsxAttributeValueExpression"
  );
}

function isComponentName(name: string | null): name is string {
  return typeof name === "string" && /^[A-Z]/.test(name);
}

function getRegisteredComponentRenderer(
  name: string | null,
  components?: Record<string, ComponentRenderer>,
): ComponentRenderer | undefined {
  if (!components || !isRegisteredComponentName(name, components)) {
    return undefined;
  }

  return components[name];
}
