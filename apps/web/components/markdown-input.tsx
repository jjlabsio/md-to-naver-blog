"use client";

interface MarkdownInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarkdownInput({ value, onChange }: MarkdownInputProps) {
  return (
    <textarea
      className="h-full w-full resize-none rounded-md border border-input bg-background p-4 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      placeholder="마크다운을 입력하세요..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
