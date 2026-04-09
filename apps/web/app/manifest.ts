import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MTNB - 네이버 블로그 마크다운 변환기",
    short_name: "MTNB",
    description:
      "마크다운을 네이버 블로그에 바로 붙여넣을 수 있는 HTML로 변환합니다.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
  };
}
