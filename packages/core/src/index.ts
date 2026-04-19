import matter from "gray-matter";

export interface UrlContext {
  type: "link" | "image";
  raw: string;
}

export interface ComponentProps {
  [key: string]: string;
}

export type ComponentRenderer = (
  props: ComponentProps,
  children: string,
) => string;

export interface ConvertOptions {
  transformUrl?: (ctx: UrlContext) => string;
  components?: Record<string, ComponentRenderer>;
}

export interface ConvertResult {
  title: string;
  html: string;
  frontmatter: Record<string, unknown>;
}

export function convert(
  markdown: string,
  options?: ConvertOptions,
): ConvertResult {
  const { data: frontmatter, content: rawContent } = matter(markdown);

  const titleMatch = rawContent.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : "";

  const lines = rawContent.split("\n");
  const blocks = parseBlocks(lines);
  const htmlParts: string[] = [];

  for (const block of blocks) {
    htmlParts.push(renderBlock(block, options));
  }

  let html = htmlParts.join("\n");

  // Add tags from frontmatter
  if (frontmatter.tags && Array.isArray(frontmatter.tags)) {
    const tagStr = frontmatter.tags.map((t: string) => `#${t}`).join(" ");
    html += `<p>${tagStr}</p>`;
  }

  // Trim leading/trailing whitespace and blank <p> tags
  html = html.trim();
  while (html.startsWith("<p>&nbsp;</p>\n")) {
    html = html.slice("<p>&nbsp;</p>\n".length);
  }
  while (html.endsWith("\n<p>&nbsp;</p>")) {
    html = html.slice(0, -"\n<p>&nbsp;</p>".length);
  }

  return { title, html, frontmatter };
}

interface Block {
  type: string;
  content: string;
  level?: number;
  lang?: string;
  items?: ListItem[];
  rows?: string[][];
  headerRow?: string[];
  name?: string;
  props?: ComponentProps;
  children?: string;
}

interface ListItem {
  text: string;
  indent: number;
  ordered: boolean;
  number?: number;
}

function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (line.trim() === "") {
      blocks.push({ type: "blank", content: "" });
      i++;
      continue;
    }

    // Hugo figure shortcode
    const hugoMatch = line.match(
      /\{\{<\s*figure\s+src="([^"]+)"\s+alt="([^"]+)"\s+caption="([^"]+)"\s*>\}\}/,
    );
    if (hugoMatch) {
      blocks.push({ type: "hugo-figure", content: line });
      i++;
      continue;
    }

    // Fenced code block
    if (line.trimStart().startsWith("```")) {
      const indent = line.length - line.trimStart().length;
      const lang = line.trimStart().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length) {
        const cl = lines[i];
        if (cl.trimStart().startsWith("```") && cl.trim() === "```") {
          i++;
          break;
        }
        // Remove leading indentation
        if (indent > 0 && cl.startsWith(" ".repeat(indent))) {
          codeLines.push(cl.slice(indent));
        } else {
          codeLines.push(cl);
        }
        i++;
      }
      blocks.push({ type: "code", content: codeLines.join("\n"), lang });
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        content: headingMatch[2],
        level: headingMatch[1].length,
      });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({ type: "hr", content: "" });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "blockquote", content: quoteLines.join("\n") });
      continue;
    }

    // Unordered list
    if (/^(\s*)[-*+]\s/.test(line)) {
      const listItems: ListItem[] = [];
      while (i < lines.length) {
        const ll = lines[i];
        const lm = ll.match(/^(\s*)[-*+]\s(.+)$/);
        if (lm) {
          listItems.push({
            text: lm[2],
            indent: lm[1].length,
            ordered: false,
          });
          i++;
        } else if (ll.trim() === "") {
          break;
        } else {
          break;
        }
      }
      blocks.push({ type: "unordered-list", content: "", items: listItems });
      continue;
    }

    // Ordered list (with potential code blocks inside)
    if (/^(\s*)\d+\.\s/.test(line)) {
      // Check if this is a "list with code" pattern (loose list with code blocks)
      // Peek ahead to see if there are indented code blocks
      const isLooseList = hasLooseListPattern(lines, i);

      if (isLooseList) {
        // Handle loose ordered list with code blocks
        const result = parseLooseOrderedList(lines, i);
        for (const b of result.blocks) {
          blocks.push(b);
        }
        i = result.nextIndex;
        continue;
      }

      const listItems: ListItem[] = [];
      while (i < lines.length) {
        const ll = lines[i];
        const lm = ll.match(/^(\s*)(\d+)\.\s(.+)$/);
        if (lm) {
          listItems.push({
            text: lm[3],
            indent: lm[1].length,
            ordered: true,
            number: parseInt(lm[2]),
          });
          i++;
        } else if (ll.trim() === "") {
          break;
        } else {
          break;
        }
      }
      blocks.push({ type: "ordered-list", content: "", items: listItems });
      continue;
    }

    // Table
    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      /^\|?\s*[-:]+/.test(lines[i + 1])
    ) {
      const headerRow = parseTableRow(line);
      i += 2; // skip header and separator
      const rows: string[][] = [];
      while (
        i < lines.length &&
        lines[i].includes("|") &&
        lines[i].trim() !== ""
      ) {
        rows.push(parseTableRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", content: "", rows, headerRow });
      continue;
    }

    // Linked image: [![alt](img)](link)
    const linkedImgMatch = line.match(
      /^\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)$/,
    );
    if (linkedImgMatch) {
      blocks.push({ type: "linked-image", content: line });
      i++;
      continue;
    }

    // Standalone image: ![alt](url)
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      blocks.push({ type: "image", content: line });
      i++;
      continue;
    }

    // JSX self-closing component: <ComponentName prop="value" />
    const selfClosingMatch = line.match(
      /^<([A-Z][A-Za-z0-9]*)(\s[^>]*)?\s*\/>/,
    );
    if (selfClosingMatch) {
      const name = selfClosingMatch[1];
      const propsStr = selfClosingMatch[2] || "";
      const props = parseComponentProps(propsStr);
      blocks.push({ type: "component", content: line, name, props });
      i++;
      continue;
    }

    // JSX component with children: <ComponentName prop="value">...</ComponentName>
    const openingMatch = line.match(/^<([A-Z][A-Za-z0-9]*)(\s[^>]*)?>/);
    if (openingMatch) {
      const name = openingMatch[1];
      const propsStr = openingMatch[2] || "";
      const props = parseComponentProps(propsStr);
      const closingTag = `</${name}>`;
      const childLines: string[] = [];
      i++;
      while (i < lines.length) {
        if (lines[i].trim() === closingTag) {
          i++;
          break;
        }
        childLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: "component",
        content: line,
        name,
        props,
        children: childLines.join("\n"),
      });
      continue;
    }

    // Paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !isBlockStart(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: "paragraph", content: paraLines.join("\n") });
    }
  }

  return blocks;
}

