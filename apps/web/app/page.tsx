import { Converter } from "@/components/converter";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="mx-auto flex h-screen max-w-7xl flex-col overflow-hidden p-4">
      <header className="flex items-center justify-between pb-4">
        <h1 className="text-lg font-semibold">md-to-naver-blog</h1>
        <ThemeToggle />
      </header>
      <Converter />
    </main>
  );
}
