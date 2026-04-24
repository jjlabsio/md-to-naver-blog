# @jjlabsio/md-to-naver-blog

## 2.0.0

### Breaking Changes

- **파서 교체**: 자체 정규식 파서를 `unified + remark-parse + remark-gfm + remark-mdx` 기반 mdast 파이프라인으로 교체. 대부분의 입력에서 동일한 출력을 생성하나, 일부 edge case에서 미묘한 차이가 발생할 수 있음.
- **`ComponentRenderer` 시그니처 확장**: `(props, children)` -> `(props, children, ctx?)`. 기존 2-arg renderer는 그대로 동작 (ctx는 optional).
- **`ComponentProps` 타입 변경**: `Record<string, string>` -> `Record<string, string | number | boolean | null>`. literal attribute를 원시 타입으로 평가.
- **`ConvertResult.errors` 필드 추가**: 파싱 에러 시 throw 대신 `errors: ParseError[]` 배열로 수집. `html`은 best-effort로 반환.

### New Features

- **JSX children block-level 재귀 렌더링**: `<Step>`, `<Callout>` 등 컨테이너 컴포넌트 안에 표, 리스트, 코드블록, 중첩 컴포넌트를 자유롭게 배치 가능.
- **`ComponentRenderCtx`**: renderer의 세 번째 인자로 `{ depth, index, parent }` 컨텍스트 전달.
- **에러 배너 UI (apps/web)**: MDX 파싱 에러 시 에디터 상단에 경고 배너 표시.
- **graceful fallback**: 닫히지 않은 태그, runtime expression, import/export 구문을 throw 없이 처리.

## 1.5.3

### 🔥 Performance

- **web:** Worker + block diff로 타이핑 렉 해소 + parseBlocks 무한루프 수정 ([#17](https://github.com/jjlabsio/md-to-naver-blog/pull/17))

## 1.5.2

### 🏡 Chore

- Ignore .claude/ local settings directory ([20f560b](https://github.com/jjlabsio/md-to-naver-blog/commit/20f560b))

## 1.5.1

### 🩹 Fixes

- Use package@version convention for release tags and names ([#14](https://github.com/jjlabsio/md-to-naver-blog/pull/14))
- **core:** 중첩 불릿 리스트 중복 제거 + 네이버 SmartEditor 포맷 적용 ([#15](https://github.com/jjlabsio/md-to-naver-blog/pull/15), [#16](https://github.com/jjlabsio/md-to-naver-blog/pull/16))

## 1.5.0

### 🚀 Enhancements

- 클립보드 유틸 함수 및 CLI preview 명령어 추가 ([#12](https://github.com/jjlabsio/md-to-naver-blog/pull/12))

## 1.4.0

### 🚀 Enhancements

- **core:** Convert()에 components 옵션 추가 ([#11](https://github.com/jjlabsio/md-to-naver-blog/pull/11))

## 1.3.0

### 🚀 Enhancements

- **web:** UI 개선 및 다크모드 제거 ([#9](https://github.com/jjlabsio/md-to-naver-blog/pull/9))
- **core:** Add frontmatter return and transformUrl option ([#10](https://github.com/jjlabsio/md-to-naver-blog/pull/10))

## 1.2.0

### 🚀 Enhancements

- **web:** Vercel Analytics 추가 ([#8](https://github.com/jjlabsio/md-to-naver-blog/pull/8))

## 1.1.1

### 🩹 Fixes

- **core:** README 오탈자 수정

### 📖 Documentation

- Core README 추가 및 패키지명 @jjlabsio 스코프로 업데이트

## 1.1.0

### 🚀 Enhancements

- **mono-setup:** Pnpm + Turborepo 모노레포 구조 세팅 ([#1](https://github.com/jjlabsio/md-to-naver-blog/pull/1))
- **core:** Markdown → 네이버 블로그 HTML 변환 로직 구현 ([#3](https://github.com/jjlabsio/md-to-naver-blog/pull/3))
- **core:** YAML syntax highlighting 추가 및 soft line break 처리 ([#4](https://github.com/jjlabsio/md-to-naver-blog/pull/4))
- **web-app:** 마크다운 → 네이버 블로그 HTML 변환 웹 앱 ([#5](https://github.com/jjlabsio/md-to-naver-blog/pull/5))

## 1.0.1

### Patch Changes

- 패키지명을 `md-to-naver-blog`에서 `@jjlabsio/md-to-naver-blog`로 변경하고 GitHub repository 링크를 추가했습니다.

## 1.0.0

### Major Changes

- Initial release
