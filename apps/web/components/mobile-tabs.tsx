"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownInput } from "@/components/markdown-input";
import { HtmlPreview } from "@/components/html-preview";

interface MobileTabsProps {
  markdownInput: string;
  onMarkdownChange: (value: string) => void;
  html: string;
}

export function MobileTabs({
  markdownInput,
  onMarkdownChange,
  html,
}: MobileTabsProps) {
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
        <MarkdownInput value={markdownInput} onChange={onMarkdownChange} />
      </TabsContent>
      <TabsContent value="preview" className="flex-1">
        <HtmlPreview html={html} />
      </TabsContent>
    </Tabs>
  );
}
