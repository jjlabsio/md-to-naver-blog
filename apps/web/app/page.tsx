import { convert } from "md-to-naver-blog";

export default function Home() {
  const result = convert("# Hello");

  return (
    <main>
      <h1>{result.title}</h1>
    </main>
  );
}
