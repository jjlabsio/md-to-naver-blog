import { render, screen, fireEvent } from "@testing-library/react";
import type { ParseError } from "@jjlabsio/md-to-naver-blog";
import { ErrorBanner } from "@/components/error-banner";

describe("ErrorBanner", () => {
  it("errors 빈 배열 → 배너 DOM 없음", () => {
    const { container } = render(<ErrorBanner errors={[]} />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(container.innerHTML).toBe("");
  });

  it("errors 2건 → '문서에 오류 2개' 텍스트 + 토글 버튼 렌더", () => {
    const errors: ParseError[] = [
      {
        code: "MDX_PARSE_ERROR",
        message: "닫히지 않은 태그 <Callout>",
        severity: "error",
        position: { line: 1, column: 1 },
      },
      {
        code: "MDX_RUNTIME_EXPR",
        message: "런타임 표현식은 지원되지 않습니다",
        severity: "info",
        position: { line: 5, column: 1 },
      },
    ];
    render(<ErrorBanner errors={errors} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/문서에 오류 2개/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /펼치기|접기/i }),
    ).toBeInTheDocument();
  });

  it("토글 클릭 → 에러 행 리스트 '{line}행: {message}' 노출", () => {
    const errors: ParseError[] = [
      {
        code: "MDX_PARSE_ERROR",
        message: "닫히지 않은 태그 <Callout>",
        severity: "error",
        position: { line: 1, column: 1 },
      },
      {
        code: "MDX_RUNTIME_EXPR",
        message: "런타임 표현식은 지원되지 않습니다",
        severity: "info",
        position: { line: 5, column: 1 },
      },
    ];
    render(<ErrorBanner errors={errors} />);

    // 기본 접힘 → 에러 행 미노출
    expect(screen.queryByText(/1행:/)).not.toBeInTheDocument();

    // 토글 클릭
    fireEvent.click(screen.getByRole("button", { name: /펼치기|접기/i }));

    // 에러 행 노출
    expect(screen.getByText(/1행: 닫히지 않은 태그 <Callout>/)).toBeInTheDocument();
    expect(
      screen.getByText(/5행: 런타임 표현식은 지원되지 않습니다/),
    ).toBeInTheDocument();
  });

  it("errors가 빈 배열로 변화 → 배너 언마운트", () => {
    const errors: ParseError[] = [
      {
        code: "MDX_PARSE_ERROR",
        message: "닫히지 않은 태그 <Callout>",
        severity: "error",
        position: { line: 1, column: 1 },
      },
    ];
    const { rerender } = render(<ErrorBanner errors={errors} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // errors를 빈 배열로 변경
    rerender(<ErrorBanner errors={[]} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
