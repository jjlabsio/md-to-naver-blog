# md-to-naver-blog

**[mtnb.dev](https://mtnb.dev)** — 바로 사용해보기

마크다운을 네이버 블로그에 바로 붙여넣기 가능한 HTML로 변환하는 라이브러리입니다.

> AI로 블로그 글 작성을 자동화하려는 개발자를 위해 만들었습니다. npm 패키지로 제공되어 에이전트나 스크립트에서 코드로 직접 import해 사용할 수 있습니다.

## 기능

- 마크다운 → 네이버 블로그 호환 HTML 변환
- 헤딩, 리스트, 볼드/이탤릭, 코드 블록, 테이블, 인용구, 링크, 이미지 지원
- YAML frontmatter 파싱 (title, tags)
- Node.js + 브라우저 양쪽 지원 (순수 JS)
- 실시간 미리보기 웹 앱 제공

## 설치

```bash
npm install @jjlabsio/md-to-naver-blog
# or
pnpm add @jjlabsio/md-to-naver-blog
```

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

### frontmatter 지원

```md
---
tags: [개발, 자동화]
---

# 글 제목

내용...
```

`tags`는 HTML 하단에 `#개발 #자동화` 형태로 자동 추가됩니다.

### 브라우저 자동화에서 사용하기

네이버 블로그 API가 폐쇄되어 있어서, 브라우저 자동화(Playwright/Puppeteer/Selenium)로 글을 올릴 때 클립보드 유틸 함수를 활용할 수 있습니다.

- `getHtmlClipboardScript(html)` — `text/html`로 클립보드에 복사하는 JavaScript 코드 문자열을 반환
- `getTextClipboardScript(text)` — `text/plain`으로 클립보드에 복사하는 JavaScript 코드 문자열을 반환

```ts
import {
  convert,
  getHtmlClipboardScript,
  getTextClipboardScript,
} from "@jjlabsio/md-to-naver-blog";

const { title, html } = convert(markdown);

// 본문 HTML을 클립보드에 복사
await page.evaluate(getHtmlClipboardScript(html));

// 제목을 클립보드에 복사
await page.evaluate(getTextClipboardScript(title));
```

## v1 → v2 Migration

v2.0.0은 파서를 자체 정규식에서 `unified + remark-parse + remark-gfm + remark-mdx` 기반으로 교체한 메이저 업그레이드입니다.

### Breaking Changes

#### `ComponentProps` 타입 변경

v1에서는 모든 attribute가 `string`이었지만, v2에서는 literal attribute를 원시 타입으로 평가합니다.

```ts
// v1: Record<string, string>
// v2: Record<string, string | number | boolean | null>
```

#### `ConvertResult.errors` 필드 추가

v2에서는 파싱 에러 시 throw 대신 `errors` 배열로 수집합니다.

```ts
// v1
const { title, html } = convert(markdown);

// v2
const { title, html, errors } = convert(markdown);
if (errors.length > 0) {
  console.warn(`${errors.length}개의 파싱 경고가 있습니다.`);
}
```

#### 파서 교체에 따른 출력 차이

대부분의 입력에서 동일한 출력을 생성하지만, 일부 edge case에서 미묘한 차이가 발생할 수 있습니다. 기존 테스트가 있다면 출력을 비교해 확인하세요.

### New Features

#### `ComponentRenderer` ctx 파라미터 (optional)

renderer의 세 번째 인자로 컨텍스트 정보를 받을 수 있습니다. 기존 2-arg renderer는 수정 없이 그대로 동작합니다.

```ts
// v1 (계속 동작)
const renderer = (props, children) => `<div>${children}</div>`;

// v2 (ctx 활용)
const renderer = (props, children, ctx) =>
  `<div data-depth="${ctx?.depth}" data-index="${ctx?.index}">${children}</div>`;
```

#### JSX children block-level 재귀 렌더링

컨테이너 컴포넌트 안에 표, 리스트, 코드블록, 중첩 컴포넌트를 자유롭게 배치할 수 있습니다.

```mdx
<Step title="설정">

| 항목 | 설명 |
|------|------|
| A    | B    |

1. 첫 번째 단계
2. 두 번째 단계

</Step>
```

#### graceful fallback

닫히지 않은 태그, runtime expression (`{variable}`), `import`/`export` 구문은 throw 없이 `errors` 배열에 수집되고, `html`은 가능한 부분까지 best-effort로 생성됩니다.

## CLI

마크다운 파일을 변환하고 브라우저에서 미리보기를 열어 제목, 본문, 태그를 각각 서식 복사할 수 있습니다.

```bash
npm install -g @jjlabsio/mtnb
# or
pnpm add -g @jjlabsio/mtnb
```

```bash
mtnb preview post.md
```

브라우저에서 미리보기 페이지가 열리고, 각 항목의 "서식 복사" 버튼을 클릭해 네이버 블로그에 붙여넣을 수 있습니다.

## 웹 앱

라이브러리를 직접 쓰지 않아도 웹 앱에서 마크다운을 붙여넣고 변환된 HTML을 바로 복사할 수 있습니다.

→ **[mtnb.dev](https://mtnb.dev)**

- 실시간 미리보기
- "서식 복사" 버튼으로 클립보드에 HTML 복사

## 모노레포 구조

```
md-to-naver-blog/
├── packages/
│   ├── core/       # 변환 라이브러리 (npm 배포)
│   └── cli/        # CLI 도구 (@jjlabsio/mtnb)
└── apps/
    └── web/        # Next.js 웹 앱 (mtnb.dev)
```

## 기여하기

기여를 환영합니다.

### 환경 설정

```bash
# 저장소 클론
git clone https://github.com/jjlabsio/md-to-naver-blog.git
cd md-to-naver-blog

# 의존성 설치 (pnpm 필요)
pnpm install

# 개발 서버 실행
pnpm dev

# 테스트 실행
pnpm test

# 빌드
pnpm build
```

### 기여 절차

1. 이슈를 먼저 열어 변경 사항을 논의합니다.
2. 저장소를 fork하고 feature 브랜치를 만듭니다.
   ```bash
   git checkout -b feat/your-feature
   ```
3. 변경 사항을 구현하고 테스트를 작성합니다.
4. 모든 검증이 통과하는지 확인합니다.
   ```bash
   pnpm lint && pnpm typecheck && pnpm test
   ```
5. Pull Request를 엽니다. PR 설명에 변경 이유와 테스트 방법을 적어주세요.

### 커밋 컨벤션

[Conventional Commits](https://www.conventionalcommits.org/)를 따릅니다.

```
feat: 새로운 기능
fix: 버그 수정
docs: 문서 수정
test: 테스트 추가/수정
refactor: 리팩토링
chore: 빌드, 설정 변경
```

### 버그 리포트 / 기능 요청

[GitHub Issues](https://github.com/jjlabsio/md-to-naver-blog/issues)에 등록해주세요.

## 라이선스

MIT
