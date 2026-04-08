import { copyHtmlToClipboard } from "@/lib/clipboard";

function mockClipboard(clipboard: unknown) {
  Object.defineProperty(navigator, "clipboard", {
    value: clipboard,
    writable: true,
    configurable: true,
  });
}

describe("copyHtmlToClipboard", () => {
  afterEach(() => {
    mockClipboard(undefined);
  });

  it("copies HTML to clipboard with text/html MIME type", async () => {
    const writeMock = vi.fn().mockResolvedValue(undefined);
    mockClipboard({ write: writeMock });

    const result = await copyHtmlToClipboard("<h1>Hello</h1>");

    expect(result).toBe(true);
    expect(writeMock).toHaveBeenCalledOnce();

    const clipboardItems = writeMock.mock.calls[0][0];
    expect(clipboardItems).toHaveLength(1);
    expect(clipboardItems[0]).toBeInstanceOf(ClipboardItem);
  });

  it("returns false when clipboard API fails", async () => {
    mockClipboard({
      write: vi.fn().mockRejectedValue(new Error("Permission denied")),
    });

    const result = await copyHtmlToClipboard("<h1>Hello</h1>");

    expect(result).toBe(false);
  });

  it("returns false when clipboard API is not available", async () => {
    mockClipboard(undefined);

    const result = await copyHtmlToClipboard("<h1>Hello</h1>");

    expect(result).toBe(false);
  });
});
