"use client";

import { useState, useEffect } from "react";
import { convert } from "md-to-naver-blog";
import { useDebounce } from "@/hooks/use-debounce";
import { MarkdownInput } from "@/components/markdown-input";
import { HtmlPreview } from "@/components/html-preview";
import { CopyButton } from "@/components/copy-button";

export function Converter() {
  const [markdownInput, setMarkdownInput] = useState("");
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
    <div className="flex h-full flex-1 flex-col gap-4">
      <div className="flex items-center justify-end">
        <CopyButton html={html} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:grid lg:grid-cols-2">
        <MarkdownInput value={markdownInput} onChange={setMarkdownInput} />
        <HtmlPreview html={html} />
      </div>
    </div>
  );
}
