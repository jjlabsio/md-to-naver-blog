/// <reference lib="webworker" />

import {
  convert,
  injectBlockStyle,
  type ComponentRenderer,
  type RenderCache,
} from "@jjlabsio/md-to-naver-blog";

const cache: RenderCache = new Map();

const CALLOUT_COLORS: Record<string, { bg: string; border: string }> = {
  info: { bg: "#e3f2fd", border: "#1976d2" },
  warning: { bg: "#fff3e0", border: "#f57c00" },
  tip: { bg: "#e8f5e9", border: "#388e3c" },
  danger: { bg: "#fce4ec", border: "#d32f2f" },
};

const CALLOUT_ICONS: Record<string, string> = {
  info: "ℹ️",
  warning: "⚠️",
  tip: "💡",
  danger: "🚨",
};

const BLANK_BLOCK = "<p>&nbsp;</p>";

const Callout: ComponentRenderer = (props, children, ctx) => {
  const type = String(props.type || "info");
  const { bg, border } = CALLOUT_COLORS[type] ?? CALLOUT_COLORS.info;
  const icon = CALLOUT_ICONS[type] ?? "";
  const iconHtml = `<span style="font-size: 1.1em;">${icon}</span> `;
  const textStyle = `border-left: 4px solid ${border}; background: ${bg}; padding: 8px 20px`;
  const blockStyle = `border-left: 4px solid ${border}; padding-left: 20px`;

  const blocks = ctx?.childBlocks;
  if (!blocks || blocks.length === 0) {
    return `<p style="${textStyle}">${iconHtml}${children}</p>`;
  }

  const contentBlocks = blocks.filter((b) => b !== BLANK_BLOCK);
  if (contentBlocks.length === 0) {
    return `<p style="${textStyle}">${iconHtml}</p>`;
  }

  return contentBlocks
    .map((block, i) => {
      const isParagraph = block.startsWith("<p");
      const style = isParagraph ? textStyle : blockStyle;
      if (i === 0 && isParagraph) {
        return injectBlockStyle(block, style, iconHtml);
      }
      if (i === 0) {
        return (
          `<p style="${textStyle}">${iconHtml}</p>\n` +
          injectBlockStyle(block, style)
        );
      }
      return injectBlockStyle(block, style);
    })
    .join("\n");
};

const Step: ComponentRenderer = (props, children, ctx) => {
  const number = props.number ?? "";
  const title = props.title ?? "";
  const headerHtml = `<p style="border-left: 4px solid #1976d2; padding: 12px 20px; background: #e3f2fd;"><span style="display: inline-block; width: 24px; height: 24px; border-radius: 50%; background: #1976d2; color: #fff; font-weight: bold; font-size: 12px; text-align: center; line-height: 24px;">${number}</span> <strong>${title}</strong></p>`;
  const stepStyle = `border-left: 4px solid #1976d2; padding: 4px 20px`;

  const blocks = ctx?.childBlocks;
  if (!blocks || blocks.length === 0) {
    return headerHtml;
  }

  const contentBlocks = blocks.filter((b) => b !== BLANK_BLOCK);
  const styledChildren = contentBlocks.map((block) =>
    injectBlockStyle(block, stepStyle),
  );

  return [headerHtml, ...styledChildren].join("\n");
};

const Badge: ComponentRenderer = (props, children) => {
  const colorMap: Record<string, { bg: string; text: string }> = {
    green: { bg: "#e8f5e9", text: "#2e7d32" },
    blue: { bg: "#e3f2fd", text: "#1565c0" },
    red: { bg: "#fce4ec", text: "#c62828" },
    gray: { bg: "#f5f5f5", text: "#616161" },
  };
  const color = String(props.color || "gray");
  const { bg, text } = colorMap[color] ?? colorMap.gray;
  return `<span style="display: inline-block; background: ${bg}; color: ${text}; padding: 2px 10px; border-radius: 12px; font-size: 0.85em; font-weight: 600;">${children}</span>`;
};

const Divider: ComponentRenderer = (props) => {
  const style = props.style === "dashed" ? "dashed" : "solid";
  return `<hr style="border: 0; border-top: 2px ${style} #ccc; margin: 24px 0;">`;
};

const components: Record<string, ComponentRenderer> = {
  Callout,
  Step,
  Badge,
  Divider,
};

type Request = { reqId: number; markdown: string };

self.onmessage = (event: MessageEvent<Request>) => {
  const { reqId, markdown } = event.data;
  const result = convert(markdown, { components }, cache);
  self.postMessage({ reqId, result });
};

export {};
