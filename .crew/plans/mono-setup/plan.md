# Plan: 모노레포 구조, 빌드, 테스트 환경 세팅

## US-1: 루트 모노레포 인프라 설정

> 개발자로서 pnpm workspace + Turborepo 기반 모노레포 구조에서 작업할 수 있어야 한다.

### 태스크

**T-1.1: 루트 설정 파일 생성** (~1h)

- `package.json` — `private: true`, `version` 필드 없음, scripts: `build`, `dev`, `lint`, `typecheck`, `test`, `format`, `prepare`
  - `packageManager`: `pnpm@9.15.1` (현재 설치된 버전)
  - devDependencies: `turbo`, `typescript`, `prettier`, `husky`, `lint-staged`, `eslint`
  - lint-staged: `*.{ts,tsx}` → `eslint --fix` + `prettier --write`, `*.{json,md}` → `prettier --write`
- `pnpm-workspace.yaml` — `apps/*`, `packages/*`
- `turbo.json` — `build` (dependsOn: `^build`, outputs: core `["dist/**"]`, web `[".next/**", "!.next/cache/**"]`), `lint`, `typecheck`, `test`, `dev` (cache: false, persistent: true)
- 루트 `tsconfig.json` — strict 모드, 공통 compilerOptions. packages/core와 apps/web이 extends
- 루트 `.gitignore` — `node_modules`, `dist`, `.next`, `.turbo`, `.env*`
- Husky 설정: `pre-commit` → `lint-staged`
- ESLint flat config (루트 `eslint.config.js`)
- Prettier 설정 (`.prettierrc` 또는 `prettier.config.js`)

**T-1.2: Changesets 초기 설정** (~30m)

- `@changesets/cli` 설치
- `npx changeset init`으로 `.changeset/config.json` 생성
- config.json 수정: `access: "public"`, `baseBranch: "main"`

### 테스트 시나리오

| #     | 조건                               | 행위               | 기대 결과                                 |
| ----- | ---------------------------------- | ------------------ | ----------------------------------------- |
| S-1.1 | 루트에서 실행                      | `pnpm install`     | 정상 설치, node_modules 생성              |
| S-1.2 | workspace 등록 전 하위 패키지 없음 | `pnpm turbo build` | 실행은 되지만 태스크 대상 0개 (에러 아님) |

---

## US-2: packages/core 라이브러리 패키지

> npm에 `md-to-naver-blog`로 배포할 수 있는 TypeScript 라이브러리 패키지가 있어야 한다.

### 태스크

**T-2.1: packages/core 디렉토리 및 설정** (~1.5h)

- `packages/core/package.json`:
  - `name: "md-to-naver-blog"`, `version: "0.0.1"`, `type: "module"`
  - `exports`: `{ ".": { "import": "./dist/index.js", "require": "./dist/index.cjs", "types": "./dist/index.d.ts" } }`
  - `main`: `./dist/index.cjs`, `module`: `./dist/index.js`, `types`: `./dist/index.d.ts`
  - `files: ["dist"]`
  - scripts: `build` (tsup), `test` (vitest run), `test:watch` (vitest), `lint` (eslint), `typecheck` (tsc --noEmit)
  - devDependencies: `tsup`, `vitest`, `typescript`
- `packages/core/tsconfig.json` — extends 루트, `outDir: "dist"`, `include: ["src"]`
- `packages/core/tsup.config.ts`:
  - `entry: ["src/index.ts"]`, `format: ["esm", "cjs"]`, `dts: true`, `clean: true`
  - `platform: "neutral"` (브라우저 호환)
- `packages/core/vitest.config.ts` — 기존 패턴: globals true, environment node, include `tests/**/*.test.ts`
- `packages/core/eslint.config.js` — flat config

**T-2.2: 스텁 소스 + 테스트** (~30m)

- `packages/core/src/index.ts` — `convert` 함수의 스텁 export. 시그니처: `(markdown: string) => { title: string; html: string }`. 최소 구현: title은 첫 번째 `#` 헤딩에서 추출, html은 빈 문자열 반환.
- `packages/core/tests/convert.test.ts` — 최소 1개 테스트: 스텁 함수 호출 시 `{ title, html }` 형태 반환 확인

### 테스트 시나리오

