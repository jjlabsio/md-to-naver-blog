import { describe, expect, it } from "vitest";
import { convert } from "../src/index.js";

describe("literal attribute evaluation", () => {
  it("number/boolean/string/null/shorthand literal을 props로 전달한다", () => {
    let receivedProps: Record<string, unknown> | undefined;

    const result = convert('<Foo n={5} b={true} s="x" nul={null} bool />', {
      components: {
        Foo: (props) => {
          receivedProps = props;
          return "<div>ok</div>";
        },
      },
    });

    expect(receivedProps).toEqual({
      n: 5,
      b: true,
      s: "x",
      nul: null,
      bool: true,
    });
    expect(result.errors).toEqual([]);
  });

  it("non-literal expression 속성은 건너뛰고 info 에러를 기록한다", () => {
    let receivedProps: Record<string, unknown> | undefined;

    const result = convert('<Foo x={foo()} y="ok" />', {
      components: {
        Foo: (props) => {
          receivedProps = props;
          return "<div>ok</div>";
        },
      },
    });

    expect(receivedProps).toEqual({ y: "ok" });
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: "MDX_NON_LITERAL_ATTR",
        severity: "info",
      }),
    );
  });

  it("spread 속성은 MDX_SPREAD_ATTR info 에러를 기록한다", () => {
    const result = convert("<Foo {...rest} />", {
      components: {
        Foo: () => "<div>ok</div>",
      },
    });

    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: "MDX_SPREAD_ATTR",
        severity: "info",
      }),
    );
  });
});
