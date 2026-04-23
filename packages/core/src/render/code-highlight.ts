import { escapeHtml } from "./utils.js";

export function highlightCode(line: string, lang: string): string {
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

export function replaceSpacesOutsideTags(html: string): string {
  const parts = html.split(/(<[^>]+>)/);
  return parts
    .map((part) => {
      if (part.startsWith("<")) return part;
      return part.replace(/ /g, "&nbsp;");
    })
    .join("");
}

export function escapeHtmlPreserveQuotes(str: string): string {
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
  // - keywords (function, return, const) -> <span style="color: #d73a49;">keyword</span>
  // - function names (before `(`) -> <span style="color: #6f42c1;">name</span>
  // - strings -> <span style="color: #032f62;">...</span>
  // - template literals -> special handling with ${} interpolation
  // - numbers/booleans (true, false) -> <span style="color: #005cc5;">value</span>
  // - require -> <span style="color: #005cc5;">require</span>
  // - console -> <span style="color: #e36209;">console</span>
  // - plain text/punctuation: NO wrapping, just plain text
  // - function params like (name) -> (<span>name</span>)

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