function hasLooseListPattern(lines: string[], start: number): boolean {
  // Check if this ordered list has blank lines and indented code blocks
  let i = start;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      // Check if next non-blank line is indented code block or another list item
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === "") j++;
      if (j < lines.length && lines[j].trimStart().startsWith("```")) {
        return true;
      }
      if (j < lines.length && /^\d+\.\s/.test(lines[j])) {
        i = j;
        continue;
      }
      break;
    }
    if (/^\d+\.\s/.test(line)) {
      i++;
      continue;
    }
    break;
  }
  return false;
}

function parseLooseOrderedList(
  lines: string[],
  start: number,
): { blocks: Block[]; nextIndex: number } {
  const blocks: Block[] = [];
  let i = start;

  while (i < lines.length) {
    const line = lines[i];

    // Ordered list item
    const olMatch = line.match(/^(\d+)\.\s(.+)$/);
    if (olMatch) {
      blocks.push({
        type: "paragraph",
        content: `${olMatch[1]}. ${olMatch[2]}`,
      });
      i++;
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      blocks.push({ type: "blank", content: "" });
      i++;
      continue;
    }

    // Indented code block
    if (line.trimStart().startsWith("```")) {
      const indent = line.length - line.trimStart().length;
      const lang = line.trimStart().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length) {
        const cl = lines[i];
        if (cl.trimStart().startsWith("```") && cl.trim() === "```") {
          i++;
          break;
        }
        if (indent > 0 && cl.startsWith(" ".repeat(indent))) {
          codeLines.push(cl.slice(indent));
        } else {
          codeLines.push(cl);
        }
        i++;
      }
      blocks.push({ type: "code", content: codeLines.join("\n"), lang });
      continue;
    }

    // Anything else - end the loose list
    break;
  }

  return { blocks, nextIndex: i };
}

