"use client";

interface HtmlPreviewProps {
  html: string;
}

export function HtmlPreview({ html }: HtmlPreviewProps) {
  return (
    <div
      data-testid="html-preview"
      className="preview-content h-[45vh] overflow-auto rounded-md border border-input bg-background p-4 lg:h-full"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
