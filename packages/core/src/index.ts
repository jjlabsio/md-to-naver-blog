export function convert(markdown: string): { title: string; html: string } {
  const match = markdown.match(/^#\s+(.+)$/m);
  const title = match ? match[1].trim() : "";
  const html = "";

  return { title, html };
}
