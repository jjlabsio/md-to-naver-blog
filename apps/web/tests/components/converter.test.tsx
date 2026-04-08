import { render, screen, fireEvent, act } from "@testing-library/react";
import { Converter } from "@/components/converter";

describe("Converter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders textarea and preview area", () => {
    render(<Converter />);
    const textareas = screen.getAllByPlaceholderText(/마크다운을 입력/);
    expect(textareas.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId("html-preview").length).toBeGreaterThanOrEqual(
      1,
    );
  });

  it("converts markdown to HTML after debounce", async () => {
    render(<Converter />);
    const textareas = screen.getAllByPlaceholderText(/마크다운을 입력/);

    fireEvent.change(textareas[0], { target: { value: "# Hello" } });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    const previews = screen.getAllByTestId("html-preview");
    const hasContent = previews.some((p) => p.innerHTML.includes("Hello"));
    expect(hasContent).toBe(true);
  });

  it("shows empty preview when input is empty", () => {
    render(<Converter />);
    const previews = screen.getAllByTestId("html-preview");
    previews.forEach((preview) => {
      expect(preview.innerHTML).toBe("");
    });
  });

  it("does not convert before debounce completes", () => {
    render(<Converter />);
    const textareas = screen.getAllByPlaceholderText(/마크다운을 입력/);

    fireEvent.change(textareas[0], { target: { value: "# Hello" } });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    const previews = screen.getAllByTestId("html-preview");
    previews.forEach((preview) => {
      expect(preview.innerHTML).toBe("");
    });
  });
});
