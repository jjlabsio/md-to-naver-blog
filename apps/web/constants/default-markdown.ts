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
   1. 하위 2-1
      1. 더 깊은 항목

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

export const JSX_COMPONENTS_MARKDOWN = `---
tags: ["MDX", "컴포넌트", "네이버블로그"]
---

# JSX 컴포넌트 활용하기

v2부터 마크다운 안에서 **JSX 컴포넌트**를 사용할 수 있습니다. 컴포넌트를 등록하면 블로그에 맞는 HTML로 자동 변환됩니다.

## Callout 컴포넌트

다양한 타입의 안내 박스를 만들 수 있습니다.

<Callout type="info">
**참고**: 이 기능은 v2에서 새롭게 추가되었습니다.
기존 마크다운 문법과 자유롭게 섞어 쓸 수 있습니다.
</Callout>

<Callout type="warning">
**주의**: 컴포넌트 이름은 반드시 **대문자**로 시작해야 합니다.
\`callout\`이 아니라 \`Callout\`으로 작성하세요.
</Callout>

<Callout type="tip">
**팁**: 컴포넌트 안에서도 **볼드**, *이탤릭*, \`인라인 코드\` 등
모든 마크다운 인라인 문법을 사용할 수 있습니다.
</Callout>

<Callout type="danger">
**위험**: 이 작업은 되돌릴 수 없습니다. 진행하기 전에 반드시 백업하세요.
</Callout>

## Badge 컴포넌트

인라인 뱃지로 상태나 라벨을 표시합니다.

<Badge color="green">완료</Badge> 이 기능은 구현이 완료되었습니다.

<Badge color="blue">v2</Badge> 새 버전에서만 사용 가능한 기능입니다.

<Badge color="red">필수</Badge> 이 설정은 반드시 입력해야 합니다.

## Self-closing 컴포넌트

닫는 태그 없이 사용하는 컴포넌트도 지원합니다.

<Divider style="dashed" />

위와 아래를 구분하는 커스텀 구분선입니다.

## 마크다운과 혼합 사용

컴포넌트와 일반 마크다운을 자유롭게 섞어 쓸 수 있습니다.

1. 먼저 패키지를 설치합니다.

   \`\`\`bash
   npm install @jjlabsio/md-to-naver-blog
   \`\`\`

2. 컴포넌트를 등록합니다.

<Callout type="info">
컴포넌트는 \`convert()\` 함수의 두 번째 인자로 전달합니다.

\`\`\`javascript
const result = convert(markdown, {
  components: { Callout, Badge }
});
\`\`\`
</Callout>

3. 결과를 확인합니다.
`;

export const NESTED_COMPONENTS_MARKDOWN = `---
tags: ["MDX", "중첩컴포넌트", "튜토리얼"]
---

# 중첩 컴포넌트와 블록 자식

v2의 핵심 기능 중 하나는 **컴포넌트 안에 블록 레벨 마크다운**을 넣을 수 있다는 것입니다.

## Step 컴포넌트로 튜토리얼 만들기

<Step number={1} title="프로젝트 초기화">

새 프로젝트를 만들고 패키지를 설치합니다.

\`\`\`bash
mkdir my-blog-converter
cd my-blog-converter
npm init -y
npm install @jjlabsio/md-to-naver-blog
\`\`\`

</Step>

<Step number={2} title="컴포넌트 정의">

블로그에서 사용할 컴포넌트를 정의합니다.

\`\`\`javascript
const components = {
  Callout: (props, children) => {
    const colors = { info: '#e3f2fd', warning: '#fff3e0' };
    const bg = colors[props.type] || '#f5f5f5';
    return \\\`<div style="background:\${bg}; padding:16px;">\${children}</div>\\\`;
  }
};
\`\`\`

<Callout type="tip">
컴포넌트 렌더러는 순수 함수로, HTML 문자열을 반환합니다.
</Callout>

</Step>

<Step number={3} title="변환 실행">

마크다운을 HTML로 변환합니다.

\`\`\`javascript
import { convert } from "@jjlabsio/md-to-naver-blog";

const result = convert(markdown, { components });
// result.html → 변환된 HTML
// result.title → 추출된 제목
// result.frontmatter → YAML 메타데이터
\`\`\`

변환 결과의 HTML을 네이버 블로그 에디터에 붙여넣으면 됩니다.

</Step>

## 중첩 깊이와 컨텍스트

컴포넌트는 여러 단계로 중첩할 수 있으며, 각 컴포넌트는 자신의 **depth**와 **parent** 정보를 받습니다.

<Callout type="info">

이것은 **1단계** Callout입니다.

<Callout type="warning">

이것은 **2단계** 중첩 Callout입니다. 부모 컴포넌트 안에서 들여쓰기됩니다.

</Callout>

</Callout>

## 컴포넌트와 테이블 조합

<Callout type="info">

아래 표는 Callout 안에 포함된 마크다운 테이블입니다.

| 속성 | 타입 | 설명 |
|------|------|------|
| type | string | 콜아웃 유형 (info, warning, tip, danger) |
| title | string | 선택적 제목 |

</Callout>
`;

export const ERROR_HANDLING_MARKDOWN = `---
tags: ["MDX", "에러처리", "v2"]
---

# 에러 처리 데모

v2는 MDX 파싱 중 오류가 발생해도 **변환을 중단하지 않습니다**. 잘못된 부분만 표시하고 나머지는 정상 변환합니다.

## 정상 변환되는 부분

이 문단은 정상적으로 변환됩니다. **볼드**와 *이탤릭*도 잘 됩니다.

<Callout type="info">
이 Callout은 정상적으로 렌더링됩니다.
</Callout>

## 닫히지 않은 태그

아래는 닫는 태그가 없는 컴포넌트입니다. 에러 배너에 경고가 표시되지만 다른 콘텐츠는 정상 변환됩니다.
아래 태그 뒤에 \`</Callout>\`을 직접 추가해보세요 — 에러 배너가 사라지고 정상 변환되는 것을 확인할 수 있습니다.

<Callout type="warning">
이 태그는 닫히지 않았습니다.

## 이후 콘텐츠

위의 오류에도 불구하고, **이 부분은 정상적으로 변환**됩니다.

> 에러가 있어도 작성을 계속할 수 있습니다.
> 에러 배너에서 문제를 확인하고 수정하면 됩니다.

<Callout type="tip">
에러 배너의 화살표를 클릭하면 상세 오류 목록을 확인할 수 있습니다.
</Callout>
`;

export type ExampleKey =
  | "basic"
  | "jsx-components"
  | "nested-components"
  | "error-handling";

export interface ExampleEntry {
  label: string;
  value: ExampleKey;
  markdown: string;
}

export const EXAMPLES: ExampleEntry[] = [
  { label: "기본 마크다운", value: "basic", markdown: DEFAULT_MARKDOWN },
  {
    label: "JSX 컴포넌트",
    value: "jsx-components",
    markdown: JSX_COMPONENTS_MARKDOWN,
  },
  {
    label: "중첩 컴포넌트",
    value: "nested-components",
    markdown: NESTED_COMPONENTS_MARKDOWN,
  },
  {
    label: "에러 처리 예시",
    value: "error-handling",
    markdown: ERROR_HANDLING_MARKDOWN,
  },
];
