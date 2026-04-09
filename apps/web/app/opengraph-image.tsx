import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "MTNB - 네이버 블로그 마크다운 변환기";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const iconData = await readFile(join(process.cwd(), "public", "logo.png"));
  const iconBase64 = `data:image/png;base64,${iconData.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#18181b",
        gap: "24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <img src={iconBase64} width={64} height={64} />
        <span
          style={{
            fontSize: "48px",
            fontWeight: 700,
            color: "#fafafa",
          }}
        >
          MTNB
        </span>
      </div>
      <span
        style={{
          fontSize: "32px",
          color: "#a1a1aa",
        }}
      >
        네이버 블로그 마크다운 변환기
      </span>
    </div>,
    { ...size },
  );
}
