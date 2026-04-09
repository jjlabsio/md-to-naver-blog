export const DEFAULT_MARKDOWN = `---
tags: ["마크다운", "네이버블로그", "변환기"]
---

# 마크다운(Markdown) 완벽 가이드

마크다운은 텍스트 기반의 마크업 언어로, 간단한 문법으로 다양한 서식을 표현할 수 있습니다. 이 글에서는 마크다운의 모든 문법을 예시와 함께 살펴봅니다.

## 텍스트 스타일링

마크다운에서는 다양한 텍스트 스타일을 지원합니다.

**볼드 텍스트**는 별표 두 개로 감싸고, *이탤릭 텍스트*는 별표 하나로 감쌉니다. ~~취소선~~은 물결표 두 개를 사용합니다.

***볼드와 이탤릭***을 동시에 적용할 수도 있고, **볼드 안에 *이탤릭*을 중첩**할 수도 있습니다. ~~취소선 안에 **볼드**도 됩니다.~~

### 인라인 코드

문장 안에서 \`const x = 10;\` 같은 인라인 코드를 사용할 수 있습니다. 변수 \`name\`이나 함수 \`getData()\`를 언급할 때 유용합니다.

_이탤릭 안에 \`인라인 코드\`를 넣을 수도 있습니다._

## 링크와 이미지

### 링크

**[네이버 블로그](https://blog.naver.com)**에 방문하세요. [구글](https://google.com)과 [GitHub](https://github.com) 링크도 만들 수 있습니다.

### 이미지

이미지는 느낌표를 앞에 붙여서 삽입합니다.

![마크다운 로고](https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Markdown-mark.svg/208px-Markdown-mark.svg.png)

이미지를 링크로 감싸면 클릭 가능한 이미지가 됩니다.

[![클릭 가능한 이미지](https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Markdown-mark.svg/208px-Markdown-mark.svg.png)](https://daringfireball.net/projects/markdown/)

## 코드 블록

여러 프로그래밍 언어의 코드를 표현할 수 있습니다.

\`\`\`javascript
function greet(name) {
  console.log(\\\`Hello, \${name}!\\\`);
  return true;
}
\`\`\`

\`\`\`python
def calculate(a, b):
    result = a + b
    return result
\`\`\`

\`\`\`yaml
title: "글 제목"
tags: ["태그1", "태그2"]
published: true
items:
  - name: "아이템1"
  - name: "아이템2"
\`\`\`

\`\`\`bash
npm install md-to-naver-blog
\`\`\`

## 인용구

> 마크다운은 2004년 존 그루버(John Gruber)가 만들었습니다.
> 읽기 쉽고 쓰기 쉬운 텍스트 포맷을 목표로 설계되었습니다.

## 목록

### 순서 없는 목록

- 간결한 문법
- 다양한 플랫폼 지원
- HTML로 쉽게 변환

### 순서 있는 목록

1. 마크다운 문법을 배웁니다
2. 글을 작성합니다
3. 변환 도구를 사용합니다

### 중첩 목록

- 블록 요소
  - 제목 (h1~h6)
  - 문단
  - 코드 블록
- 인라인 요소
  - 볼드, 이탤릭
  - 링크, 이미지
    - 클릭 가능한 이미지

1. 첫 번째
   1. 하위 1-1
   2. 하위 1-2
2. 두 번째

### 목록 안의 코드 블록

1. 먼저 패키지를 설치합니다.

   \`\`\`bash
   npm install md-to-naver-blog
   \`\`\`

2. 코드에서 사용합니다.

   \`\`\`javascript
   const { convert } = require("md-to-naver-blog");
   const result = convert(markdown);
   \`\`\`

3. 결과를 확인합니다.

## 테이블

| 문법        | 설명                    | 예시              |
| ----------- | ----------------------- | ----------------- |
| \`#\`       | 제목                    | \`# 제목\`        |
| \`**text**\`| 볼드                    | **볼드**          |
| \`*text*\`  | 이탤릭                  | *이탤릭*          |
| \`> text\`  | 인용구                  | 인용구            |

## 구분선

위 내용입니다.

---

아래 내용입니다.

#### 마무리

마크다운은 배우기 쉽고, 다양한 플랫폼에서 활용할 수 있는 강력한 도구입니다. 이 글의 모든 문법을 네이버 블로그에 그대로 붙여넣을 수 있습니다.
`;
