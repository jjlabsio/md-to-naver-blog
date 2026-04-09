import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "md-to-naver-blog",
  description: "마크다운을 네이버 블로그에 붙여넣을 수 있는 HTML로 변환합니다",
  openGraph: {
    title: "md-to-naver-blog",
    description:
      "마크다운을 네이버 블로그에 붙여넣을 수 있는 HTML로 변환합니다",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          storageKey="md-to-naver-blog-theme"
        >
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
