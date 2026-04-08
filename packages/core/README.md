# @jjlabsio/md-to-naver-blog

**[mtnb.dev](https://mtnb.dev)** — 바로 사용해보기

마크다운을 네이버 블로그에 바로 붙여넣기 가능한 HTML로 변환하는 라이브러리입니다.

> AI로 블로그 글 작성을 자동화하려는 개발자를 위해 만들었습니다. npm 패키지로 제공되어 에이전트나 스크립트에서 코드로 직접 import해 사용할 수 있습니다.

## 기능

- 마크다운 → 네이버 블로그 호환 HTML 변환
- 헤딩, 리스트, 볼드/이탤릭, 코드 블록, 테이블, 인용구, 링크, 이미지 지원
- YAML frontmatter 파싱 (title, tags)
- Node.js + 브라우저 양쪽 지원 (순수 JS)

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

| 필드    | 타입     | 설명                                        |
| ------- | -------- | ------------------------------------------- |
| `title` | `string` | 첫 번째 `h1` 헤딩 텍스트                    |
| `html`  | `string` | 네이버 블로그 에디터에 붙여넣기 가능한 HTML |

### frontmatter 지원

```md
---
tags: [개발, 자동화]
---

# 글 제목

내용...
```

`tags`는 HTML 하단에 `#개발 #자동화` 형태로 자동 추가됩니다.

## 웹 앱

라이브러리를 직접 쓰지 않아도 웹 앱에서 마크다운을 붙여넣고 변환된 HTML을 바로 복사할 수 있습니다.

→ **[mtnb.dev](https://mtnb.dev)**

## 라이선스

MIT
