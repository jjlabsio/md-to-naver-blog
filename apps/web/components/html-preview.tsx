"use client";

import { memo } from "react";
import type { RenderedBlock } from "@jjlabsio/md-to-naver-blog";

interface HtmlPreviewProps {
  blocks: RenderedBlock[];
}

export const HtmlPreview = memo(function HtmlPreview({
  blocks,
}: HtmlPreviewProps) {
  return (
    <div
      data-testid="html-preview"
      className="preview-content h-[45vh] overflow-auto rounded-md border border-input bg-background p-4 lg:h-full"
    >
      {blocks.map((block) => (
        <BlockView key={block.id} html={block.html} />
      ))}
    </div>
  );
});

const BlockView = memo(function BlockView({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
});
