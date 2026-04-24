"use client";

import { useCallback, useDeferredValue, useRef, useState } from "react";
import { Eraser } from "lucide-react";
import { MarkdownInput } from "@/components/markdown-input";
import { HtmlPreview } from "@/components/html-preview";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_MARKDOWN,
  EXAMPLES,
  type ExampleKey,
} from "@/constants/default-markdown";
import { useConverter } from "@/hooks/use-converter";
import { ErrorBanner } from "@/components/error-banner";

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} aria-label="지우기">
      <Eraser className="h-4 w-4" />
      지우기
    </Button>
  );
}

function ExampleSelect({
  value,
  onChange,
}: {
  value: ExampleKey;
  onChange: (key: ExampleKey) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ExampleKey)}
      className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
      aria-label="예시 선택"
    >
      {EXAMPLES.map((ex) => (
        <option key={ex.value} value={ex.value}>
          {ex.label}
        </option>
      ))}
    </select>
  );
}

export function Converter() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [selectedExample, setSelectedExample] = useState<ExampleKey>("basic");
  const deferredMarkdown = useDeferredValue(markdown);
  const { blocks, html, errors } = useConverter(deferredMarkdown);

  const handleValue = useCallback((value: string) => {
    setMarkdown(value);
  }, []);

  const handleClear = useCallback(() => {
    if (textareaRef.current) textareaRef.current.value = "";
    setMarkdown("");
  }, []);

  const handleExampleChange = useCallback((key: ExampleKey) => {
    const example = EXAMPLES.find((ex) => ex.value === key);
    if (!example) return;
    setSelectedExample(key);
    setMarkdown(example.markdown);
    if (textareaRef.current) textareaRef.current.value = example.markdown;
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden lg:grid lg:grid-cols-2 lg:grid-rows-1">
      <div className="flex min-h-0 flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              마크다운 입력
            </span>
            <ExampleSelect
              value={selectedExample}
              onChange={handleExampleChange}
            />
          </div>
          <ClearButton onClick={handleClear} />
        </div>
        <ErrorBanner errors={errors} />
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