function isBlockStart(line: string): boolean {
  if (/^#{1,6}\s/.test(line)) return true;
  if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) return true;
  if (line.startsWith(">")) return true;
  if (/^```/.test(line.trimStart())) return true;
  if (/^(\s*)[-*+]\s/.test(line)) return true;
  if (/^(\s*)\d+\.\s/.test(line)) return true;
  if (/^\{\{</.test(line)) return true;
  if (/^\[!\[/.test(line)) return true;
  if (/^!\[/.test(line)) return true;
  if (/^<[A-Z]/.test(line)) return true;
  return false;
}

function parseComponentProps(propsStr: string): ComponentProps {
  const props: ComponentProps = {};
  const regex = /(\w+)="([^"]*)"/g;
  let match;
  while ((match = regex.exec(propsStr)) !== null) {
    props[match[1]] = match[2];
  }
  return props;
}

function parseTableRow(line: string): string[] {
  return line
    .split("|")
    .map((c) => c.trim())
    .filter((c) => c !== "");
}

function renderBlock(block: Block, options?: ConvertOptions): string {
  switch (block.type) {
    case "heading":
      return renderHeading(block, options);
    case "paragraph":
      return renderParagraph(block.content, options);
    case "blank":
      return "<p>&nbsp;</p>";
    case "code":
      return renderCodeBlock(block);
    case "blockquote":
      return renderBlockquote(block, options);
    case "ordered-list":
      return renderOrderedList(block, options);
    case "unordered-list":
      return renderUnorderedList(block, options);
    case "table":
      return renderTable(block, options);
    case "hr":
      return '<hr style="border: 0; border-top: 1px solid #ddd;">';
    case "image":
      return renderImage(block.content, options);
    case "linked-image":
      return renderLinkedImage(block.content, options);
    case "hugo-figure":
      return renderHugoFigure(block.content, options);
    case "component":
      return renderComponent(block, options);
    default:
      return "";
  }
}

function renderComponent(block: Block, options?: ConvertOptions): string {
  const renderer = options?.components?.[block.name!];
  const rawChildren = block.children?.trim() || "";
  const processedChildren = rawChildren
    ? rawChildren
        .split("\n")
        .map((line) => processInline(line))
        .join("<br>")
    : "";

  if (renderer) {
    return renderer(block.props || {}, processedChildren);
  }
  // Unregistered component: output children only, strip component tags
  if (processedChildren) {
    return `<p>${processedChildren}</p>`;
  }
  return "";
}

function renderHeading(block: Block, options?: ConvertOptions): string {
  const level = block.level || 1;
  const sizes: Record<number, string> = {
    1: "2em",
    2: "1.5em",
    3: "1.17em",
    4: "1em",
    5: "0.83em",
    6: "0.67em",
  };
  const tag = `h${level}`;
  return `<${tag} style="font-size: ${sizes[level]}; font-weight: bold;">${processInline(block.content, options)}</${tag}>`;
}

function renderParagraph(content: string, options?: ConvertOptions): string {
  const lines = content.split("\n");
  const rendered = lines
    .map((line) => processInline(line, options))
    .join("<br>");
  return `<p>${rendered}</p>`;
}

function renderCodeBlock(block: Block): string {
  const lang = block.lang || "";
  const codeLines = block.content.split("\n");
  const style = `background-color: rgb(246, 248, 250); border: 1px solid rgb(221, 221, 221); border-radius: 6px; padding: 16px; font-family: &quot;Courier New&quot;, monospace; font-size: 0.9em; color: rgb(36, 41, 46);`;

  const renderedLines = codeLines.map((line) => {
    const highlighted = highlightCode(line, lang);
    return `<div>${highlighted}</div>`;
  });

  return `<div style="${style}">${renderedLines.join("")}</div>`;
}

function highlightCode(line: string, lang: string): string {
  if (line === "") return "";

  let result: string;
  switch (lang) {
    case "javascript":
    case "js":
      result = highlightJavaScript(line);
      break;
    case "python":
    case "py":
      result = highlightPython(line);
      break;
    case "yaml":
    case "yml":
      result = highlightYaml(line);
      break;
    default:
      result = escapeHtml(line);
      break;
  }

  // Replace spaces with &nbsp; outside HTML tags
  result = replaceSpacesOutsideTags(result);
  return result;
}

function replaceSpacesOutsideTags(html: string): string {
  const parts = html.split(/(<[^>]+>)/);
  return parts
    .map((part) => {
      if (part.startsWith("<")) return part;
      return part.replace(/ /g, "&nbsp;");
    })
    .join("");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeHtmlPreserveQuotes(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ===================== JavaScript Highlighting =====================

const JS_KEYWORDS = new Set([
  "function",
  "return",
  "const",
  "let",
  "var",
  "if",
  "else",
  "for",
  "while",
  "do",
  "switch",
  "case",
  "break",
  "continue",
  "new",
  "this",
  "class",
  "extends",
  "import",
  "export",
  "from",
  "default",
  "try",
  "catch",
  "finally",
  "throw",
  "typeof",
  "instanceof",
  "async",
  "await",
  "yield",
  "in",
  "of",
]);

function highlightJavaScript(line: string): string {
  // We need to produce output that exactly matches the expected.
  // The expected format:
  // - keywords (function, return, const) → <span style="color: #d73a49;">keyword</span>
  // - function names (before `(`) → <span style="color: #6f42c1;">name</span>
  // - strings → <span style="color: #032f62;">...</span>
  // - template literals → special handling with ${} interpolation
  // - numbers/booleans (true, false) → <span style="color: #005cc5;">value</span>
  // - require → <span style="color: #005cc5;">require</span>
  // - console → <span style="color: #e36209;">console</span>
  // - plain text/punctuation: NO wrapping, just plain text
  // - function params like (name) → (<span>name</span>)

  const tokens = tokenizeJS(line);
  return tokens.map(renderJSToken).join("");
}

interface Token {
  type: string;
  value: string;
}

function tokenizeJS(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    // Spaces
    if (line[i] === " ") {
      let s = "";
      while (i < line.length && line[i] === " ") {
        s += " ";
        i++;
      }
      tokens.push({ type: "space", value: s });
      continue;
    }

    // Template literal
    if (line[i] === "`") {
      let s = "`";
      i++;
      while (i < line.length && line[i] !== "`") {
        s += line[i];
        i++;
      }
      if (i < line.length) {
        s += "`";
        i++;
      }
      tokens.push({ type: "template", value: s });
      continue;
    }

    // String (double or single quote)
    if (line[i] === '"' || line[i] === "'") {
      const quote = line[i];
      let s = quote;
      i++;
      while (i < line.length && line[i] !== quote) {
        if (line[i] === "\\") {
          s += line[i];
          i++;
          if (i < line.length) {
            s += line[i];
            i++;
          }
        } else {
          s += line[i];
          i++;
        }
      }
      if (i < line.length) {
        s += quote;
        i++;
      }
      tokens.push({ type: "string", value: s });
      continue;
    }

    // Identifier
    if (/[a-zA-Z_$]/.test(line[i])) {
      let word = "";
      while (i < line.length && /[a-zA-Z0-9_$]/.test(line[i])) {
        word += line[i];
        i++;
      }
      tokens.push({ type: "identifier", value: word });
      continue;
    }

    // Number
    if (/[0-9]/.test(line[i])) {
      let num = "";
      while (i < line.length && /[0-9.]/.test(line[i])) {
        num += line[i];
        i++;
      }
      tokens.push({ type: "number", value: num });
      continue;
    }

    // Other character (punctuation)
    tokens.push({ type: "punct", value: line[i] });
    i++;
  }

  return tokens;
}

