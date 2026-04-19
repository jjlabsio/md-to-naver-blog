"use client";

import { useEffect, useRef, useState } from "react";
import type { ConvertResult, RenderedBlock } from "@jjlabsio/md-to-naver-blog";

export interface ConverterState {
  title: string;
  blocks: RenderedBlock[];
  html: string;
}

const EMPTY_STATE: ConverterState = { title: "", blocks: [], html: "" };

function createWorker(): Worker {
  return new Worker(new URL("../lib/convert-worker.ts", import.meta.url), {
    type: "module",
  });
}

export function useConverter(markdown: string): ConverterState {
  const [state, setState] = useState<ConverterState>(EMPTY_STATE);
  const workerRef = useRef<Worker | null>(null);
  const reqIdRef = useRef(0);
  const latestReqIdRef = useRef(0);

  useEffect(() => {
    const worker = createWorker();
    workerRef.current = worker;

    worker.onmessage = (
      event: MessageEvent<{ reqId: number; result: ConvertResult }>,
    ) => {
      const { reqId, result } = event.data;
      if (reqId < latestReqIdRef.current) return;
      latestReqIdRef.current = reqId;
      setState({
        title: result.title,
        blocks: result.blocks,
        html: result.html,
      });
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (markdown.trim() === "") {
      setState(EMPTY_STATE);
      latestReqIdRef.current = reqIdRef.current;
      return;
    }
    const worker = workerRef.current;
    if (!worker) return;
    reqIdRef.current += 1;
    worker.postMessage({ reqId: reqIdRef.current, markdown });
  }, [markdown]);

  return state;
}
