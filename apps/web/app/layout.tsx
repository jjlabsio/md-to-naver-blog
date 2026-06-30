import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { env } from "@/lib/env";
import "./globals.css";

const SITE_URL = "https://mtnb.dev";
const TITLE = "MTNB - 네이버 블로그 마크다운 변환기";
const DESCRIPTION =
  "네이버 블로그 자동화를 위한 오픈소스 마크다운 변환기입니다. 마크다운 글을 네이버 블로그에 붙여넣을 수 있는 HTML로 변환하고, 서식 복사와 CLI, 라이브러리를 지원합니다.";

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
    siteName: "MTNB",
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
  other: {
    "naver-site-verification": env.NAVER_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
