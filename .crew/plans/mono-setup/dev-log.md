# 구현 로그: mono-setup

## 구현 요약

- US-1: 루트 모노레포 인프라 설정 — pnpm workspace, turbo.json, tsconfig.json, eslint flat config, prettier, husky + lint-staged, .gitignore, changesets 초기화 완료
- US-2: packages/core 라이브러리 패키지 — tsup 듀얼 빌드(ESM+CJS), vitest 테스트, convert 스텁 함수 구현
- US-3: apps/web Next.js 스캐폴딩 — 수동 최소 스캐폴딩, workspace:\* 의존성으로 core 참조, import resolve 확인
- US-4: CI/CD 파이프라인 — ci.yml (PR: lint/typecheck/test/build), release.yml (changesets/action + OIDC provenance)

## 자체 검증 결과

- 빌드: PASS + `pnpm turbo build` + core dist/ 생성 후 web .next/ 생성, 종료 코드 0
- 린트: PASS + `pnpm turbo lint` + 2 packages 성공, 종료 코드 0
- 타입: PASS + `pnpm turbo typecheck` + core/web 모두 통과, 종료 코드 0
- 테스트: PASS + `pnpm turbo test` + 1 passed (1/1)

## 변경 파일 목록

- `package.json` — 루트 모노레포 설정 (private, scripts, devDependencies, lint-staged)
- `pnpm-workspace.yaml` — workspace 패키지 경로 등록
- `turbo.json` — 태스크 정의 (build, lint, typecheck, test, dev)
- `tsconfig.json` — 루트 공유 TypeScript 설정 (strict mode)
- `.gitignore` — node_modules, dist, .next, .turbo, .env\* 제외
- `eslint.config.js` — 루트 ESLint flat config (typescript-eslint)
- `.prettierrc` — Prettier 설정
- `.husky/pre-commit` — lint-staged 실행 훅
- `.changeset/config.json` — access: public, baseBranch: main
- `packages/core/package.json` — md-to-naver-blog 라이브러리 설정 (type: module, exports, tsup/vitest)
- `packages/core/tsconfig.json` — 루트 extends, outDir: dist
- `packages/core/tsup.config.ts` — ESM+CJS 듀얼 빌드, dts, platform: neutral
- `packages/core/vitest.config.ts` — globals true, tests/\*_/_.test.ts
- `packages/core/eslint.config.js` — flat config
- `packages/core/src/index.ts` — convert 스텁 함수 (title 추출, html 빈 문자열)
- `packages/core/tests/convert.test.ts` — convert 함수 반환값 검증 테스트
- `apps/web/package.json` — Next.js 앱, md-to-naver-blog workspace:\* 의존성
- `apps/web/next.config.ts` — transpilePackages 설정
- `apps/web/tsconfig.json` — Next.js TypeScript 설정
- `apps/web/eslint.config.js` — flat config (next-env.d.ts 제외)
- `apps/web/app/layout.tsx` — 루트 레이아웃
- `apps/web/app/page.tsx` — convert import 및 사용
- `.github/workflows/ci.yml` — PR CI 워크플로우 (lint/typecheck/test/build)
- `.github/workflows/release.yml` — Release 워크플로우 (changesets + OIDC provenance)
