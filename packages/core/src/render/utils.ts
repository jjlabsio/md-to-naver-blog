import type { ConvertOptions } from "../index.js";

export function resolveUrl(
  url: string,
  type: "link" | "image",
  options?: ConvertOptions,
): string {
  if (options?.transformUrl) {
    return options.transformUrl({ type, raw: url });
  }
  return url;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function injectBlockStyle(
  block: string,
  style: string,
  prefix?: string,
): string {
  const tagMatch = block.match(/^<(\w+)((?:\s[^>]*)?)>/);
  if (!tagMatch) {
    return `<p style="${style}">${prefix ?? ""}${block}</p>`;
  }

  let result: string;
  const attrs = tagMatch[2];

  if (attrs.includes('style="')) {
    result = block.replace(
      /^(<\w+(?:\s[^>]*?)?)style="([^"]*)"/,
      (_, before, existing) => {
        const base = existing.replace(/;?\s*$/, "");
        return `${before}style="${base}; ${style}"`;
      },
    );
  } else {
    result = block.replace(/^(<\w+)/, `$1 style="${style}"`);
  }

  if (prefix) {
    result = result.replace(/^(<[^>]+>)/, `$1${prefix}`);
  }

  return result;
}
