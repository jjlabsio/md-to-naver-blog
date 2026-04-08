# md-to-naver-blog

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
npm install md-to-naver-blog
# or
pnpm add md-to-naver-blog
```

## 사용법

```ts
import { convert } from "md-to-naver-blog";

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

- 실시간 미리보기
- "서식 복사" 버튼으로 클립보드에 HTML 복사
- 다크모드 지원

## 모노레포 구조

```
md-to-naver-blog/
├── packages/
│   └── core/       # 변환 라이브러리 (npm 배포)
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
5. changeset을 추가합니다. (패키지 버전에 영향을 주는 변경인 경우)
   ```bash
   pnpm changeset
   ```
6. Pull Request를 엽니다. PR 설명에 변경 이유와 테스트 방법을 적어주세요.

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
