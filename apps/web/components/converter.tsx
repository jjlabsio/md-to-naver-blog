"use client";

import {
  startTransition,
  useCallback,
  useDeferredValue,
  useRef,
  useState,
} from "react";
import { Eraser } from "lucide-react";
import { MarkdownInput } from "@/components/markdown-input";
import { HtmlPreview } from "@/components/html-preview";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { DEFAULT_MARKDOWN } from "@/constants/default-markdown";
import { useConverter } from "@/hooks/use-converter";

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} aria-label="지우기">
      <Eraser className="h-4 w-4" />
      지우기
    </Button>
  );
}

export function Converter() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const deferredMarkdown = useDeferredValue(markdown);
  const { blocks, html } = useConverter(deferredMarkdown);

  const handleValue = useCallback((value: string) => {
    startTransition(() => setMarkdown(value));
  }, []);

  const handleClear = useCallback(() => {
    if (textareaRef.current) textareaRef.current.value = "";
    startTransition(() => setMarkdown(""));
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden lg:grid lg:grid-cols-2 lg:grid-rows-1">
      <div className="flex min-h-0 flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            마크다운 입력
          </span>
          <ClearButton onClick={handleClear} />
        </div>
        <MarkdownInput
          ref={textareaRef}
          defaultValue={DEFAULT_MARKDOWN}
          onValue={handleValue}
        />
      </div>
      <div className="flex min-h-0 flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            변환 결과
          </span>
          <CopyButton html={html} />
        </div>
        <HtmlPreview blocks={blocks} />
      </div>
    </div>
  );
}
