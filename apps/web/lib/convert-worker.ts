/// <reference lib="webworker" />

import {
  convert,
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

const Callout: ComponentRenderer = (props, children) => {
  const type = String(props.type || "info");
  const { bg, border } = CALLOUT_COLORS[type] ?? CALLOUT_COLORS.info;
  const icon = CALLOUT_ICONS[type] ?? "";
  return `<div style="background: ${bg}; border-left: 4px solid ${border}; padding: 16px 20px; margin: 12px 0; border-radius: 4px;"><span style="font-size: 1.1em;">${icon}</span> ${children}</div>`;
};

const Step: ComponentRenderer = (props, children) => {
  const number = props.number ?? "";
  const title = props.title ?? "";
  return `<div style="margin: 20px 0; padding: 16px 20px; border: 1px solid #e0e0e0; border-radius: 8px;"><div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;"><span style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: #1976d2; color: #fff; font-weight: bold; font-size: 14px; flex-shrink: 0;">${number}</span><span style="font-size: 1.1em; font-weight: bold;">${title}</span></div>${children}</div>`;
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
