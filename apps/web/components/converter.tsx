"use client";

import { useState, useEffect } from "react";
import { convert } from "@jjlabsio/md-to-naver-blog";
import { useDebounce } from "@/hooks/use-debounce";
import { Eraser } from "lucide-react";
import { MarkdownInput } from "@/components/markdown-input";
import { HtmlPreview } from "@/components/html-preview";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { DEFAULT_MARKDOWN } from "@/constants/default-markdown";

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} aria-label="지우기">
      <Eraser className="h-4 w-4" />
      지우기
    </Button>
  );
}

export function Converter() {
  const [markdownInput, setMarkdownInput] = useState(DEFAULT_MARKDOWN);
  const debouncedInput = useDebounce(markdownInput, 300);
  const [html, setHtml] = useState("");

  useEffect(() => {
    if (debouncedInput.trim() === "") {
      setHtml("");
      return;
    }
    const result = convert(debouncedInput);
    setHtml(result.html);
  }, [debouncedInput]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden lg:grid lg:grid-cols-2 lg:grid-rows-1">
      <div className="flex min-h-0 flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            마크다운 입력
          </span>
          <ClearButton onClick={() => setMarkdownInput("")} />
        </div>
        <MarkdownInput value={markdownInput} onChange={setMarkdownInput} />
      </div>
      <div className="flex min-h-0 flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            변환 결과
          </span>
          <CopyButton html={html} />
        </div>
        <HtmlPreview html={html} />
      </div>
    </div>
  );
}
