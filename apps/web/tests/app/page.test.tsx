import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

vi.mock("next/image", () => ({
  default: ({
    alt,
    className,
    height,
    src,
    width,
  }: {
    alt: string;
    className?: string;
    height: number;
    src: string;
    width: number;
  }) => (
    <img
      alt={alt}
      className={className}
      height={height}
      src={src}
      width={width}
    />
  ),
}));

vi.mock("@/components/converter", () => ({
  Converter: () => <div data-testid="converter" />,
}));

describe("Home page", () => {
  it("renders the MTNB header without supporting copy", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "MTNB" })).toBeInTheDocument();
    expect(
      screen.queryByText(
        "마크다운을 네이버 블로그에 바로 붙여넣을 수 있는 HTML로 변환합니다",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders a larger GitHub icon", () => {
    render(<Home />);
    const githubLink = screen.getByRole("link", { name: "GitHub" });
    expect(githubLink.querySelector("svg")).toHaveClass("!h-6", "!w-6");
  });
});