function renderJSToken(token: Token, index: number, tokens: Token[]): string {
  const { type, value } = token;

  if (type === "space") return value;
  if (type === "punct") return escapeHtml(value);
  if (type === "number") {
    return `<span style="color: #005cc5;">${escapeHtml(value)}</span>`;
  }
  if (type === "string") {
    // Convert double-quoted strings to single-quoted in output
    let displayValue = value;
    if (value.startsWith('"') && value.endsWith('"')) {
      displayValue = "'" + value.slice(1, -1) + "'";
    }
    return `<span style="color: #032f62;">${escapeHtml(displayValue)}</span>`;
  }
  if (type === "template") {
    return renderTemplateString(value);
  }
  if (type === "identifier") {
    // Classify the identifier
    if (JS_KEYWORDS.has(value)) {
      return `<span style="color: #d73a49;">${escapeHtml(value)}</span>`;
    }
    if (
      value === "true" ||
      value === "false" ||
      value === "null" ||
      value === "undefined"
    ) {
      return `<span style="color: #005cc5;">${escapeHtml(value)}</span>`;
    }
    if (value === "require") {
      return `<span style="color: #005cc5;">${escapeHtml(value)}</span>`;
    }

    // Check if previous non-space token was "."
    let prevToken: Token | undefined;
    for (let j = index - 1; j >= 0; j--) {
      if (tokens[j].type !== "space") {
        prevToken = tokens[j];
        break;
      }
    }

    // Check if followed by "("
    let nextToken: Token | undefined;
    for (let j = index + 1; j < tokens.length; j++) {
      if (tokens[j].type !== "space") {
        nextToken = tokens[j];
        break;
      }
    }

    if (prevToken?.type === "punct" && prevToken.value === ".") {
      // Property after dot
      if (nextToken?.type === "punct" && nextToken.value === "(") {
        // Method call
        return `<span style="color: #6f42c1;">${escapeHtml(value)}</span>`;
      }
      // Property access (like console)
      return `<span style="color: #e36209;">${escapeHtml(value)}</span>`;
    }

    // Check if it's console (object before .)
    if (nextToken?.type === "punct" && nextToken.value === ".") {
      return `<span style="color: #e36209;">${escapeHtml(value)}</span>`;
    }

    // Function call (identifier followed by '(')
    if (nextToken?.type === "punct" && nextToken.value === "(") {
      return `<span style="color: #6f42c1;">${escapeHtml(value)}</span>`;
    }

    // Function name after 'function' keyword
    if (
      prevToken?.type === "identifier" &&
      JS_KEYWORDS.has(prevToken.value) &&
      prevToken.value === "function"
    ) {
      return `<span style="color: #6f42c1;">${escapeHtml(value)}</span>`;
    }

    // Check if function keyword precedes (with space)
    for (let j = index - 1; j >= 0; j--) {
      if (tokens[j].type === "space") continue;
      if (tokens[j].type === "identifier" && tokens[j].value === "function") {
        return `<span style="color: #6f42c1;">${escapeHtml(value)}</span>`;
      }
      break;
    }

    // Check if it's a function parameter (inside parentheses after function name/def)
    // In the expected output, function params get wrapped: (<span>name</span>)
    // But only single identifiers that are direct params, not things like "result", "markdown"
    if (isFunctionParam(index, tokens)) {
      return `<span>${escapeHtml(value)}</span>`;
    }

    // Plain identifier - no wrapping
    return escapeHtml(value);
  }

  return escapeHtml(value);
}

