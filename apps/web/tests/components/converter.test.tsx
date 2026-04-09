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

  it("shows default example in preview on initial render", () => {
    render(<Converter />);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    const previews = screen.getAllByTestId("html-preview");
    const hasContent = previews.some((p) => p.innerHTML.includes("마크다운"));
    expect(hasContent).toBe(true);
  });

  it("shows empty preview when input is cleared", () => {
    render(<Converter />);
    const textareas = screen.getAllByPlaceholderText(/마크다운을 입력/);

    fireEvent.change(textareas[0], { target: { value: "" } });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    const previews = screen.getAllByTestId("html-preview");
    previews.forEach((preview) => {
      expect(preview.innerHTML).toBe("");
    });
  });
});
