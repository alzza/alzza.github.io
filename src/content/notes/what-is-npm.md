---
title: npm이 뭔가, 어떻게 쓰나
date: "2026-08-19"
excerpt: Node 패키지 설치 도구. 이 사이트에서 쓰는 명령만 정리.
---

**npm**은 Node.js와 같이 오는 **패키지 설치 도구**다. 이 사이트의 Astro도 npm으로 깐다.

Node.js를 설치하면 `node`와 `npm`이 같이 생긴다. 터미널에서 확인:

```bash
node -v
npm -v
```

Astro 7은 **Node 22.12 이상**이 필요하다. 이 저장소 GitHub Actions도 Node 22를 쓴다.

작업은 항상 이 폴더에서 한다.

```bash
cd /Users/akanus/orca/workspaces/design-page/alzza.github.io
```

---

## 이 폴더에 있는 파일

| 파일 | 역할 |
|---|---|
| `package.json` | 이 사이트가 쓰는 패키지 이름과 버전, 실행 명령 |
| `package-lock.json` | 그때 깐 정확한 버전. `npm ci`가 이걸 따른다 |
| `node_modules/` | 실제로 깔린 코드. git에 안 올린다 |

`package.json`의 `dependencies`에 `"astro": "..."`가 있으면 Astro를 쓴다는 뜻이다.

---

## 자주 쓰는 명령

| 명령 | 하는 일 |
|---|---|
| `npm install` | `package.json`을 보고 패키지를 `node_modules/`에 깐다. 처음, 또는 lock이 바뀐 뒤 |
| `npm ci` | lock 그대로 깐다. Actions 배포가 이걸 씀. 로컬에서 맞출 때도 가능 |
| `npm run dev` | 로컬 미리보기. http://localhost:4321 |
| `npm run build` | `dist/`에 완성 HTML을 굽는다 |
| `npm run preview` | 구운 `dist/`를 로컬에서 연다. 라이브와 가장 비슷 |
| `npm ls astro` | 지금 깔린 Astro 버전 |
| `npm view astro version` | npm에 올라온 최신 Astro 버전 |
| `npx @astrojs/upgrade` | Astro를 공식 도구로 올린다. 이 사이트를 7.2로 올릴 때 쓴 명령 |

`npm run` 뒤에 오는 이름은 `package.json`의 `scripts`다. `dev`, `build`, `preview`가 여기에 있다.

`npx`는 **한 번 실행하는 도구**다. 전역으로 설치하지 않고 `@astrojs/upgrade` 같은 걸 돌린다.

---

## 이 사이트를 Astro 7.2로 올린 명령

공식 안내:

```bash
cd /Users/akanus/orca/workspaces/design-page/alzza.github.io
npx @astrojs/upgrade
```

터미널이 “breaking changes. Continue?”를 물으면 **Yes**. 질문이 멈추거나 버전이 안 바뀌면 버전을 직접 깐다.

```bash
npm install astro@7.2.3
npm run build
```

노트 글 목록은 옛 방식(`type: "content"`)이 7에서 안 된다. 그래서 `src/content.config.ts`를 `glob()` 로더로 바꿨다. 글 주소는 `slug` 대신 `id`를 쓴다.

올린 뒤 확인:

```bash
npm ls astro
npm view astro version
```

`ls`가 `astro@7.2.3`이면 지금 최신 줄이다.

---

## 하면 안 되는 것

- `node_modules/`를 커밋하지 않는다
- 루트에 HTML을 직접 올려 배포하지 않는다. `npm run build`의 `dist/`만 Pages로 간다
- 아무 폴더에서 `npm install astro` 하지 않는다. **이 사이트 폴더**에서 한다
- `npm install -g astro`로 전역 설치할 필요 없다. 이 프로젝트 `dependencies`면 충분하다

패키지를 새로 넣을 때:

```bash
npm install 패키지이름
```

지금은 Astro만 있으면 된다. Tailwind 같은 걸 넣기 전에는 이유를 정하고 넣는다.

---

## 막혔을 때

| 증상 | 먼저 볼 것 |
|---|---|
| `npm: command not found` | Node.js 설치. https://nodejs.org/ |
| `astro: command not found` | 폴더에서 `npm install` |
| `dev`가 안 뜸 | 이미 4321을 쓰는지. 끄고 다시 `npm run dev` |
| 빌드 실패 | 터미널 에러. Actions면 GitHub **Actions** 탭 |

라이브 반영은 여전하다. `main`에 푸시하면 Actions가 `npm ci` → `npm run build` → `dist/` 배포.