function isFunctionParam(index: number, tokens: Token[]): boolean {
  // Check if this identifier is inside parens that immediately follow
  // a function declaration: function name(HERE) or after an identifier followed by (
  // Walk backward to find the opening paren
  let parenDepth = 0;
  for (let j = index - 1; j >= 0; j--) {
    if (tokens[j].type === "space") continue;
    if (tokens[j].type === "punct" && tokens[j].value === ")") {
      parenDepth++;
    }
    if (tokens[j].type === "punct" && tokens[j].value === "(") {
      if (parenDepth > 0) {
        parenDepth--;
      } else {
        // Check what's before the paren
        for (let k = j - 1; k >= 0; k--) {
          if (tokens[k].type === "space") continue;
          if (tokens[k].type === "identifier") {
            // It's after a function name or function keyword
            // Check if this is a function declaration (function greet(name))
            // or a function call (log(x))
            // For function declarations, params get <span>
            // For function calls, params do NOT get <span>

            // Look further back to see if there's a "function" keyword
            for (let l = k - 1; l >= 0; l--) {
              if (tokens[l].type === "space") continue;
              if (
                tokens[l].type === "identifier" &&
                tokens[l].value === "function"
              ) {
                return true; // function declaration param
              }
              break;
            }
          }
          break;
        }
        break;
      }
    }
    if (
      tokens[j].type === "identifier" ||
      (tokens[j].type === "punct" && tokens[j].value === ",")
    ) {
      continue;
    }
    break;
  }
  return false;
}

function renderTemplateString(value: string): string {
  // Template literal: `Hello, ${name}!`
  // Expected output:
  // <span style="color: #032f62;">`Hello,&nbsp;<span style="color: #24292e;">${name}</span>!`</span>
  // Note: the whole thing is wrapped in a string-colored span, with ${} parts
  // getting nested spans with default color

  const parts: string[] = [];
  let i = 1; // skip opening backtick
  let textPart = "`";

  while (i < value.length - 1) {
    if (value[i] === "$" && i + 1 < value.length - 1 && value[i + 1] === "{") {
      // Found ${...}
      // The text before goes as escaped text, then ${expr} as a nested span
      i += 2;
      let braceDepth = 1;
      let exprContent = "";
      while (i < value.length - 1 && braceDepth > 0) {
        if (value[i] === "{") braceDepth++;
        if (value[i] === "}") {
          braceDepth--;
          if (braceDepth === 0) {
            i++;
            break;
          }
        }
        exprContent += value[i];
        i++;
      }
      // Close current text, add expression, continue
      parts.push(escapeHtml(textPart));
      parts.push(
        `<span style="color: #24292e;">\${${escapeHtml(exprContent)}}</span>`,
      );
      textPart = "";
    } else {
      textPart += value[i];
      i++;
    }
  }
  textPart += "`"; // closing backtick

  if (textPart) {
    parts.push(escapeHtml(textPart));
  }

  return `<span style="color: #032f62;">${parts.join("")}</span>`;
}

// ===================== Python Highlighting =====================

const PYTHON_KEYWORDS = new Set([
  "def",
  "return",
  "class",
  "if",
  "elif",
  "else",
  "for",
  "while",
  "import",
  "from",
  "as",
  "try",
  "except",
  "finally",
  "raise",
  "with",
  "yield",
  "lambda",
  "pass",
  "break",
  "continue",
  "and",
  "or",
  "not",
  "in",
  "is",
  "global",
  "nonlocal",
  "assert",
  "del",
]);

