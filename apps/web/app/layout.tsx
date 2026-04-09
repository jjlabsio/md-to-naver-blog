import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const SITE_URL = "https://mtnb.dev";
const TITLE = "네이버 블로그 마크다운 변환기 - mtnb.dev";
const DESCRIPTION =
  "마크다운을 네이버 블로그에 바로 붙여넣을 수 있는 HTML로 변환합니다. 코드 블록 하이라이팅 지원.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "mtnb.dev",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
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
