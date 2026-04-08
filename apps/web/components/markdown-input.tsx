"use client";

interface MarkdownInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarkdownInput({ value, onChange }: MarkdownInputProps) {
  return (
    <textarea
      className="h-[45vh] w-full resize-none rounded-md border border-input bg-background p-4 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring lg:h-full"
      placeholder="마크다운을 입력하세요..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
