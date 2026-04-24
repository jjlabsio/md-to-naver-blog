"use client";

import { useState } from "react";
import type { ParseError } from "@jjlabsio/md-to-naver-blog";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

interface ErrorBannerProps {
  errors: ParseError[];
}

export function ErrorBanner({ errors }: ErrorBannerProps) {
  const [open, setOpen] = useState(false);

  if (errors.length === 0) {
    return null;
  }

  return (
    <div role="alert" className="rounded-md border border-amber-300 bg-amber-50 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          문서에 오류 {errors.length}개
        </span>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label={open ? "접기" : "펼치기"}
          className="rounded p-0.5 hover:bg-amber-200 dark:hover:bg-amber-800"
        >
          {open ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>
      {open && (
        <ul className="max-h-64 overflow-y-auto border-t border-amber-300 px-3 py-2 dark:border-amber-700">
          {errors.map((err, i) => (
            <li key={i} className="py-0.5">
              {err.position?.line != null ? `${err.position.line}행: ` : ""}
              {err.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
