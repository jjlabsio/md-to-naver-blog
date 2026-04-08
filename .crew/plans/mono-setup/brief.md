# Brief: 모노레포 구조, 빌드, 테스트 환경 세팅

## 유저 요청 원문

옵시디언 spec.md의 개발 순서 1번 항목: "모노레포 구조, 빌드, 테스트 환경 세팅"

## 관련 컨텍스트

### 스펙 문서 (~/obsidian/projects/md-to-naver-blog/spec.md) 요약

**모노레포 구조**:

```
md-to-naver-blog/
├── packages/
│   ├── core/          # 변환 라이브러리 (npm 배포)
│   └── skill/         # 에이전트 스킬 (v2)
└── apps/
    └── web/           # Next.js 웹 앱
```

**모노레포 도구**:

- 패키지 매니저: pnpm
- 모노레포 도구: Turborepo
- npm 패키지명: md-to-naver-blog
- 웹 도메인: mtnb.dev

**배포 자동화**:

- Changesets: 버전 관리 + CHANGELOG 자동 생성
- GitHub Actions: PR 머지 시 CHANGELOG 업데이트 → "Version Packages" PR 생성 → 머지 시 npm 배포 + GitHub Release 생성
- npm 인증: OIDC (OpenID Connect) 방식 사용 — NPM_TOKEN 시크릿 대신 GitHub Actions의 id-token: write 퍼미션과 npm provenance 활용

**packages/core**:

- 입력: Markdown 문자열
- 출력: `{ title: string; html: string }`
- 런타임: Node.js + 브라우저 양쪽 지원 (순수 JS)
- 배포: npm 패키지

**apps/web**:

- Next.js 웹 앱
- 실시간 미리보기: 왼쪽 마크다운 입력 / 오른쪽 네이버 블로그 스타일 미리보기

### 현재 상태

- initial commit만 있는 빈 프로젝트
- v1 스코프에서 skill/ 패키지는 v2이므로 이번에 세팅 불필요
