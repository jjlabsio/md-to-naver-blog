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
