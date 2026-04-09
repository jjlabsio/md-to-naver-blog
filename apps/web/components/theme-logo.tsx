"use client";

import Image from "next/image";
import { useTheme } from "next-themes";

export function ThemeLogo() {
  const { resolvedTheme } = useTheme();

  return (
    <Image
      src={resolvedTheme === "dark" ? "/icon_white.png" : "/logo.png"}
      alt="MTNB"
      width={24}
      height={24}
      className="rounded"
    />
  );
}
