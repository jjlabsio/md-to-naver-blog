"use client";

import { forwardRef } from "react";
import type { RenderedBlock } from "@jjlabsio/md-to-naver-blog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownInput } from "@/components/markdown-input";
import { HtmlPreview } from "@/components/html-preview";

interface MobileTabsProps {
  defaultMarkdown: string;
  onMarkdownChange: (value: string) => void;
  blocks: RenderedBlock[];
}

export const MobileTabs = forwardRef<HTMLTextAreaElement, MobileTabsProps>(
  function MobileTabs({ defaultMarkdown, onMarkdownChange, blocks }, ref) {
    return (
      <Tabs defaultValue="input" className="flex flex-1 flex-col">
        <TabsList className="w-full">
          <TabsTrigger value="input" className="flex-1">
            입력
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex-1">
            미리보기
          </TabsTrigger>
        </TabsList>
        <TabsContent value="input" className="flex-1">
          <MarkdownInput
            ref={ref}
            defaultValue={defaultMarkdown}
            onValue={onMarkdownChange}
          />
        </TabsContent>
        <TabsContent value="preview" className="flex-1">
          <HtmlPreview blocks={blocks} />
        </TabsContent>
      </Tabs>
    );
  },
);
