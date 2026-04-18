import { toNaverPasteHtml } from "@jjlabsio/md-to-naver-blog";

export async function copyHtmlToClipboard(html: string): Promise<boolean> {
  try {
    if (!navigator.clipboard) {
      return false;
    }
    const payload = toNaverPasteHtml(html, navigator.userAgent);
    const blob = new Blob([payload], { type: "text/html" });
    const item = new ClipboardItem({ "text/html": blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch {
    return false;
  }
}