function highlightPython(line: string): string {
  // Python highlighting with special handling for function params
  // Expected: def <func>(<span>params</span>):
  const tokens = tokenizePython(line);

  // Post-process: merge function param tokens into a single span
  const result: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    // Check if this is a function call/def paren
    if (tokens[i].type === "punct" && tokens[i].value === "(" && i > 0) {
      // Check if previous non-space token is a function name
      let prevIdx = i - 1;
      while (prevIdx >= 0 && tokens[prevIdx].type === "space") prevIdx--;
      if (prevIdx >= 0 && tokens[prevIdx].type === "identifier") {
        // Check if this is after "def" keyword (function declaration)
        let isDefParam = false;
        for (let k = prevIdx - 1; k >= 0; k--) {
          if (tokens[k].type === "space") continue;
          if (tokens[k].type === "identifier" && tokens[k].value === "def") {
            isDefParam = true;
          }
          break;
        }

        if (isDefParam) {
          // Collect everything between ( and ) as param content
          result.push("(");
          i++;
          let paramContent = "";
          while (
            i < tokens.length &&
            !(tokens[i].type === "punct" && tokens[i].value === ")")
          ) {
            paramContent += tokens[i].value;
            i++;
          }
          if (paramContent) {
            result.push(`<span>${escapeHtml(paramContent)}</span>`);
          }
          if (i < tokens.length) {
            result.push(")");
            i++;
          }
          continue;
        }
      }
    }

    result.push(renderPythonToken(tokens[i], i, tokens));
    i++;
  }

  return result.join("");
}

function tokenizePython(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    if (line[i] === " ") {
      let s = "";
      while (i < line.length && line[i] === " ") {
        s += " ";
        i++;
      }
      tokens.push({ type: "space", value: s });
      continue;
    }

    if (line[i] === '"' || line[i] === "'") {
      const quote = line[i];
      let s = quote;
      i++;
      while (i < line.length && line[i] !== quote) {
        s += line[i];
        i++;
      }
      if (i < line.length) {
        s += quote;
        i++;
      }
      tokens.push({ type: "string", value: s });
      continue;
    }

    if (/[a-zA-Z_]/.test(line[i])) {
      let word = "";
      while (i < line.length && /[a-zA-Z0-9_]/.test(line[i])) {
        word += line[i];
        i++;
      }
      tokens.push({ type: "identifier", value: word });
      continue;
    }

    if (/[0-9]/.test(line[i])) {
      let num = "";
      while (i < line.length && /[0-9.]/.test(line[i])) {
        num += line[i];
        i++;
      }
      tokens.push({ type: "number", value: num });
      continue;
    }

    tokens.push({ type: "punct", value: line[i] });
    i++;
  }

  return tokens;
}

function renderPythonToken(
  token: Token,
  index: number,
  tokens: Token[],
): string {
  const { type, value } = token;

  if (type === "space") return value;
  if (type === "punct") return escapeHtml(value);
  if (type === "number") {
    return `<span style="color: #005cc5;">${escapeHtml(value)}</span>`;
  }
  if (type === "string") {
    return `<span style="color: #032f62;">${escapeHtml(value)}</span>`;
  }
  if (type === "identifier") {
    if (PYTHON_KEYWORDS.has(value)) {
      return `<span style="color: #d73a49;">${escapeHtml(value)}</span>`;
    }
    if (value === "True" || value === "False" || value === "None") {
      return `<span style="color: #005cc5;">${escapeHtml(value)}</span>`;
    }

    // Check if function name (after def keyword)
    for (let j = index - 1; j >= 0; j--) {
      if (tokens[j].type === "space") continue;
      if (tokens[j].type === "identifier" && tokens[j].value === "def") {
        return `<span style="color: #6f42c1;">${escapeHtml(value)}</span>`;
      }
      break;
    }

    // Function call
    let nextToken: Token | undefined;
    for (let j = index + 1; j < tokens.length; j++) {
      if (tokens[j].type !== "space") {
        nextToken = tokens[j];
        break;
      }
    }
    if (nextToken?.type === "punct" && nextToken.value === "(") {
      return `<span style="color: #6f42c1;">${escapeHtml(value)}</span>`;
    }

    return value;
  }

  return escapeHtml(value);
}

// ===================== YAML Highlighting =====================

function highlightYaml(line: string): string {
  // Comment line: # ...
  if (/^\s*#/.test(line)) {
    return `<span style="color: #6a737d;">${escapeHtml(line)}</span>`;
  }

  // Document separator: ---
  if (/^---\s*$/.test(line)) {
    return `<span style="color: #005cc5;">${escapeHtml(line)}</span>`;
  }

  // Key-value line: key: value
  const kvMatch = line.match(/^(\s*)(- )?([a-zA-Z_][a-zA-Z0-9_]*)(:)(.*)?$/);
  if (kvMatch) {
    const [, indent, dash, key, colon, rest] = kvMatch;
    let result = escapeHtml(indent);

    if (dash) {
      result += `<span>${escapeHtml(dash.trimEnd())}</span> `;
    }

    result += `<span style="color: #005cc5;">${escapeHtml(key + colon)}</span>`;

    if (rest !== undefined && rest !== "") {
      result += highlightYamlValue(rest);
    }

    return result;
  }

  // List item without key: - value
  const listMatch = line.match(/^(\s*)(- )(.+)$/);
  if (listMatch) {
    const [, indent, dash, value] = listMatch;
    let result = escapeHtml(indent);
    result += `<span>${escapeHtml(dash.trimEnd())}</span> `;
    result += highlightYamlValue(" " + value).slice(1); // trim leading space handling
    return result;
  }

  return escapeHtml(line);
}

