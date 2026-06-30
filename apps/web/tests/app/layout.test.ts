vi.mock("@/lib/env", () => ({
  env: {
    NAVER_SITE_VERIFICATION: "test-verification",
  },
}));

import { metadata } from "@/app/layout";

const description =
  "네이버 블로그 자동화를 위한 오픈소스 마크다운 변환기입니다. 마크다운 글을 네이버 블로그에 붙여넣을 수 있는 HTML로 변환하고, 서식 복사와 CLI, 라이브러리를 지원합니다.";

describe("metadata", () => {
  it("uses the automation-first Naver Blog SEO description", () => {
    expect(metadata.description).toBe(description);
    expect(metadata.openGraph?.description).toBe(description);
    expect(metadata.twitter?.description).toBe(description);
  });
});
