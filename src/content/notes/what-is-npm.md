---
title: npm이 뭔가, 어떻게 쓰나
date: "2026-08-19"
excerpt: Node 패키지 설치 도구. Astro 7.2 공식 CLI·업그레이드 명령을 이 저장소 기준으로 정리.
kicker: 도구
tags: ["npm", "Astro"]
---

**npm**은 Node.js와 같이 오는 **패키지 설치 도구**다. 이 사이트의 Astro도 npm으로 깐다.

공식 문서도 설치·실행을 npm 기준으로 적는다. ([Astro 설치](https://docs.astro.build/ko/install-and-setup/), [CLI](https://docs.astro.build/ko/reference/cli-reference/))

npm 자체 설명: [docs.npmjs.com](https://docs.npmjs.com/)

페이지를 고치는 전체 흐름은 [페이지 올리고 고치는 법](/notes/how-to-post/)에 있다. 이 글은 **명령만** 깊게 적는다.

---

## Node와 npm

Node.js를 설치하면 `node`와 `npm`이 같이 생긴다. 터미널에서 확인:

```bash
node -v
npm -v
```

Astro 7 공식 사전 준비:

- **Node.js v22.12.0 이상**
- **v23 같은 홀수 메이저는 지원하지 않는다**

출처: [Astro 설치 — 사전 준비 사항](https://docs.astro.build/ko/install-and-setup/)

이 저장소는 `.nvmrc`가 `22.12.0`이고, GitHub Actions도 `node-version: "22.12"`다. `package.json`의 `engines.node`도 `>=22.12.0`.

작업은 항상 이 폴더에서 한다.

```bash
cd /Users/akanus/orca/workspaces/design-page/alzza.github.io
```

공식 문서도 Astro를 **전역이 아니라 프로젝트에** 깔라고 한다. `npm install -g astro` 하지 않는다.

---

## 이 폴더에 있는 파일

| 파일 | 역할 |
|---|---|
| `package.json` | 패키지 이름·버전, `scripts` |
| `package-lock.json` | 그때 깐 정확한 버전. `npm ci`가 이걸 따른다. Pages 배포에도 커밋해야 한다 ([GitHub Pages](https://docs.astro.build/ko/guides/deploy/github/)) |
| `node_modules/` | 실제로 깔린 코드. git에 안 올린다 |
| `.nvmrc` | 로컬 Node 버전 힌트 |

지금 `package.json`의 핵심:

```json
{
  "type": "module",
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "astro dev --port 4321",
    "build": "astro build",
    "preview": "astro preview --port 4321"
  },
  "dependencies": {
    "astro": "^7.2.3"
  }
}
```

`^7.2.3` 은 7.2.3 이상, 8 미만의 패치·마이너를 허용한다는 npm 범위다. 실제로 깐 정확한 숫자는 `package-lock.json`과 `npm ls astro`로 본다.

`npm run` 뒤에 오는 이름은 `scripts`다. 공식 CLI는 `npx astro dev`처럼도 돌릴 수 있다. 이 사이트는 `npm run …`만 쓰면 된다.

npm이 스크립트에 플래그를 넘기려면 `--`가 한 번 더 필요하다. 예: `npm run dev -- --help` ([CLI](https://docs.astro.build/ko/reference/cli-reference/))

---

## 자주 쓰는 명령

| 명령 | 하는 일 |
|---|---|
| `npm install` | `package.json`을 보고 `node_modules/`에 깐다. 처음, 또는 lock이 바뀐 뒤 |
| `npm ci` | lock **그대로** 깐다. Actions 배포가 이걸 씀 |
| `npm run dev` | [`astro dev`](https://docs.astro.build/ko/reference/cli-reference/#astro-dev). http://localhost:4321 |
| `npm run build` | [`astro build`](https://docs.astro.build/ko/reference/cli-reference/#astro-build). `dist/`에 HTML |
| `npm run preview` | [`astro preview`](https://docs.astro.build/ko/reference/cli-reference/#astro-preview). 구운 결과만. 프로덕션용이 아니다 |
| `npx astro --help` | CLI 전체 도움말 |
| `npx astro --version` | 이 프로젝트 Astro 버전 |
| `npm ls astro` | 지금 깔린 Astro 버전 |
| `npm view astro version` | npm 레지스트리에 올라온 최신 버전 |
| `npx @astrojs/upgrade` | 공식 업그레이드 도구 ([v7 가이드](https://docs.astro.build/ko/guides/upgrade-to/v7/)) |

`npx`는 **한 번 실행하는 도구**다. 전역 설치 없이 `@astrojs/upgrade` 같은 걸 돌린다.

개발 서버가 떠 있으면:

- `o` + Enter — 브라우저 열기
- `s` + Enter — 콘텐츠 레이어 동기화 (노트 스키마·타입)
- `q` + Enter — 종료

Astro 7부터 `astro dev --background` 로 백그라운드 서버를 띄울 수 있다. AI 도구가 돌릴 때 자동으로 붙기도 한다. 사람이 로컬에서 볼 때는 그냥 `npm run dev`면 된다.

콘텐츠가 캐시에 남아 이상하면:

```bash
npx astro dev --force
```

`--force`는 콘텐츠 레이어 캐시를 지우고 다시 읽는다. ([CLI `--force`](https://docs.astro.build/ko/reference/cli-reference/#--force-string))

환경을 이슈에 붙일 때:

```bash
npx astro info
```

---

## 이 사이트를 Astro 7.2로 올린 명령

공식 안내 ([v7로 업그레이드](https://docs.astro.build/ko/guides/upgrade-to/v7/)):

```bash
cd /Users/akanus/orca/workspaces/design-page/alzza.github.io
npx @astrojs/upgrade
```

터미널이 “breaking changes. Continue?”를 물으면 **Yes**. 질문이 멈추거나 버전이 안 바뀌면 버전을 직접 깐다.

```bash
npm install astro@7.2.3
npm run build
```

노트 글 목록은 옛 방식(`type: "content"`)이 7에서 안 된다. `src/content.config.ts`를 `glob()` 로더로 바꿨고, 글 주소는 `slug` 대신 `id`를 쓴다. 자세한 표는 [페이지 올리고 고치는 법](/notes/how-to-post/)의 “5에서 7로 바뀐 것”.

올린 뒤 확인:

```bash
npm ls astro
npm view astro version
node -v
```

`ls`가 `astro@7.2.3`이면 그때 최신 줄이었다. 나중에 숫자가 더 커졌는지는 `npm view astro version`으로 본다.

7에서 손대지 않은 것: Vite 플러그인, remark/rehype, `@astrojs/db`, 테마 npm 패키지. 의존성은 여전히 `astro` 하나다.

---

## 새 프로젝트를 만들 때 (참고)

이 사이트는 이미 있다. 빈 폴더에서 처음부터라면 공식은 이것이다.

```bash
npm create astro@latest
```

테마/예제 복사:

```bash
npm create astro@latest -- --template <example-name>
```

테마 목록: [astro.build/themes](https://astro.build/themes/)  
설치 마법사: [설치](https://docs.astro.build/ko/install-and-setup/)

이미 있는 이 저장소에 테마를 “설치해서 스킨만 갈아끼는” 명령은 없다.

---

## 하면 안 되는 것

- `node_modules/`를 커밋하지 않는다
- 루트에 HTML을 직접 올려 배포하지 않는다. `npm run build`의 `dist/`만 Pages로 간다
- 아무 폴더에서 `npm install astro` 하지 않는다. **이 사이트 폴더**에서 한다
- `npm install -g astro`로 전역 설치할 필요 없다
- 공식 미지원 Node(23 같은 홀수)로 빌드하지 않는다

패키지를 새로 넣을 때:

```bash
npm install 패키지이름
```

지금은 Astro만 있으면 된다. Tailwind, React 같은 걸 넣기 전에는 이유를 정하고 넣는다. 공식 통합은 `npx astro add …` 도 있다. ([CLI `astro add`](https://docs.astro.build/ko/reference/cli-reference/#astro-add))

---

## 막혔을 때

| 증상 | 먼저 볼 것 |
|---|---|
| `npm: command not found` | Node.js 설치. https://nodejs.org/ |
| `astro: command not found` | 폴더에서 `npm install`. 전역이 아니라 `npx astro` 또는 `npm run` |
| Node가 22.12 미만 | Astro 7이 거부한다. nvm이면 `nvm use` |
| `dev`가 안 뜸 | 이미 4321을 쓰는지. 끄고 다시 `npm run dev` |
| 노트 스키마 에러 | `src/content.config.ts`와 md 맨 위 칸이 맞는지. 서버 재시작 또는 `s` + Enter |
| 닫히지 않은 태그 | Astro 7 Rust 컴파일러. `.astro`에서 `</p>` 같은 닫는 태그 ([v7](https://docs.astro.build/ko/guides/upgrade-to/v7/)) |
| 빌드 실패 | 터미널 에러. Actions면 GitHub **Actions** 탭 |
| 글이 안 바뀜 | `npx astro dev --force` 로 콘텐츠 캐시 지우기 |

라이브 반영은 여전하다. `main`에 푸시하면 Actions가 `npm ci` → `npm run build` → `dist/` 배포.
