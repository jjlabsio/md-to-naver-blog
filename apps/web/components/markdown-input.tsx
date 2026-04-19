"use client";

import { forwardRef, memo } from "react";

interface MarkdownInputProps {
  defaultValue: string;
  onValue: (value: string) => void;
}

export const MarkdownInput = memo(
  forwardRef<HTMLTextAreaElement, MarkdownInputProps>(function MarkdownInput(
    { defaultValue, onValue },
    ref,
  ) {
    return (
      <textarea
        ref={ref}
        className="h-[45vh] w-full resize-none rounded-md border border-input bg-background p-4 font-mono text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring lg:h-full"
        placeholder="마크다운을 입력하세요..."
        defaultValue={defaultValue}
        onChange={(e) => onValue(e.target.value)}
      />
    );
  }),
);
