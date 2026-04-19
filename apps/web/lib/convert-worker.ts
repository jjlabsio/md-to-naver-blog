/// <reference lib="webworker" />

import { convert, type RenderCache } from "@jjlabsio/md-to-naver-blog";

const cache: RenderCache = new Map();

type Request = { reqId: number; markdown: string };

self.onmessage = (event: MessageEvent<Request>) => {
  const { reqId, markdown } = event.data;
  const result = convert(markdown, undefined, cache);
  self.postMessage({ reqId, result });
};

export {};