function highlightYamlValue(value: string): string {
  // Process inline value after the colon
  let result = "";
  let i = 0;

  while (i < value.length) {
    // Spaces
    if (value[i] === " ") {
      result += " ";
      i++;
      continue;
    }

    // Quoted string
    if (value[i] === '"' || value[i] === "'") {
      const quote = value[i];
      let s = quote;
      i++;
      while (i < value.length && value[i] !== quote) {
        s += value[i];
        i++;
      }
      if (i < value.length) {
        s += quote;
        i++;
      }
      result += `<span style="color: #032f62;">${escapeHtmlPreserveQuotes(s)}</span>`;
      continue;
    }

    // Boolean, null, numbers
    const restOfValue = value.slice(i);
    const boolMatch = restOfValue.match(
      /^(true|false|null|yes|no|on|off|\d+(?:\.\d+)?)\b/,
    );
    if (boolMatch) {
      result += `<span style="color: #005cc5;">${escapeHtml(boolMatch[1])}</span>`;
      i += boolMatch[1].length;
      continue;
    }

    // Other characters (brackets, commas, etc.)
    result += escapeHtml(value[i]);
    i++;
  }

  return result;
}

// ===================== Blockquote =====================

function renderBlockquote(block: Block, options?: ConvertOptions): string {
  const style = `border-left: 4px solid rgb(220, 53, 69); padding: 1em 1.5em; background-color: rgb(246, 248, 250); color: rgb(36, 41, 46); border-radius: 4px;`;
  const lines = block.content.split("\n");
  const content = lines.map((l) => processInline(l, options)).join("<br>");
  return `<div style="${style}">\n<p>${content}</p>\n</div>`;
}

// ===================== Lists =====================

function renderOrderedList(block: Block, options?: ConvertOptions): string {
  if (!block.items) return "";

  const hasNested = block.items.some((item) => item.indent > 0);
  if (!hasNested) {
    return block.items
      .map(
        (item) => `<p>${item.number}. ${processInline(item.text, options)}</p>`,
      )
      .join("");
  }

  return renderNestedOrderedList(block.items, options);
}

function renderNestedOrderedList(
  items: ListItem[],
  options?: ConvertOptions,
): string {
  const parts: string[] = [];
  let i = 0;

  while (i < items.length) {
    const item = items[i];
    if (item.indent === 0) {
      parts.push(`<p>${item.number}. ${processInline(item.text, options)}</p>`);
      i++;

      const children: ListItem[] = [];
      while (i < items.length && items[i].indent > 0) {
        children.push(items[i]);
        i++;
      }

      if (children.length > 0) {
        const olParts: string[] = [];
        olParts.push(
          `<ol style="padding-left: 2em; list-style-type: decimal;">`,
        );
        for (const child of children) {
          olParts.push(`<li>${processInline(child.text, options)}</li>`);
        }
        olParts.push(`</ol>`);
        parts.push(olParts.join("\n"));
      }
    } else {
      i++;
    }
  }

  return parts.join("");
}

// Flat <p> blocks with literal bullet characters + leading &nbsp; run.
// This is the only way to get whole-line stepping (marker + text
// together) in Naver paste — Naver strips inline margin/padding from
// <ul> and <p>, but literal characters always survive. Result most
// closely resembles Naver's native nested list visual.
const BULLET_CHARS = ["•", "◦", "▪"] as const;
const NBSP_PER_LEVEL = 6; // ~30px visual indent at editor's 15px font

function renderUnorderedList(block: Block, options?: ConvertOptions): string {
  if (!block.items || block.items.length === 0) return "";

  const depthByIndent = new Map<number, number>();
  const sortedIndents = Array.from(
    new Set(block.items.map((item) => item.indent)),
  ).sort((a, b) => a - b);
  sortedIndents.forEach((indent, depth) => depthByIndent.set(indent, depth));

  const lines: string[] = [];
  for (const item of block.items) {
    const depth = depthByIndent.get(item.indent) ?? 0;
    const bullet = BULLET_CHARS[Math.min(depth, BULLET_CHARS.length - 1)];
    const indent = "&nbsp;".repeat(depth * NBSP_PER_LEVEL);
    const text = processInline(item.text, options);
    lines.push(
      `<p class="se-text-paragraph se-text-paragraph-align-left" style="line-height: 1.8;"><span class="se-ff-nanumgothic se-fs15 __se-node" style="color: rgb(0, 0, 0);">${indent}${bullet} ${text}</span></p>`,
    );
  }
  return lines.join("\n");
}

// ===================== Table =====================

