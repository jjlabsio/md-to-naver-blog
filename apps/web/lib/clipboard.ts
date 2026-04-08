export async function copyHtmlToClipboard(html: string): Promise<boolean> {
  try {
    if (!navigator.clipboard) {
      return false;
    }
    const blob = new Blob([html], { type: "text/html" });
    const item = new ClipboardItem({ "text/html": blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch {
    return false;
  }
}
