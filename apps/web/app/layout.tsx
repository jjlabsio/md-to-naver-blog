export const metadata = {
  title: "md-to-naver-blog",
  description: "Markdown to Naver Blog converter",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
