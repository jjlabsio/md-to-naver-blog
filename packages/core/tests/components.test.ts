import { describe, it, expect } from "vitest";
import { convert } from "../src/index.js";

describe("components option", () => {
  it("self-closing 컴포넌트를 변환한다", () => {
    const md = `# Test\n\n<YouTube id="abc123" />`;
    const result = convert(md, {
      components: {
        YouTube: (props) =>
          `<div><a href="https://youtube.com/watch?v=${props.id}">[YouTube]</a></div>`,
      },
    });
    expect(result.html).toContain("https://youtube.com/watch?v=abc123");
    expect(result.html).toContain("[YouTube]");
  });

  it("children이 있는 컴포넌트를 변환한다", () => {
    const md = `# Test\n\n<Callout type="warning">\n경고 내용입니다.\n</Callout>`;
    const result = convert(md, {
      components: {
        Callout: (props, children) =>
          `<div style="background: yellow;">[${props.type}] ${children}</div>`,
      },
    });
    expect(result.html).toContain("background: yellow");
    expect(result.html).toContain("[warning]");
    expect(result.html).toContain("경고 내용입니다.");
  });

  it("children 안의 인라인 마크다운을 처리한다", () => {
    const md = `# Test\n\n<Callout>\n**굵은 텍스트**와 *기울임*\n</Callout>`;
    const result = convert(md, {
      components: {
        Callout: (_props, children) => `<div class="callout">${children}</div>`,
      },
    });
    expect(result.html).toContain(
      '<strong style="font-weight: bold;">굵은 텍스트</strong>',
    );
    expect(result.html).toContain(
      '<em style="font-style: italic;">기울임</em>',
    );
  });

  it("미등록 컴포넌트는 children을 그대로 출력한다", () => {
    const md = `# Test\n\n<Unknown>\n텍스트 내용\n</Unknown>`;
    const result = convert(md);
    expect(result.html).toContain("텍스트 내용");
    expect(result.html).not.toContain("Unknown");
  });

  it("미등록 self-closing 컴포넌트는 무시한다", () => {
    const md = `# Test\n\n<Widget foo="bar" />`;
    const result = convert(md);
    expect(result.html).not.toContain("Widget");
    expect(result.html).not.toContain("foo");
  });

  it("props 없는 컴포넌트를 처리한다", () => {
    const md = `# Test\n\n<Divider />`;
    const result = convert(md, {
      components: {
        Divider: () => '<hr style="border: 2px solid red;">',
      },
    });
    expect(result.html).toContain("border: 2px solid red");
  });

  it("여러 줄 children을 처리한다", () => {
    const md = `# Test\n\n<Note>\n첫 번째 줄\n두 번째 줄\n세 번째 줄\n</Note>`;
    const result = convert(md, {
      components: {
        Note: (_props, children) => `<div class="note">${children}</div>`,
      },
    });
    expect(result.html).toContain("첫 번째 줄");
    expect(result.html).toContain("두 번째 줄");
    expect(result.html).toContain("세 번째 줄");
  });

  it("컴포넌트와 일반 마크다운이 섞여 있어도 동작한다", () => {
    const md = `# Test\n\n일반 문단\n\n<Callout>\n중요 내용\n</Callout>\n\n또 다른 문단`;
    const result = convert(md, {
      components: {
        Callout: (_props, children) => `<div class="callout">${children}</div>`,
      },
    });
    expect(result.html).toContain("<p>일반 문단</p>");
    expect(result.html).toContain('<div class="callout">');
    expect(result.html).toContain("<p>또 다른 문단</p>");
  });

  it("options 없이 호출해도 기존처럼 동작한다", () => {
    const md = `# Hello\n\nWorld`;
    const result = convert(md);
    expect(result.title).toBe("Hello");
    expect(result.html).toContain("World");
  });
});
