import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CopyButton } from "@/components/copy-button";
import * as clipboard from "@/lib/clipboard";

vi.mock("@/lib/clipboard");

function mockClipboard(clipboard: unknown) {
  Object.defineProperty(navigator, "clipboard", {
    value: clipboard,
    writable: true,
    configurable: true,
  });
}

describe("CopyButton", () => {
  beforeEach(() => {
    mockClipboard({ write: vi.fn() });
  });

  afterEach(() => {
    mockClipboard(undefined);
  });

  it("renders with '서식 복사' text", () => {
    render(<CopyButton html="<h1>Hello</h1>" />);
    expect(screen.getByRole("button", { name: /서식 복사/ })).toBeInTheDocument();
  });

  it("calls copyHtmlToClipboard on click and shows success state", async () => {
    vi.mocked(clipboard.copyHtmlToClipboard).mockResolvedValue(true);

    render(<CopyButton html="<h1>Hello</h1>" />);
    fireEvent.click(screen.getByRole("button", { name: /서식 복사/ }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /복사됨/ })).toBeInTheDocument();
    });
    expect(clipboard.copyHtmlToClipboard).toHaveBeenCalledWith("<h1>Hello</h1>");
  });

  it("shows error message on copy failure", async () => {
    vi.mocked(clipboard.copyHtmlToClipboard).mockResolvedValue(false);

    render(<CopyButton html="<h1>Hello</h1>" />);
    fireEvent.click(screen.getByRole("button", { name: /서식 복사/ }));

    await waitFor(() => {
      expect(screen.getByText(/복사에 실패/)).toBeInTheDocument();
    });
  });

  it("disables button when html is empty", () => {
    render(<CopyButton html="" />);
    expect(screen.getByRole("button", { name: /서식 복사/ })).toBeDisabled();
  });
});
