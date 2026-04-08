# QA 검증: mono-setup

## 판정: PASS

## 검증 결과

| #   | 항목   | 결과 | 명령어                 | 출력 (요약)                                                                                    |
| --- | ------ | ---- | ---------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | 빌드   | PASS | `pnpm turbo build`     | core(tsup ESM+CJS+DTS) 및 web(next build, 4 static pages) 모두 성공. 종료 코드 0               |
| 2   | 린트   | PASS | `pnpm turbo lint`      | md-to-naver-blog, web 2개 패키지 lint 통과. 종료 코드 0 (web: NODE_TYPELESS 경고만, 에러 없음) |
| 3   | 타입   | PASS | `pnpm turbo typecheck` | md-to-naver-blog(tsc --noEmit), web(tsc --noEmit) 모두 통과. 종료 코드 0                       |
| 4   | 테스트 | PASS | `pnpm turbo test`      | tests/convert.test.ts 1 passed (1). 종료 코드 0                                                |
| 5   | E2E    | PASS | 아래 시나리오 참조     | V-2, V-2b, V-2c, V-3, V-5 모두 통과                                                            |

## E2E 시나리오 상세

| #    | 시나리오 (plan.md 참조)                                                                                        | 결과 | 증거                                                                                 |
| ---- | -------------------------------------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------ |
| V-2  | core 빌드 출력 확인 — `ls packages/core/dist/`                                                                 | PASS | `index.js`, `index.cjs`, `index.d.ts`, `index.d.cts` 모두 존재                       |
| V-2b | ESM export 확인 — `node -e "import('./packages/core/dist/index.js').then(m => console.log(typeof m.convert))"` | PASS | 출력: `function`                                                                     |
| V-2c | CJS export 확인 — `node -e "console.log(typeof require('./packages/core/dist/index.cjs').convert)"`            | PASS | 출력: `function`                                                                     |
| V-3  | workspace 의존성 확인 — `apps/web/package.json`의 `"md-to-naver-blog": "workspace:*"` + 심링크                 | PASS | `apps/web/node_modules/md-to-naver-blog` → `../../../packages/core` 심링크 생성 확인 |
| V-5  | Changesets config 확인 — `.changeset/config.json`                                                              | PASS | `"access": "public"`, `"baseBranch": "main"` 확인                                    |
