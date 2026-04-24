# @jjlabsio/md-to-naver-blog

**[mtnb.dev](https://mtnb.dev)** — 바로 사용해보기

Markdown을 네이버 블로그에 바로 붙여넣기 가능한 HTML로 변환하는 라이브러리입니다.

> AI로 블로그 글 작성을 자동화하려는 개발자를 위해 만들었습니다. npm 패키지로 제공되어 에이전트나 스크립트에서 코드로 직접 import해 사용할 수 있습니다.

## 설치

```bash
npm install @jjlabsio/md-to-naver-blog
# or
pnpm add @jjlabsio/md-to-naver-blog
```

ESM(`import`)과 CJS(`require`) 모두 지원합니다.

## 사용법

```ts
import { convert } from "@jjlabsio/md-to-naver-blog";

const markdown = `
# 제목

**볼드** 텍스트와 _이탤릭_ 텍스트입니다.

\`\`\`ts
const hello = "world";
\`\`\`
`;

const { title, html } = convert(markdown);

console.log(title); // "제목"
console.log(html); // 네이버 블로그에 붙여넣기 가능한 HTML
```

### 반환값

| 필드          | 타입                      | 설명                                        |
| ------------- | ------------------------- | ------------------------------------------- |
| `title`       | `string`                  | 첫 번째 `h1` 헤딩 텍스트                    |
| `html`        | `string`                  | 네이버 블로그 에디터에 붙여넣기 가능한 HTML |
| `frontmatter` | `Record<string, unknown>` | YAML frontmatter 파싱 결과                  |
| `errors`      | `ParseError[]`            | 파싱 경고/에러 배열 (throw 대신 수집)       |

### frontmatter 지원

```md
---
tags: [개발, 자동화]
---

# 글 제목

내용...
```

`tags`는 HTML 하단에 `#개발 #자동화` 형태로 자동 추가됩니다.

### MDX 커스텀 컴포넌트

MDX에서 사용하는 커스텀 컴포넌트를 `components` 옵션으로 변환할 수 있습니다.

```ts
import { convert } from "@jjlabsio/md-to-naver-blog";

const mdx = `
# 제목

<YouTube id="abc123" />

<Callout type="warning">
**주의:** 이 내용을 확인하세요.
</Callout>
`;

const { html } = convert(mdx, {
  components: {
    YouTube: (props) =>
      `<div><a href="https://youtube.com/watch?v=${props.id}">[YouTube 영상 보기]</a></div>`,
    Callout: (props, children) =>
      `<div style="background: #fff3cd; padding: 16px; border-left: 4px solid #ffc107;">[${props.type}] ${children}</div>`,
  },
});
```

- **Self-closing**: `<YouTube id="abc123" />`
- **Children 포함**: `<Callout>내용</Callout>` — children 안의 인라인 마크다운(`**bold**` 등)도 처리됩니다
- **미등록 컴포넌트**: `components`에 등록하지 않은 컴포넌트는 태그가 제거되고 children만 출력됩니다 (self-closing은 무시)

## 지원하는 마크다운 문법

### 블록 레벨

| 문법             | 마크다운                 |
| ---------------- | ------------------------ |
| 헤딩 (H1~H6)     | `# 제목` ~ `###### 제목` |
| 코드 블록        | ` ```js `                |
| 인용구           | `> 텍스트`               |
| 순서 있는 리스트 | `1. 항목`                |
| 순서 없는 리스트 | `- 항목`                 |
| 중첩 리스트      | 들여쓰기로 중첩          |
| 테이블           | `\| 헤더 \| 헤더 \|`     |
| 수평선           | `---`                    |
| 이미지           | `![alt](url)`            |
| 링크 이미지      | `[![alt](img)](link)`    |

### 인라인

| 문법        | 마크다운                   |
| ----------- | -------------------------- |
| 볼드        | `**텍스트**`               |
| 이탤릭      | `*텍스트*` 또는 `_텍스트_` |
| 볼드+이탤릭 | `***텍스트***`             |
| 취소선      | `~~텍스트~~`               |
| 인라인 코드 | `` `코드` ``               |
| 링크        | `[텍스트](url)`            |

### 코드 블록 구문 강조

다음 언어는 커스텀 구문 강조가 적용됩니다:

- **JavaScript** (`js`, `javascript`)
- **Python** (`py`, `python`)
- **YAML** (`yml`, `yaml`)

그 외 언어는 plain text로 렌더링됩니다.

## API

```ts
function convert(
  markdown: string,
  options?: ConvertOptions,
  cache?: RenderCache,
): ConvertResult;
```

### `ConvertOptions`

| 필드           | 타입                                | 설명                          |
| -------------- | ----------------------------------- | ----------------------------- |
| `components`   | `Record<string, ComponentRenderer>` | MDX 커스텀 컴포넌트 렌더러 맵 |
| `transformUrl` | `(ctx: UrlContext) => string`       | URL 변환 함수 (optional)      |

### `ComponentRenderer`

```ts
type ComponentRenderer = (
  props: ComponentProps,
  children: string,
  ctx?: ComponentRenderCtx,
) => string;
```

- `props`: 컴포넌트에 전달된 속성 (`{ [key: string]: string | number | boolean | null }`)
- `children`: block-level 마크다운이 처리된 HTML 문자열 (self-closing이면 빈 문자열)
- `ctx`: 렌더 컨텍스트 (`{ depth, index, parent }`, optional)

## v1 → v2 Migration

v2.0.0은 파서를 자체 정규식에서 `unified + remark-parse + remark-gfm + remark-mdx` 기반으로 교체한 메이저 업그레이드입니다.

### Breaking Changes

- **`ComponentProps` 타입 변경**: `Record<string, string>` -> `Record<string, string | number | boolean | null>`. literal attribute(`{3}`, `{true}`, `{null}`)를 원시 타입으로 평가합니다.
- **`ConvertResult.errors` 필드 추가**: 파싱 에러 시 throw 대신 `errors: ParseError[]` 배열로 수집합니다.
- **JSX children이 block-level HTML로 전달**: v1과 동일하게 HTML 문자열이지만, 이제 표/리스트/코드블록 등 block-level 내용을 포함합니다.
- **파서 교체에 따른 출력 차이**: 대부분 동일하지만 일부 edge case에서 미묘한 차이가 발생할 수 있습니다.

### Additive Changes

- **`ComponentRenderCtx`**: renderer의 세 번째 인자로 `{ depth, index, parent }` 컨텍스트를 받을 수 있습니다 (optional).
- **`errors` 필드**: 닫히지 않은 태그, runtime expression, import/export 등의 에러를 수집합니다.

### Migration Examples

```ts
// v1 (2-arg renderer) -- 수정 없이 계속 동작
const renderer = (props, children) => `<div>${children}</div>`;

// v2 (3-arg renderer with ctx)
const renderer = (props, children, ctx) =>
  `<div data-depth="${ctx?.depth}">${children}</div>`;
```

```ts
// v2 errors 활용
const { html, errors } = convert(mdx, { components });
if (errors.length > 0) {
  console.warn(`${errors.length}개의 파싱 경고가 있습니다.`);
}
```

### Removed

- 자체 정규식 파서 (사용자 API에는 영향 없음).

## 제한사항

- **인라인 CSS만 사용**: 네이버 블로그 에디터가 CSS class를 지원하지 않아 모든 스타일이 인라인으로 적용됩니다
- **지원하지 않는 문법**: footnote, math(LaTeX), 정의 리스트, task list(체크박스)
- **런타임 의존성**: [gray-matter](https://github.com/jonschlinkert/gray-matter) (frontmatter 파싱), [unified](https://github.com/unifiedjs/unified) + [remark-parse](https://github.com/remarkjs/remark) + [remark-gfm](https://github.com/remarkjs/remark-gfm) + [remark-mdx](https://github.com/mdx-js/mdx) (MDX 파싱)

## 웹 앱

라이브러리를 직접 쓰지 않아도 웹 앱에서 마크다운을 붙여넣고 변환된 HTML을 바로 복사할 수 있습니다.

→ **[mtnb.dev](https://mtnb.dev)**

## 라이선스

MIT
