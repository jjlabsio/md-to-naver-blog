import { describe, expect, it } from "vitest";
import { convert, type ComponentRenderCtx } from "../src/index.js";

describe("ComponentRenderer ctx", () => {
  it("루트 레벨 컴포넌트에 depth 0 / index 0 / parent undefined를 전달한다", () => {
    let receivedCtx: ComponentRenderCtx | undefined;

    convert("<A />", {
      components: {
        A: (_props, _children, ctx) => {
          receivedCtx = ctx;
          return "<div>A</div>";
        },
      },
    });

    expect(receivedCtx).toMatchObject({
      depth: 0,
      index: 0,
    });
    expect(receivedCtx?.parent).toBeUndefined();
  });

  it("중첩된 등록 컴포넌트는 같은 부모 안에서 index를 증가시킨다", () => {
    const receivedCtxs: ComponentRenderCtx[] = [];

    convert("<A><B/><B/></A>", {
      components: {
        A: (_props, children) => `<section>${children}</section>`,
        B: (_props, _children, ctx) => {
          if (ctx) {
            receivedCtxs.push(ctx);
          }
          return "<div>B</div>";
        },
      },
    });

    expect(receivedCtxs[1]).toMatchObject({
      depth: 1,
      index: 1,
      parent: "A",
    });
  });

  it("markdown 블록은 sibling index 계산에서 제외한다", () => {
    let receivedCtx: ComponentRenderCtx | undefined;

    convert("<A>\n\nmarkdown\n\n<B />\n</A>", {
      components: {
        A: (_props, children) => `<section>${children}</section>`,
        B: (_props, _children, ctx) => {
          receivedCtx = ctx;
          return "<div>B</div>";
        },
      },
    });

    expect(receivedCtx).toMatchObject({
      depth: 1,
      index: 0,
      parent: "A",
    });
  });

  it("미등록 형제 컴포넌트는 sibling index 계산에서 제외한다", () => {
    let receivedCtx: ComponentRenderCtx | undefined;

    convert("<A><Unknown /><B /></A>", {
      components: {
        A: (_props, children) => `<section>${children}</section>`,
        B: (_props, _children, ctx) => {
          receivedCtx = ctx;
          return "<div>B</div>";
        },
      },
    });

    expect(receivedCtx).toMatchObject({
      depth: 1,
      index: 0,
      parent: "A",
    });
  });

  it("2-arg renderer를 등록해도 ctx 추가 호출에서 런타임 에러가 없다", () => {
    const result = convert("<A><B /></A>", {
      components: {
        A: (_props, children) => `<section>${children}</section>`,
        B: () => "<div>B</div>",
      },
    });

    expect(result.html).toContain("<section>");
    expect(result.html).toContain("<div>B</div>");
  });
});
