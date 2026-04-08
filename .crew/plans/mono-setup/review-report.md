# Code Review: mono-setup

## 판정: PASS

## 가드레일 검증

### Must 항목

| #   | 항목                                                            | 결과 |
| --- | --------------------------------------------------------------- | ---- |
| 1   | pnpm-workspace.yaml에 packages/_, apps/_ 등록                   | PASS |
| 2   | turbo.json에 build, lint, typecheck, test, dev 태스크 정의      | PASS |
| 3   | packages/core name이 md-to-naver-blog                           | PASS |
| 4   | packages/core "type": "module" + ESM/CJS 듀얼 빌드              | PASS |
| 5   | exports 필드에 ., import, require, types 조건 명시              | PASS |
| 6   | vitest tests/\*_/_.test.ts 패턴                                 | PASS |
| 7   | .changeset/config.json access가 "public"                        | PASS |
| 8   | CI: PR에서 lint + typecheck + test + build 실행                 | PASS |
| 9   | release: OIDC (id-token: write) + npm publish --provenance      | PASS |
| 10  | .gitignore에 node_modules, dist, .next, .turbo 포함             | PASS |
| 11  | root package.json "private": true                               | PASS |
| 12  | turbo.json build.outputs에 dist/**, .next/**, !.next/cache/\*\* | PASS |

### Must NOT 항목

| #   | 항목                                  | 결과 |
| --- | ------------------------------------- | ---- |
| 1   | packages/skill/ 디렉토리 없음         | PASS |
| 2   | core에 DOM/Node-only API 미사용       | PASS |
| 3   | NPM_TOKEN 시크릿 미사용 (OIDC 방식)   | PASS |
| 4   | root package.json에 version 필드 없음 | PASS |
| 5   | @repo/\* 공유 설정 패키지 없음        | PASS |

## 지적 사항

### minor

#### 1. apps/web/app/page.tsx - Server Component에서 동기 함수 호출은 괜찮으나 placeholder 수준

`convert("# Hello")`를 호출하고 `result.title`만 렌더링한다. `result.html`은 사용하지 않는다. 현재 `html`은 항상 빈 문자열을 반환하므로 scaffold 용도임이 명확하지만, 향후 실제 HTML 변환이 구현되면 이 페이지도 업데이트 필요.

**영향**: 없음 (scaffold 단계)
**제안**: 현재 상태로 유지 가능. core 패키지의 convert 함수가 실제 구현될 때 함께 업데이트.

#### 2. eslint.config.js가 root, packages/core, apps/web에 각각 동일하게 중복

세 곳 모두 `tseslint.configs.recommended`만 사용하며 ignores만 다르다. 현재 규모에서는 문제 없으나, 가드레일에서 @repo/\* 공유 패키지를 금지하므로 현재 접근이 올바르다.

**영향**: 없음
**제안**: 현 상태 유지 (가드레일 준수)

#### 3. packages/core/tests/convert.test.ts - html 반환값에 대한 구체적 assertion 부재

`expect(typeof result.html).toBe("string")`만 확인하고 실제 html 내용은 검증하지 않는다. scaffold 단계이므로 이해 가능하나, html이 빈 문자열인 것이 의도적인지 테스트에서 명시하면 좋다.

**영향**: 낮음
**제안**: `expect(result.html).toBe("")` 또는 향후 구현 시 구체적 assertion 추가.

## 요약

모노레포 scaffold로서 구조가 깔끔하다. 가드레일 위반 없음. turbo.json 태스크 의존성이 적절하고 (build는 ^build 의존, lint/test는 독립), CI/CD 파이프라인이 OIDC 기반으로 올바르게 구성되어 있다. critical/major 이슈 없음.
