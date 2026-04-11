# @jjlabsio/mtnb

마크다운 파일을 네이버 블로그용 HTML로 변환하고 브라우저에서 미리보기하는 CLI 도구입니다.

변환된 제목, 본문, 태그를 각각 "서식 복사" 버튼으로 클립보드에 복사해 네이버 블로그에 바로 붙여넣을 수 있습니다.

## 설치

```bash
npm install -g @jjlabsio/mtnb
# or
pnpm add -g @jjlabsio/mtnb
```

## 사용법

```bash
mtnb preview post.md
```

브라우저에서 미리보기 페이지가 열립니다.

- **제목** — 텍스트로 복사
- **본문** — 네이버 블로그 서식이 유지되는 HTML로 복사
- **태그** — frontmatter의 `tags` 배열을 `#태그1 #태그2` 형태로 복사

### frontmatter 지원

```md
---
tags: [개발, 자동화]
---

# 글 제목

내용...
```

`tags`는 미리보기 페이지에서 별도 섹션으로 표시되며, 복사 버튼으로 한번에 복사할 수 있습니다.

## 관련 패키지

- [@jjlabsio/md-to-naver-blog](https://www.npmjs.com/package/@jjlabsio/md-to-naver-blog) — 변환 라이브러리 (이 CLI가 내부적으로 사용)
- [mtnb.dev](https://mtnb.dev) — 웹 앱

## 라이선스

MIT
