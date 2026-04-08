# Analysis: 모노레포 구조, 빌드, 테스트 환경 세팅

## 요구사항 보완

- **v1 스코프에서 `packages/skill/`은 제외** — 디렉토리 자체를 만들지 않는다
- **npm 패키지명**: `md-to-naver-blog` (packages/core가 이 이름으로 배포)
- **Changesets**: 이번에 처음 도입
- **npm OIDC 배포**: `NPM_TOKEN` 대신 GitHub Actions `id-token: write` + npm provenance 사용
- **core 런타임**: Node.js + 브라우저 양쪽 지원 (순수 JS, DOM 의존 없음)
- **core 출력**: `{ title: string; html: string }`
- **apps/web**: Next.js 웹 앱 (이번 태스크에서는 스캐폴딩만, 기능 구현은 별도)

## 코드베이스 맥락

### 현재 상태

- initial commit만 있는 완전히 빈 레포 (소스 파일 없음)
- `.claude/settings.local.json`에 claude-crew 플러그인 활성화됨

### 유저의 기존 패턴 (hub 프로젝트 기준)

| 항목           | 기존 패턴                                                               |
| -------------- | ----------------------------------------------------------------------- |
| 패키지 매니저  | pnpm (현재 9.15.1)                                                      |
| 모노레포 도구  | Turborepo 2.x                                                           |
| workspace 구조 | `pnpm-workspace.yaml`에 `apps/*`, `packages/*`                          |
| TypeScript     | strict 모드                                                             |
| ESLint         | flat config                                                             |
| 빌드 도구      | tsup (라이브러리), Next.js (앱)                                         |
| 테스트         | vitest (globals: true, environment: node, include: tests/\*_/_.test.ts) |
| 포맷터         | Prettier                                                                |
| Git hooks      | Husky + lint-staged                                                     |
| turbo.json     | `build`, `lint`, `typecheck`, `dev` 태스크                              |
| Node 버전      | 22.x (현재 22.19.0)                                                     |

### 참조 파일

- `/Users/jaejinsong/code/projects/hub/turbo.json` — turbo.json 패턴
- `/Users/jaejinsong/code/projects/hub/pnpm-workspace.yaml` — workspace 설정
- `/Users/jaejinsong/code/projects/hub/package.json` — root package.json 패턴
- `/Users/jaejinsong/code/projects/jjlabsio-starter/vitest.config.ts` — vitest 설정 패턴
- `/Users/jaejinsong/code/projects/jjlabsio-starter/package.json` — tsup + npm publish 패턴

## 아키텍처 방향

### 권장 안

```
md-to-naver-blog/
├── .changeset/              # Changesets 설정
├── .github/
│   └── workflows/
│       ├── ci.yml           # PR CI (lint, typecheck, test, build)
│       └── release.yml      # Changesets 릴리스 (npm OIDC)
├── packages/
│   └── core/
│       ├── src/
│       │   └── index.ts
│       ├── tests/
│       │   └── convert.test.ts
│       ├── package.json     # name: "md-to-naver-blog"
│       ├── tsconfig.json
│       ├── tsup.config.ts   # esm + cjs 듀얼 빌드
│       └── vitest.config.ts
├── apps/
│   └── web/
│       └── (Next.js 스캐폴딩)
├── turbo.json
├── pnpm-workspace.yaml
├── package.json             # root (private: true)
├── tsconfig.json            # root
└── .gitignore
```

**핵심 결정사항:**

1. **packages/core 빌드: tsup** — ESM + CJS 듀얼 출력, `dts: true`로 타입 선언 자동 생성. package.json의 `exports` 필드로 조건부 export.
2. **공유 설정 패키지 생략** — 패키지 2개(core + web)뿐이라 루트에 설정을 두고 extends.
3. **테스트: vitest** — 기존 패턴 유지. packages/core에 vitest.config.ts 배치.
4. **Changesets + GitHub Actions OIDC 릴리스** — `.changeset/config.json` 생성. npm publish 시 `--provenance` 플래그 + `id-token: write` 퍼미션.
5. **apps/web: Next.js 최소 스캐폴딩** — core를 `workspace:*`로 의존. 기능 구현은 4번 태스크에서.

### 대안

| 결정        | 권장              | 대안            | 대안을 선택하지 않는 이유                       |
| ----------- | ----------------- | --------------- | ----------------------------------------------- |
| 빌드 도구   | tsup              | unbuild, rollup | tsup이 가장 간단하고 유저가 이미 사용 중        |
| 테스트      | vitest            | jest            | vitest가 유저의 기존 패턴이고 ESM 네이티브 지원 |
| 공유 설정   | 루트 설정 extends | @repo/\* 패키지 | 패키지 2개뿐이라 불필요한 복잡도                |
| 타입 시스템 | TypeScript strict | 느슨한 설정     | 유저의 기존 프로젝트가 모두 strict              |

## 엣지 케이스 / 리스크

1. **npm 패키지명 점유**: `md-to-naver-blog`가 npm에 이미 등록되어 있을 수 있음. 첫 publish 전에 `npm view md-to-naver-blog` 확인 필요
2. **OIDC npm 배포 설정**: npm에서 OIDC를 사용하려면 npm 패키지 설정에서 provenance를 활성화해야 함. 처음 publish는 수동으로 해야 할 수 있음
3. **core의 브라우저 호환성**: markdown 파싱 라이브러리 선택 시 Node-only 의존성이 섞일 수 있음. tsup의 `platform: 'neutral'` 설정 권장
4. **pnpm workspace protocol**: apps/web에서 core를 `"md-to-naver-blog": "workspace:*"`로 참조 시, turbo의 `dependsOn: ["^build"]`가 빌드 순서를 보장하는지 확인
5. **Changesets 첫 도입**: 유저가 Changesets를 처음 사용하므로 워크플로우에 대한 이해 필요

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
