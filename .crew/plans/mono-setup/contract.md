# 스프린트 계약: mono-setup

생성일: 2026-04-08
유형: 엔지니어링

## 목표

pnpm + Turborepo 모노레포 구조를 세팅하고, packages/core 라이브러리와 apps/web Next.js 앱의 빌드/테스트 환경 및 CI/CD 파이프라인을 구성한다.

## 수용 기준

- [ ] pnpm workspace + Turborepo 기반 모노레포 구조가 동작한다 (`pnpm install && pnpm turbo build` 성공)
- [ ] packages/core가 tsup으로 ESM + CJS 듀얼 빌드되고, `{ title, html }` 시그니처의 스텁 함수가 export된다
- [ ] vitest로 packages/core의 테스트가 실행된다
- [ ] apps/web이 Next.js로 스캐폴딩되고, core를 workspace:\*로 참조하며 빌드된다
- [ ] Changesets가 초기화되어 있다 (access: public, baseBranch: main)
- [ ] GitHub Actions CI 워크플로우가 PR에서 lint/typecheck/test/build를 실행한다
- [ ] GitHub Actions Release 워크플로우가 OIDC 방식으로 npm publish한다

## 가드레일

### Must

- `pnpm-workspace.yaml`에 `packages/*`와 `apps/*` 등록
- `turbo.json`에 `build`, `lint`, `typecheck`, `test`, `dev` 태스크 정의
- packages/core의 package.json `name`은 반드시 `md-to-naver-blog`
- packages/core는 `"type": "module"` + ESM/CJS 듀얼 빌드
- packages/core의 `exports` 필드에 `.`, `import`, `require`, `types` 조건 명시
- vitest 설정: `tests/**/*.test.ts` 패턴 (기존 컨벤션)
- `.changeset/config.json`의 `access`는 `"public"`
- GitHub Actions CI: PR에서 lint + typecheck + test + build 실행
- GitHub Actions release: OIDC (`id-token: write`) + `npm publish --provenance`
- `.gitignore`에 node_modules, dist, .next, .turbo 포함
- root package.json은 `"private": true`
- `turbo.json`의 `build.outputs`에 core는 `["dist/**"]`, web은 `[".next/**", "!.next/cache/**"]`

### Must NOT

- packages/skill/ 디렉토리를 만들지 않는다 (v2 스코프)
- core에 DOM API나 Node-only API(fs, path 등)를 직접 사용하지 않는다
- NPM_TOKEN 시크릿을 사용하지 않는다 (OIDC 방식)
- root package.json에 `"version"` 필드를 넣지 않는다 (private root)
- 공유 설정 패키지(@repo/\*)를 만들지 않는다 (이 프로젝트 규모에 불필요)

## 검증 시나리오

### V-1: 모노레포 빌드 파이프라인

- 조건: 클린 클론 상태 (node_modules 없음)
- 행위: `pnpm install && pnpm turbo build`
- 기대 결과: core `dist/` 생성 후 web `.next/` 생성. 종료 코드 0

### V-1b: 타입 에러 검출

- 조건: core 소스에 타입 에러 삽입
- 행위: `pnpm turbo typecheck`
- 기대 결과: 에러 검출, 종료 코드 != 0

### V-1c: 테스트 실패 검출

- 조건: core 테스트 실패 상태
- 행위: `pnpm turbo test`
- 기대 결과: 실패 보고, 종료 코드 != 0

### V-2: packages/core 빌드 출력

- 조건: `pnpm turbo build --filter=core` 완료
- 행위: `ls packages/core/dist/`
- 기대 결과: `index.js`, `index.cjs`, `index.d.ts` 존재

### V-2b: ESM export 확인

- 조건: 빌드된 ESM 파일
- 행위: `node -e "import('./packages/core/dist/index.js')"`
- 기대 결과: `convert` 함수 export 확인

### V-2c: CJS export 확인

- 조건: 빌드된 CJS 파일
- 행위: `node -e "require('./packages/core/dist/index.cjs')"`
- 기대 결과: `convert` 함수 export 확인

### V-3: workspace 의존성

- 조건: apps/web의 package.json에 `"md-to-naver-blog": "workspace:*"`
- 행위: `pnpm install`
- 기대 결과: 심링크 생성, node_modules에 core 연결

### V-3b: core import 타입 확인

- 조건: apps/web 코드에서 core import
- 행위: `pnpm turbo typecheck --filter=web`
- 기대 결과: 타입 resolve 성공, 종료 코드 0

### V-4: CI 워크플로우 유효성

- 조건: .github/workflows/ci.yml 존재
- 행위: YAML 파싱
- 기대 결과: 유효한 GitHub Actions 문법, install → lint → typecheck → test → build 순서

### V-5: Changesets 설정

- 조건: `.changeset/config.json` 존재
- 행위: JSON 파싱
- 기대 결과: `access: "public"`, `baseBranch: "main"`

### V-6: 린트 및 포맷

- 조건: 모든 소스 파일이 포맷 준수 상태
- 행위: `pnpm turbo lint`
- 기대 결과: 종료 코드 0

## 참조 문서

- 사전 분석: .crew/plans/mono-setup/analysis.md
- 구현 계획: .crew/plans/mono-setup/plan.md

## 검증 이력

PlanEvaluator PASS — review.md 참조

## 상태

ACTIVE