function renderTable(block: Block, options?: ConvertOptions): string {
  if (!block.headerRow || !block.rows) return "";

  const lines: string[] = [];
  lines.push(
    `<table style="border-collapse: collapse; width: 100%; border: 1px solid #ddd;">`,
  );
  lines.push(`<thead style="background-color: #f6f8fa;">`);
  lines.push(`<tr style="border-bottom: 1px solid #ddd;">`);
  for (const cell of block.headerRow) {
    lines.push(
      `<th style="border: 1px solid #ddd; padding: 8px 12px; font-weight: bold; text-align: left;">${processInline(cell, options)}</th>`,
    );
  }
  lines.push(`</tr>`);
  lines.push(`</thead>`);

  // <tbody> goes on same line as first <tr>
  const bodyLines: string[] = [];
  for (let ri = 0; ri < block.rows.length; ri++) {
    const row = block.rows[ri];
    const prefix = ri === 0 ? "<tbody>" : "";
    bodyLines.push(`${prefix}<tr style="border-bottom: 1px solid #ddd;">`);
    for (const cell of row) {
      bodyLines.push(
        `<td style="border: 1px solid #ddd; padding: 8px 12px;">${processInline(cell, options)}</td>`,
      );
    }
    bodyLines.push(`</tr>`);
  }
  bodyLines.push(`</tbody></table>`);

  return lines.join("\n") + "\n" + bodyLines.join("\n");
}

// ===================== Images =====================

function resolveUrl(
  url: string,
  type: "link" | "image",
  options?: ConvertOptions,
): string {
  if (options?.transformUrl) {
    return options.transformUrl({ type, raw: url });
  }
  return url;
}

function renderImage(content: string, options?: ConvertOptions): string {
  const match = content.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (!match) return `<p>${processInline(content, options)}</p>`;
  const src = resolveUrl(match[2], "image", options);
  return `<div><img src="${src}" alt="${match[1]}" style="max-width: 100%; height: auto;"></div>`;
}

function renderLinkedImage(content: string, options?: ConvertOptions): string {
  const match = content.match(/^\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)$/);
  if (!match) return `<p>${processInline(content, options)}</p>`;
  const src = resolveUrl(match[2], "image", options);
  const href = resolveUrl(match[3], "link", options);
  return `<div><a href="${href}"><img src="${src}" alt="${match[1]}" style="max-width: 100%; height: auto;"></a></div>`;
}

function renderHugoFigure(content: string, options?: ConvertOptions): string {
  const match = content.match(
    /\{\{<\s*figure\s+src="([^"]+)"\s+alt="([^"]+)"\s+caption="([^"]+)"\s*>\}\}/,
  );
  if (!match) return `<p>${escapeHtml(content)}</p>`;
  const src = resolveUrl(match[1], "image", options);
  return `<div><img src="${src}" alt="${match[2]}" style="max-width: 100%; height: auto;"></div><div><span class="figure-caption" style="font-size: 0.9em; background-color: #fee; padding: 4px 8px; display: inline-block; margin-top: 4px; font-style: italic;">${escapeHtml(match[3])}</span></div>`;
}

// ===================== Inline Processing =====================

function processInline(text: string, options?: ConvertOptions): string {
  let result = "";
  let i = 0;

  while (i < text.length) {
    // Inline code
    if (text[i] === "`") {
      const end = text.indexOf("`", i + 1);
      if (end !== -1) {
        const code = text.slice(i + 1, end);
        result += `<code style="background-color: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: &quot;Courier New&quot;, monospace; font-size: 0.9em;">${escapeHtml(code)}</code>`;
        i = end + 1;
        continue;
      }
    }

    // Bold+Italic (*** or ___)
    if (text.slice(i, i + 3) === "***" || text.slice(i, i + 3) === "___") {
      const marker = text.slice(i, i + 3);
      const end = text.indexOf(marker, i + 3);
      if (end !== -1) {
        const inner = processInline(text.slice(i + 3, end), options);
        result += `<em style="font-style: italic;"><strong style="font-weight: bold;">${inner}</strong></em>`;
        i = end + 3;
        continue;
      }
    }

    // Bold (**)
    if (text.slice(i, i + 2) === "**") {
      const end = findClosingMarker(text, i + 2, "**");
      if (end !== -1) {
        const inner = processInline(text.slice(i + 2, end), options);
        result += `<strong style="font-weight: bold;">${inner}</strong>`;
        i = end + 2;
        continue;
      }
    }

    // Strikethrough
    if (text.slice(i, i + 2) === "~~") {
      const end = text.indexOf("~~", i + 2);
      if (end !== -1) {
        const inner = processInline(text.slice(i + 2, end), options);
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
        const inner = processInline(text.slice(i + 1, end), options);
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
        const inner = processInline(linkText, options);
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

function findClosingMarker(
  text: string,
  start: number,
  marker: string,
): number {
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
