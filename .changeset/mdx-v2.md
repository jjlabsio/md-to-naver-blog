---
"@jjlabsio/md-to-naver-blog": major
---

MDX v2: unified 기반 파서로 교체, JSX children block-level 재귀 렌더링 지원

### Breaking Changes

- **파서 교체**: 자체 정규식 파서를 `unified + remark-parse + remark-gfm + remark-mdx` 기반 mdast 파이프라인으로 교체. 대부분의 입력에서 동일한 출력을 생성하나, 일부 edge case에서 미묘한 차이가 발생할 수 있음.
- **`ComponentRenderer` 시그니처 확장**: `(props, children)` -> `(props, children, ctx?)`. 기존 2-arg renderer는 그대로 동작(ctx는 optional).
- **`ComponentProps` 타입 변경**: `Record<string, string>` -> `Record<string, string | number | boolean | null>`. literal attribute를 원시 타입으로 평가.
- **`ConvertResult.errors` 필드 추가**: 파싱 에러 시 throw 대신 `errors: ParseError[]` 배열로 수집. `html`은 best-effort로 반환.

### New Features

- **JSX children block-level 재귀 렌더링**: `<Step>`, `<Callout>` 등 컨테이너 컴포넌트 안에 표, 리스트, 코드블록, 중첩 컴포넌트를 자유롭게 배치 가능.
- **`ComponentRenderCtx`**: renderer의 세 번째 인자로 `{ depth, index, parent }` 컨텍스트 전달.
- **에러 배너 UI (apps/web)**: MDX 파싱 에러 시 에디터 상단에 경고 배너 표시.
- **graceful fallback**: 닫히지 않은 태그, runtime expression, import/export 구문을 throw 없이 처리.