| #     | 조건                       | 행위                      | 기대 결과                                                   |
| ----- | -------------------------- | ------------------------- | ----------------------------------------------------------- |
| S-2.1 | packages/core에서 실행     | `pnpm build`              | `dist/` 에 `index.js`, `index.cjs`, `index.d.ts` 생성       |
| S-2.2 | packages/core에서 실행     | `pnpm test`               | 스텁 테스트 통과                                            |
| S-2.3 | tsup 빌드 결과             | `dist/index.js` 내용 확인 | Node-only API (`fs`, `path`) 미포함, ESM import/export 사용 |
| S-2.4 | exports 필드가 잘못된 경우 | 다른 패키지에서 `import`  | 타입 + 런타임 모두 올바르게 resolve                         |

---

## US-3: apps/web Next.js 스캐폴딩

> Next.js 앱이 core 패키지를 workspace 의존성으로 참조하며, dev/build가 가능해야 한다.

### 태스크

**T-3.1: Next.js 앱 생성** (~1.5h)

- `npx create-next-app@latest apps/web` — TypeScript, App Router, ESLint, Tailwind (기본 옵션)
- 또는 수동 최소 스캐폴딩: `apps/web/package.json`, `next.config.ts`, `tsconfig.json`, `app/layout.tsx`, `app/page.tsx`
- `apps/web/package.json`에 `"md-to-naver-blog": "workspace:*"` 의존성 추가
- scripts: `build`, `dev`, `lint`, `typecheck`
- `apps/web/tsconfig.json` — extends 루트 또는 Next.js 기본 설정

**T-3.2: core 연동 확인** (~30m)

- `app/page.tsx`에서 `import { convert } from "md-to-naver-blog"` 한 줄 추가 (사용하지 않아도 됨, import resolve 확인 용도)
- turbo `build`에서 core → web 빌드 순서 확인

### 테스트 시나리오

| #     | 조건                         | 행위                            | 기대 결과                                                    |
| ----- | ---------------------------- | ------------------------------- | ------------------------------------------------------------ |
| S-3.1 | 루트에서 실행                | `pnpm turbo build`              | core 먼저 빌드, web 이후 빌드 (dependsOn `^build` 동작 확인) |
| S-3.2 | apps/web에서 실행            | `pnpm dev`                      | Next.js dev 서버 정상 기동                                   |
| S-3.3 | core 패키지 미빌드 상태      | `pnpm turbo build --filter=web` | `^build`에 의해 core 자동 빌드 후 web 빌드 성공              |
| S-3.4 | core import 경로가 틀린 경우 | `pnpm turbo typecheck`          | 타입 에러 검출                                               |

---

## US-4: CI/CD 파이프라인

> PR에서 자동으로 lint/typecheck/test/build가 실행되고, main 머지 시 npm에 OIDC 방식으로 배포되어야 한다.

### 태스크

**T-4.1: CI 워크플로우 (.github/workflows/ci.yml)** (~1h)

- 트리거: `pull_request` (main 대상)
- 환경: Node 22.x, pnpm (corepack enable 또는 pnpm/action-setup)
- 단계: `pnpm install` → `pnpm turbo lint` → `pnpm turbo typecheck` → `pnpm turbo test` → `pnpm turbo build`
- pnpm store 캐시 설정

**T-4.2: Release 워크플로우 (.github/workflows/release.yml)** (~1.5h)

- 트리거: `push` to `main`
- permissions: `contents: write`, `id-token: write`, `pull-requests: write`
- Changesets 기반: `changesets/action` 사용
  - PR이 있으면 Version PR 생성/업데이트
  - PR 머지 시 `npm publish --provenance --access public`
- npm registry 인증: `NODE_AUTH_TOKEN`은 사용하지 않음. OIDC 방식(`id-token: write` + `--provenance`)
- 첫 publish는 수동 필요 가능성 → 위험 요소에 기록

### 테스트 시나리오

| #     | 조건                               | 행위                             | 기대 결과                                       |
| ----- | ---------------------------------- | -------------------------------- | ----------------------------------------------- |
| S-4.1 | ci.yml 문법                        | `actionlint` 또는 YAML 문법 검증 | 유효한 GitHub Actions YAML                      |
| S-4.2 | release.yml에 id-token 퍼미션 누락 | npm publish --provenance 실행    | 에러 발생 (OIDC 토큰 없음) — 따라서 퍼미션 필수 |
| S-4.3 | PR 생성 시                         | CI 워크플로우 트리거             | lint, typecheck, test, build 모두 실행          |
| S-4.4 | changeset 없이 main에 push         | release 워크플로우               | "No changesets found" — publish 스킵, 에러 아님 |

---

## 위험 요소

