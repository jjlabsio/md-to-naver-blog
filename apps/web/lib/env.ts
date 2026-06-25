import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

export const env = createEnv({
  server: {
    NAVER_SITE_VERIFICATION: z.string().trim().min(1),
  },
  runtimeEnv: {
    NAVER_SITE_VERIFICATION: process.env.NAVER_SITE_VERIFICATION,
  },
});
