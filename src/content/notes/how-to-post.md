---
title: 페이지 올리고 고치는 법
date: "2026-08-19"
excerpt: Astro 7.2 기준. 공식 문서 링크와 이 저장소 폴더를 맞춰 둔 운영 노트.
kicker: 운영
tags: ["운영", "Astro"]
---

보이는 문장은 카톡에 쓰는 말로 쓴다. 쓰지 말 것: 북상, 남하, 북진, 남진, 기점, 종점, 상기, 금회. 대신: 가는 날, 오는 날, 올라가는 길, 내려오는 길, 출발, 도착. 휴게소 간판에 적힌 방향 이름(양평방향, 창원방향)만 예외.

작업 폴더: `/Users/akanus/orca/workspaces/design-page/alzza.github.io`

라이브: https://alzza.github.io/

`main`에 푸시하면 GitHub Actions가 `npm ci` → `npm run build` → `dist/` 를 Pages에 올린다. HTML을 저장소 루트에 직접 올리지 않는다.

바닐라 HTML 스냅샷은 태그 `vanilla-v1`.  
옆 폴더 `design-page/theme` 는 Next.js 공부용이다. 이 사이트와 무관하다.

지금 쓰는 엔진은 **Astro 7.2.3**. 공식 홈은 [astro.build](https://astro.build/). 한국어 문서는 [docs.astro.build/ko](https://docs.astro.build/ko/).

이 글에서 자주 가리키는 공식 페이지:

- [Astro란?](https://docs.astro.build/ko/concepts/why-astro/)
- [프로젝트 구조](https://docs.astro.build/ko/basics/project-structure/)
- [페이지](https://docs.astro.build/ko/basics/astro-pages/)
- [라우팅](https://docs.astro.build/ko/guides/routing/)
- [콘텐츠 컬렉션](https://docs.astro.build/ko/guides/content-collections/)
- [Markdown](https://docs.astro.build/ko/guides/markdown-content/)
- [설치](https://docs.astro.build/ko/install-and-setup/)
- [CLI](https://docs.astro.build/ko/reference/cli-reference/)
- [GitHub Pages 배포](https://docs.astro.build/ko/guides/deploy/github/)
- [v7 업그레이드](https://docs.astro.build/ko/guides/upgrade-to/v7/)

npm 명령만 따로 보고 싶으면 [npm이 뭔가](/notes/what-is-npm/) 노트를 본다.

---

## Astro가 뭔가

공식 문장은 이렇다. Astro는 **콘텐츠가 많은 웹사이트를 위한 웹 프레임워크**다. 블로그, 마케팅, 문서처럼 글을 미리 HTML로 구워 두면 방문자 브라우저가 할 일이 줄어든다. ([Astro란?](https://docs.astro.build/ko/concepts/why-astro/))

워드프레스처럼 서버에서 글을 받아 그리는 게 아니다. Next.js처럼 방문할 때마다 서버가 페이지를 만드는 것도 아니다. 이 저장소는 어댑터 없이 **정적 출력**만 쓴다. `astro build`가 `dist/`에 HTML·CSS·JS를 남기고, GitHub Pages는 그 파일만 나눠 준다.

이 저장소 의존성은 `astro` 하나다. React 앱이 아니다.

예전에 바닐라 HTML로 페이지를 직접 썼다. 글이 늘면 목록을 손으로 고치고, 헤더와 코드 색을 페이지마다 복사해야 했다. Astro로 바꾼 이유:

- `src/content/notes/`에 md만 넣으면 주소와 목록이 생긴다
- 헤더·테마·CSS는 한곳이다
- 노트 코드는 빌드 때 색이 입혀진 HTML이 박힌다
- 춘천처럼 지도·데이터가 있는 화면은 `.astro` + `chuncheon.ts`로 둔다

방문자 브라우저에는 **이미 만들어진 HTML**이 간다. 테마 토글과 지도 스크립트만 그 위에서 돈다.

### 한 장이 페이지가 되는 과정

```
src/ 에 글·페이지 작성
        ↓
npm run dev      로컬에서 바로 보기  (http://localhost:4321)
        ↓
git push main
        ↓
GitHub Actions  →  npm ci  →  npm run build  →  dist/ 생성
        ↓
GitHub Pages가 dist/ 를 라이브에 올림
```

| 명령 | 공식 대응 | 역할 |
|---|---|---|
| `npm run dev` | [`astro dev`](https://docs.astro.build/ko/reference/cli-reference/#astro-dev) | 고치면서 바로 봄. 포트 4321. 저장하면 브라우저가 갱신된다 |
| `npm run build` | [`astro build`](https://docs.astro.build/ko/reference/cli-reference/#astro-build) | `dist/`에 완성 HTML 굽기 |
| `npm run preview` | [`astro preview`](https://docs.astro.build/ko/reference/cli-reference/#astro-preview) | 구운 `dist/`를 로컬에서 확인. 라이브와 가장 비슷. 프로덕션 서버가 아니다 |

`dev`는 편의를 위한 서버다. 라이브는 `build`의 정적 파일이다.

개발 서버가 떠 있는 터미널에서 `q` + Enter 로 끈다. `s` + Enter 는 콘텐츠 레이어(노트 타입)를 다시 맞춘다. `o` + Enter 는 브라우저를 연다. ([CLI](https://docs.astro.build/ko/reference/cli-reference/))

### `.astro` 파일

HTML 위에 **빌드할 때 한 번 도는 칸**을 붙인 것이다. 위쪽 `---` 안을 공식 문서는 **컴포넌트 프런트매터**라고 부른다. 브라우저에서 돌지 않는다. ([설치 가이드의 첫 페이지 예](https://docs.astro.build/ko/install-and-setup/#수동-설정))

```astro
---
import Base from "../layouts/Base.astro";
const title = "춘천";
---
<Base title={title}>
  <h1>{title}</h1>
</Base>
```

`---` 안은 파일 읽기, 목록 만들기, 좌표 계산. 아래는 HTML이다. `{title}`처럼 값을 끼워 넣는다.

- 공통 뼈대: `src/layouts/Base.astro` (`<slot />`에 본문)
- 조각: `src/components/Header.astro`, `CourseMap.astro`

Astro 7은 **Rust 컴파일러**가 기본이다. 닫히지 않은 태그는 빌드가 실패한다. `<p>` 안에 `<div>` 넣는 잘못된 HTML은 예전처럼 자동으로 고쳐 주지 않는다. ([v7 업그레이드](https://docs.astro.build/ko/guides/upgrade-to/v7/))

### 주소는 폴더가 정한다

공식 규칙: `src/pages/` 아래 경로가 URL이다. `index.astro`는 그 폴더의 `/`. `[id].astro`처럼 대괄호는 **동적 라우트**. ([페이지](https://docs.astro.build/ko/basics/astro-pages/), [라우팅](https://docs.astro.build/ko/guides/routing/))

| 파일 | 주소 |
|---|---|
| `src/pages/index.astro` | `/` |
| `src/pages/notes/index.astro` | `/notes/` |
| `src/pages/notes/[id].astro` | `/notes/how-to-post/` 처럼 글마다 |
| `src/pages/chuncheon/index.astro` | `/chuncheon/` |
| `src/pages/chuncheon/map.astro` | `/chuncheon/map/` |
| `src/pages/info/index.astro` | `/info/` 긱뉴스 RSS 20개 |

`[id].astro`는 빌드할 때 md 수만큼 HTML을 만든다. 방문자가 들어올 때 글을 찾아 그리는 게 아니다.

`public/theme.js`는 가공 없이 `/theme.js`로 나간다. 이미지도 `public/`에 두고 `/파일명`으로 링크한다. ([프로젝트 구조](https://docs.astro.build/ko/basics/project-structure/))

이 저장소 이름은 `alzza.github.io`라서 Pages 주소가 사이트 루트다. 공식 GitHub 배포 가이드의 `base: '/my-repo'` 는 **여기선 안 쓴다**. 그 설정은 `https://이름.github.io/저장소명/` 형태일 때만 필요하다. ([GitHub Pages](https://docs.astro.build/ko/guides/deploy/github/))

### Astro가 아닌 것

- 게시판 CMS가 아니다. 관리자 화면, 로그인 글쓰기, DB가 없다. **파일 = 글**이다.
- 실시간 데이터가 기본이 아니다. 네이버/카카오 “지금 뜨는 곳”을 매일 받아오려면 서버가 따로 필요하다. 공식 **라이브 컬렉션**도 온디맨드 어댑터가 있어야 한다. 이 사이트는 쓰지 않는다.
- 목록은 빌드 때 이미 HTML이다. 방문자 PC에서 조립하지 않는다.

---

## 5에서 7로 바뀐 것 (이 저장소)

옛 5.x는 컬렉션을 `type: "content"`로 두고 `slug`로 주소를 잡았다. **7에서는 그 방식이 없다.** 콘텐츠 레이어의 `glob()` 로더와 `id`를 쓴다. ([콘텐츠 컬렉션](https://docs.astro.build/ko/guides/content-collections/))

| 옛 5 | 지금 7.2 |
|---|---|
| 컬렉션 정의에 `type: "content"` | `loader: glob({ pattern, base })` |
| 글 주소 `note.slug` | `note.id` (파일 이름) |
| `note.render()` | `render(note)` (`astro:content`) |
| 페이지 `src/pages/notes/[slug].astro` | `src/pages/notes/[id].astro` |
| 자동 생성 `src/env.d.ts` | 지움. 타입은 `.astro/types.d.ts` (`astro sync`) |
| Node 18 가능 | **Node 22.12 이상**. 홀수 메이저(23)는 공식 미지원 ([설치](https://docs.astro.build/ko/install-and-setup/)) |
| Markdown remark 파이프라인 기본 | 7은 [Sätteri](https://satteri.bruits.org/) 기본. remark 플러그인을 안 쓰면 손댈 것 없음 |

페이지 폴더 모양(`src/pages`, `src/layouts`, `src/components`, `public/`)은 그대로다. 홈 타일, 춘천 `.astro`, `chuncheon.ts`, 커스텀 CSS도 그대로다.

7에서 기본이 된 것 중 이 사이트와 관계없는 것: Vite 8, `src/fetch.ts` 예약 이름(우리는 그 파일 없음), `compressHTML: 'jsx'`(인라인 태그 사이 공백이 붙을 수 있음). 컨테이너 API, `@astrojs/db`, View Transitions 내부 API는 안 쓴다.

---

## 폴더 한눈에

공식 [프로젝트 구조](https://docs.astro.build/ko/basics/project-structure/)와 이 저장소를 맞춰 보면:

| 경로 | 역할 |
|---|---|
| `src/content/notes/*.md` | 노트 글. 파일 이름 = `id` = 주소 |
| `src/content.config.ts` | 컬렉션 정의. `glob` + Zod `schema` (`title` `date` `excerpt`) |
| `src/lib/notes.ts` | 홈 Notes와 `/notes/` 목록. 춘천처럼 md가 아닌 페이지만 `extra` |
| `src/pages/index.astro` | 메인. 프로젝트 타일 |
| `src/pages/notes/index.astro` | 노트 목록 |
| `src/pages/notes/[id].astro` | 노트 본문 틀. `getStaticPaths` + `render`. 보통 안 고친다 |
| `src/pages/chuncheon/index.astro` | 춘천 일정 |
| `src/pages/chuncheon/map.astro` | 큰 지도 |
| `src/data/chuncheon.ts` | 장소·좌표·출처·코스 |
| `src/components/Header.astro` | 상단 로고, 링크, 테마 버튼 |
| `src/components/CourseMap.astro` | 일정 글에 박힌 작은 지도 |
| `src/layouts/Base.astro` | 공통 HTML, 라이트 기본 |
| `src/styles/global.css` | 색, 보더, 카드. 커스텀 CSS |
| `public/theme.js` | 해/달 토글, 맨 위로 |
| `astro.config.mjs` | `site`, Shiki `github-dark` |
| `package.json` | `astro ^7.2.3`, `engines.node >=22.12.0` |
| `.nvmrc` | `22.12.0` |
| `.github/workflows/pages.yml` | Node 22.12, `npm ci`, RSS 받기, `npm run build`, `dist` 업로드. 한 시간에 한 번도 돈다 |
| `scripts/fetch-geeknews.mjs` | 긱뉴스 RSS 20개를 `src/data/geeknews.json`에 씀 |
| `src/pages/info/index.astro` | `/info/` 정보 목록 |

컬렉션 md는 `src/pages/` **밖**에 둔다. 공식 문서대로, 컬렉션만으로는 URL이 안 생긴다. `[id].astro`가 경로를 만든다.

---

## 로컬에서 보기

공식 요구: Node **v22.12.0 이상**, 짝수 LTS. ([설치](https://docs.astro.build/ko/install-and-setup/))

```bash
cd /Users/akanus/orca/workspaces/design-page/alzza.github.io
git checkout main
git pull
node -v
npm install
npm run dev
```

브라우저: http://localhost:4321

- 홈: `/`
- 노트 목록: `/notes/`
- 이 글: `/notes/how-to-post/`
- 춘천: `/chuncheon/`
- 지도: `/chuncheon/map/`

글만 고쳤는데 안 바뀌면 터미널에서 서버를 끄고(`q` 또는 `Ctrl+C`) 다시 `npm run dev`. 스키마(`content.config.ts`)를 바꿨으면 개발 서버를 다시 켜거나 터미널에서 `s` + Enter.

구운 결과만 보고 싶으면 `npm run build` 다음 `npm run preview`.

---

## 노트 하나 올리기

노트는 **빌드 타임 콘텐츠 컬렉션**이다. 로컬 Markdown을 `glob()`으로 읽고, 빌드할 때 HTML로 굽는다. CMS·DB에서 실시간으로 가져오지 않는다. ([콘텐츠 컬렉션](https://docs.astro.build/ko/guides/content-collections/))

정의는 `src/content.config.ts`:

```ts
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const notes = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/notes" }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    excerpt: z.string(),
  }),
});

export const collections = { notes };
```

`[^_]*` 는 `_로 시작하는 파일`을 빼는 패턴이다. 밑줄로 시작하는 md는 글이 아니다.

본문을 HTML로 그리는 페이지는 `src/pages/notes/[id].astro`. 공식 “정적 출력을 위한 빌드” 예와 같다.

```ts
export async function getStaticPaths() {
  const notes = await getCollection("notes");
  return notes.map((note) => ({
    params: { id: note.id },
    props: { note },
  }));
}
const { Content } = await render(note);
```

목록 정렬은 `src/lib/notes.ts`의 `listNotes()`가 날짜 내림차순으로 한다. `getCollection()` 순서는 공식 문서대로 플랫폼마다 다를 수 있어서 **우리가 직접 정렬**한다.

1. `src/content/notes/` 에 Markdown을 만든다. **파일 이름 = `id` = URL**
   - `hello.md` → https://alzza.github.io/notes/hello/
2. 맨 위 frontmatter는 스키마와 같아야 한다. `title` `date` `excerpt` 세 칸. 날짜는 따옴표 있는 `"YYYY-MM-DD"`.
3. 본문은 일반 Markdown. 코드는 언어 이름 fence. 7의 기본 Markdown은 GitHub Flavored Markdown이다. ([Markdown](https://docs.astro.build/ko/guides/markdown-content/))
4. `npm run dev` 로 확인한다.
5. `main`에 커밋하고 푸시한다.
6. 홈 Notes와 `/notes/` 는 `listNotes()`가 같이 읽는다. 목록에 손으로 한 줄 넣지 않는다.

예시 `src/content/notes/hello.md`:

```md
---
title: 첫 노트
date: "2026-08-19"
excerpt: 목록에 보일 한 줄
kicker: 운영
tags: ["운영"]
---

본문. 인라인 코드는 `pio run` 처럼 쓴다.
```

코드 블록은 이렇게 언어를 붙인다.

````
```python
print("ok")
```

```cpp
int main() { return 0; }
```
````

색은 `astro.config.mjs`의 Shiki `github-dark`. 테마 토큰 노트도 같이 본다: [/notes/theme-tokens/](/notes/theme-tokens/)

### 수정 / 삭제

| 하고 싶은 일 | 하는 일 |
|---|---|
| 본문 | 그 md를 고친다 |
| 제목·날짜·한 줄 | 파일 맨 위 `title` `date` `excerpt` |
| 주소 | **파일 이름**을 바꾼다. 옛 주소는 끊긴다 |
| 삭제 | 파일을 지운다 |
| 춘천처럼 md가 아닌 페이지를 목록에 | `src/lib/notes.ts` 의 `extra` |

홈에만 빼고 목록에만 넣는 필터는 없다. md를 만들면 홈과 목록에 둘 다 뜬다.

노트 본문 아래에는 [Giscus](https://giscus.app/ko) 댓글이 붙는다. GitHub 로그인이 필요하고, 글은 저장소 **Discussions / Announcements**에 쌓인다. 페이지와 글은 URL 경로(`pathname`)로 맞춘다. 바깥 상자는 사이트 카드와 같고, iframe 안 색은 `public/giscus-light.css` / `giscus-dark.css`다. 해/달 토글은 댓글 테마도 같이 바꾼다. 홈·춘천·지도에는 없다.

`_`로 시작하는 파일은 `glob` 패턴 때문에 컬렉션에 안 들어간다.

공식 문서의 `slug:` 프런트매터로 `id`를 바꾸는 기능은 있다. 이 사이트는 **파일 이름 = 주소**로 고정한다. 헷갈리니 노트에 `slug:` 칸을 넣지 않는다.

---

## 홈 프로젝트 타일

파일: `src/pages/index.astro`

```html
<a class="card fill-yellow" href="https://github.com/alzza/t2-can-board">
  <span class="kicker">Tesla / CAN</span>
  <h2>t2-can-board</h2>
  <p>한 줄 설명.</p>
  <span class="go">GitHub →</span>
</a>
```

- 우리 사이트의 페이지가 있으면 `href`를 그 주소로, 문구는 `페이지 열기 →`
- GitHub만 있으면 저장소 URL, `GitHub →`
- 색: `fill-paper` `fill-yellow` `fill-pink` `fill-blue`

타일은 노트가 아니다. 자동으로 안 생긴다.

---

## 춘천 일정 / 지도

기본은 **울산 → 엘리시안 강촌** 한 줄이다. 들를 곳과 충전은 그 선 위에 얹는다. 워터 전용 / 슈퍼차저 전용 코스는 쓰지 않는다.

- 일정 글: `src/pages/chuncheon/index.astro`
- 지도: `src/pages/chuncheon/map.astro` (탭: 기본, 가는 날, 남이섬, 오는 날, 30곳, 충전)
- 좌표·출처·코스: `src/data/chuncheon.ts`

30곳은 각 칸에 **카카오**와 **원문**이 있다. 원문은 시·공사·공식 페이지다. SNS에서 가져온 내용은 원문 없이 넣지 않는다.

길찾기는 **카카오맵** URL이다. (`map.kakao.com/link/by/car/...`) 네이버 URL을 다시 넣지 않는다.

지도 위 카카오 타일을 쓰려면 JavaScript 키가 필요하다. 없어도 마커(OSM 폴백)와 카카오 길찾기 버튼은 동작한다. 키를 쓰려면 [developers.kakao.com](https://developers.kakao.com) 에서 앱을 만들고 JavaScript 키를 받은 뒤, 도메인에 `http://localhost:4321` 과 `https://alzza.github.io` 를 등록한다. 로컬은 `.env` 에 `PUBLIC_KAKAO_JS_KEY=키` . 라이브는 GitHub 저장소 Secrets에 같은 이름으로 넣고 Actions가 빌드에 넣게 한다.

네이버·카카오·티맵의 “지금 뜨는 곳”, 트렌드랭킹, 인기시간대는 **앱 화면**이다. 공식 API로 이 사이트에 실시간으로 붙일 수 없다. 랭킹을 일정에 넣으려면 앱에서 보고 날짜를 찍어 손으로 `chuncheon.ts`에 적는다.

---

## 테마. 커스텀 CSS가 맞다

[astro.build/themes](https://astro.build/themes/) 의 “테마”는 **시작용 저장소 복사**다. CSS 스킨을 npm으로 갈아끼는 게 아니다. 이 사이트는 테마 패키지가 아니다. `src/styles/global.css` 에 neubrutalism 문법을 직접 적은 것이다.

- 라이트 기본. 다크는 오른쪽 위 달을 눌러 `localStorage.theme=dark` 일 때만
- 토큰: 파일 맨 위 `:root` 와 `[data-theme="dark"]`
- 해/달, 맨 위로: `public/theme.js`
- 노트 코드 하이라이트: Astro Shiki. `astro.config.mjs` 의 `github-dark`

색만 바꾸려면 `:root` 의 `--yellow` `--pink` `--ink` `--bg` 를 고친다. 다른 디자인 시스템으로 갈아타려면 CSS를 크게 다시 쓰는 일이다. 자세한 토큰은 [/notes/theme-tokens/](/notes/theme-tokens/).

---

## 평소에 이렇게

| 하고 싶은 일 | 고치는 파일 |
|---|---|
| 노트 글 | `src/content/notes/이름.md` (`tags` `kicker` 가능) |
| 노트 목록 모듈 | `src/modules/` 검색·카드·게시판을 켜고 끔 |
| 홈 프로젝트 타일 | `src/pages/index.astro` |
| 춘천 일정 문장 | `src/pages/chuncheon/index.astro` |
| 큰 지도 화면 | `src/pages/chuncheon/map.astro` |
| 장소·좌표·출처 | `src/data/chuncheon.ts` |
| 색·보더 | `src/styles/global.css` |
| 상단 막대 | `src/components/Header.astro` |
| 모든 페이지 껍질 | `src/layouts/Base.astro` |
| 사이트 주소·코드 색 | `astro.config.mjs` |
| 노트 칸 규칙 | `src/content.config.ts` |

- 한 글 = 한 md. 목록은 자동.
- `date` 는 `"YYYY-MM-DD"`. 목록 정렬에 쓴다.
- `excerpt` 는 홈/목록 한 줄. 짧게.
- 이미지: `public/` 에 두고 `/파일명` 으로 링크.
- 긴 일정·지도는 노트가 아니라 `chuncheon/` 페이지.
- AI에게 시킬 때: `src/content/notes/제목.md` 에 frontmatter 포함해서 써 달라고 하면 된다. 새 **사이트 페이지**는 허락 없이 만들지 말라고 한다.

---

## 커밋 / 푸시 / Pages

이 저장소는 공식 [withastro/action](https://github.com/withastro/action) 대신, `setup-node` + `npm ci` + `npm run build` + `upload-pages-artifact` 를 직접 쓴다. 이유는 빌드에 `PUBLIC_KAKAO_JS_KEY` 시크릿을 넣어야 해서다. 흐름은 공식 GitHub Pages 가이드와 같다. `site`는 `https://alzza.github.io`. lock 파일은 커밋한다.

```bash
cd /Users/akanus/orca/workspaces/design-page/alzza.github.io
git status
git add -A
git commit -m "Add hello note"
git push origin main
```

Actions가 `npm ci` → `npm run build` → `dist/` 를 Pages에 올린다. 1~2분. 실패하면 GitHub **Actions** 탭.

HTML을 루트에 올리지 않는다.

---

## 롤백 (바닐라)

함부로 `--force` 하지 말 것.

```bash
git checkout main
git reset --hard vanilla-v1
git push --force origin main
```

이후 Pages 설정을 다시 `main` 브랜치 `/` (legacy)로 바꿔야 바닐라 HTML이 바로 뜬다.
