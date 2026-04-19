import { render, screen, fireEvent, act } from "@testing-library/react";
import { convert } from "@jjlabsio/md-to-naver-blog";
import { Converter } from "@/components/converter";

vi.mock("@/hooks/use-converter", () => ({
  useConverter: (markdown: string) => {
    if (markdown.trim() === "") {
      return { title: "", blocks: [], html: "" };
    }
    const result = convert(markdown);
    return {
      title: result.title,
      blocks: result.blocks,
      html: result.html,
    };
  },
}));

describe("Converter", () => {
  it("renders textarea and preview area", () => {
    render(<Converter />);
    const textareas = screen.getAllByPlaceholderText(/마크다운을 입력/);
    expect(textareas.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId("html-preview").length).toBeGreaterThanOrEqual(
      1,
    );
  });

  it("converts markdown to HTML on input", () => {
    render(<Converter />);
    const textareas = screen.getAllByPlaceholderText(/마크다운을 입력/);

    act(() => {
      fireEvent.change(textareas[0], { target: { value: "# Hello" } });
    });

    const previews = screen.getAllByTestId("html-preview");
    const hasContent = previews.some((p) => p.innerHTML.includes("Hello"));
    expect(hasContent).toBe(true);
  });

  it("shows default example in preview on initial render", () => {
    render(<Converter />);
    const previews = screen.getAllByTestId("html-preview");
    const hasContent = previews.some((p) => p.innerHTML.includes("마크다운"));
    expect(hasContent).toBe(true);
  });

  it("shows empty preview when input is cleared", () => {
    render(<Converter />);
    const textareas = screen.getAllByPlaceholderText(/마크다운을 입력/);

    act(() => {
      fireEvent.change(textareas[0], { target: { value: "" } });
    });

    const previews = screen.getAllByTestId("html-preview");
    previews.forEach((preview) => {
      expect(preview.innerHTML).toBe("");
    });
  });
});
