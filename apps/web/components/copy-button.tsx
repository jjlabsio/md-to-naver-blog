"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyHtmlToClipboard } from "@/lib/clipboard";

interface CopyButtonProps {
  html: string;
}

export function CopyButton({ html }: CopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  const handleCopy = async () => {
    const success = await copyHtmlToClipboard(html);
    if (success) {
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={!html}
        onClick={handleCopy}
        aria-label={status === "copied" ? "복사됨" : "서식 복사"}
      >
        {status === "copied" ? (
          <>
            <Check className="h-4 w-4" />
            복사됨
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            서식 복사
          </>
        )}
      </Button>
      {status === "error" && (
        <span className="text-sm text-destructive">복사에 실패했습니다</span>
      )}
    </div>
  );
}