| #   | 위험                                      | 영향                                                                      | 완화 방안                                                                                                                                                                                   |
| --- | ----------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1 | npm 패키지명 `md-to-naver-blog` 이미 점유 | npm publish 실패                                                          | 구현 전 `npm view md-to-naver-blog` 실행하여 확인. 점유 시 유저에게 대안명 요청                                                                                                             |
| R-2 | npm OIDC 첫 publish 불가                  | 자동 배포 파이프라인이 첫 릴리스에서 실패                                 | 첫 publish는 `npm publish --access public`로 수동 실행 후, 이후 OIDC 전환. release.yml에 주석으로 기록                                                                                      |
| R-3 | turbo.json에 패키지별 outputs 분기        | core는 `dist/**`, web은 `.next/**` — 단일 build 태스크에서 outputs가 다름 | `turbo.json`에서 패키지별 `outputs`를 오버라이드하거나, 각 package.json의 `turbo` 키로 지정. hub 프로젝트는 web만 있어 단일 outputs를 사용하므로 이 프로젝트에서는 패키지별 오버라이드 필요 |
| R-4 | pnpm 버전 불일치                          | hub은 9.15.1, jjlabsio-starter는 10.4.1 — 어떤 버전을 쓸지 결정 필요      | 현재 시스템에 설치된 pnpm 버전(`pnpm --version`)을 사용. `packageManager` 필드에 명시                                                                                                       |
| R-5 | Changesets + OIDC 조합 미검증             | changesets/action이 npm OIDC를 지원하는지 확인 필요                       | changesets/action v1은 `NPM_TOKEN` 기반. OIDC를 쓰려면 커스텀 publish 커맨드에서 `--provenance` 플래그 전달. action의 `publish` 옵션으로 커스텀 스크립트 지정                               |

---

## 검증 시나리오

아래 시나리오는 contract.md에 그대로 포함된다.

### V-1: 모노레포 빌드 파이프라인

| 조건                               | 행위                               | 기대 결과                                           |
| ---------------------------------- | ---------------------------------- | --------------------------------------------------- |
| 클린 클론 상태 (node_modules 없음) | `pnpm install && pnpm turbo build` | core `dist/` 생성 후 web `.next/` 생성. 종료 코드 0 |
| core 소스에 타입 에러 삽입         | `pnpm turbo typecheck`             | 에러 검출, 종료 코드 != 0                           |
| core 테스트 실패 상태              | `pnpm turbo test`                  | 실패 보고, 종료 코드 != 0                           |

### V-2: packages/core 빌드 출력

| 조건                                  | 행위                                                  | 기대 결과                                  |
| ------------------------------------- | ----------------------------------------------------- | ------------------------------------------ |
| `pnpm turbo build --filter=core` 완료 | `ls packages/core/dist/`                              | `index.js`, `index.cjs`, `index.d.ts` 존재 |
| 빌드된 ESM 파일                       | `node -e "import('packages/core/dist/index.js')"`     | `convert` 함수 export 확인                 |
| 빌드된 CJS 파일                       | `node -e "require('./packages/core/dist/index.cjs')"` | `convert` 함수 export 확인                 |

### V-3: workspace 의존성

| 조건                                                          | 행위                                | 기대 결과                             |
| ------------------------------------------------------------- | ----------------------------------- | ------------------------------------- |
| apps/web의 package.json에 `"md-to-naver-blog": "workspace:*"` | `pnpm install`                      | 심링크 생성, node_modules에 core 연결 |
| apps/web 코드에서 core import                                 | `pnpm turbo typecheck --filter=web` | 타입 resolve 성공, 종료 코드 0        |

### V-4: CI 워크플로우 유효성

| 조건                          | 행위      | 기대 결과                                      |
| ----------------------------- | --------- | ---------------------------------------------- |
| .github/workflows/ci.yml 존재 | YAML 파싱 | 유효한 GitHub Actions 문법                     |
| ci.yml의 steps                | 순서 확인 | install → lint → typecheck → test → build 순서 |

### V-5: Changesets 설정

| 조건                          | 행위                | 기대 결과                                |
| ----------------------------- | ------------------- | ---------------------------------------- |
| `.changeset/config.json` 존재 | JSON 파싱           | `access: "public"`, `baseBranch: "main"` |
| `npx changeset add` 실행      | changeset 파일 생성 | `.changeset/` 하위에 md 파일 생성        |

### V-6: 린트 및 포맷

| 조건                            | 행위              | 기대 결과                 |
| ------------------------------- | ----------------- | ------------------------- |
| 모든 소스 파일이 포맷 준수 상태 | `pnpm turbo lint` | 종료 코드 0               |
| eslint 규칙 위반 코드 삽입      | `pnpm turbo lint` | 에러 검출, 종료 코드 != 0 |
