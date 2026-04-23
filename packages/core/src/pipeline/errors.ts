export type ParseErrorCode =
  | "MDX_PARSE_ERROR"
  | "MDX_RUNTIME_EXPR"
  | "MDX_IMPORT"
  | "MDX_EXPORT"
  | "MDX_UNCLOSED_TAG"
  | "MDX_NON_LITERAL_ATTR"
  | "MDX_SPREAD_ATTR";

export interface ParseError {
  code: ParseErrorCode;
  message: string;
  severity: "error" | "warning" | "info";
  position?: { line: number; column: number; offset?: number };
}

type NormalizedPosition = NonNullable<ParseError["position"]>;

const ERROR_PREFIX: Record<ParseErrorCode, string> = {
  MDX_PARSE_ERROR: "MDX 파싱 오류",
  MDX_RUNTIME_EXPR: "런타임 표현식은 지원되지 않습니다",
  MDX_IMPORT: "import 구문은 지원되지 않습니다",
  MDX_EXPORT: "export 구문은 지원되지 않습니다",
  MDX_UNCLOSED_TAG: "닫히지 않은 태그",
  MDX_NON_LITERAL_ATTR: "정적 리터럴이 아닌 속성",
  MDX_SPREAD_ATTR: "spread 속성은 지원되지 않습니다",
};

export class ErrorCollector {
  private readonly errors: ParseError[] = [];

  push(error: ParseError): void {
    this.errors.push(error);
  }

  pushAll(errors: ParseError[]): void {
    this.errors.push(...errors);
  }

  drain(): ParseError[] {
    return this.errors.splice(0);
  }

  get length(): number {
    return this.errors.length;
  }
}

export function createError(
  code: ParseErrorCode,
  message?: string,
  nodeOrPosition?: unknown,
  severity: ParseError["severity"] = "error",
): ParseError {
  const position = normalizePosition(nodeOrPosition);
  const formattedMessage = formatMessage(code, message);

  return {
    code,
    message: formattedMessage,
    severity,
    ...(position ? { position } : {}),
  };
}

function formatMessage(code: ParseErrorCode, message?: string): string {
  const prefix = ERROR_PREFIX[code];
  const detail = message?.trim();

  if (!detail) {
    return prefix;
  }

  if (detail.startsWith(prefix)) {
    return detail;
  }

  return `${prefix}: ${detail}`;
}

function normalizePosition(value: unknown): NormalizedPosition | undefined {
  if (!isObjectLike(value)) {
    return undefined;
  }

  const candidate = isObjectLike(value.position) ? value.position : value;
  const point = isObjectLike(candidate.start) ? candidate.start : candidate;
  const line = toFiniteNumber(point.line);
  const column = toFiniteNumber(point.column);
  const offset = toFiniteNumber(point.offset);

  if (line === undefined || column === undefined) {
    return undefined;
  }

  return offset === undefined ? { line, column } : { line, column, offset };
}

function toFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isObjectLike(
  value: unknown,
): value is Record<string, unknown> & {
  position?: unknown;
  start?: unknown;
  line?: unknown;
  column?: unknown;
  offset?: unknown;
} {
  return typeof value === "object" && value !== null;
}
