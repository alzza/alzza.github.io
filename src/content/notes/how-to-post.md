---
title: 페이지 올리고 고치는 법
date: "2026-08-19"
excerpt: 폴더, 노트, 타일, 테마, 로컬 미리보기, 커밋/푸시
---

이 사이트는 **Astro**다. 작업 폴더는 아래다. `theme` 폴더(Next.js 연습)가 아니다.

## 말투 (필수)

보이는 글은 사람 말로 쓴다. 뉴스 속보나 군사용어처럼 쓰지 않는다.

**쓰지 말 것:** 북상, 남하, 북진, 남진, 기점, 종점, 상기, 금회, 당일 일정 진행.

**이렇게 쓴다:** 가는 날 / 오는 날, 올라가는 길 / 내려오는 길, 출발 / 도착.

휴게소 공식 이름에 들어 있는 말(예: 양평방향, 창원방향)만 그대로 둔다.

`/Users/akanus/orca/workspaces/design-page/alzza.github.io`

라이브는 https://alzza.github.io/ . `main`에 푸시하면 GitHub Actions가 빌드해서 올린다. HTML을 저장소 루트에 직접 올리지 않는다.

바닐라 HTML 스냅샷은 태그 `vanilla-v1`.

## 폴더 한눈에

| 경로 | 역할 |
|---|---|
| `src/content/notes/*.md` | 노트 글. 파일 이름 = 주소 |
| `src/lib/notes.ts` | 홈 Notes와 `/notes/` 목록. 춘천처럼 md가 아닌 페이지만 여기 extra |
| `src/pages/index.astro` | 메인. 프로젝트 타일 |
| `src/pages/notes/index.astro` | 노트 목록 |
| `src/pages/notes/[slug].astro` | 노트 본문 틀. 보통 안 고친다 |
| `src/pages/chuncheon/index.astro` | 춘천 일정 |
| `src/pages/chuncheon/map.astro` | 카카오맵 길찾기 + 지도 |
| `src/data/chuncheon.ts` | 충전소·관광지 좌표, 코스 |
| `src/components/Header.astro` | 상단 로고, 링크, 테마 버튼 |
| `src/layouts/Base.astro` | 공통 HTML, 라이트 기본 |
| `src/styles/global.css` | 색, 보더, 카드. 커스텀 CSS |
| `public/theme.js` | 해/달 토글, 맨 위로 |
| `.github/workflows/pages.yml` | 배포 |

## 로컬에서 보기

```bash
cd /Users/akanus/orca/workspaces/design-page/alzza.github.io
git checkout main
git pull
npm install
npm run dev
```

브라우저: http://localhost:4321

- 홈: `/`
- 노트 목록: `/notes/`
- 이 글: `/notes/how-to-post/`
- 춘천: `/chuncheon/`
- 지도: `/chuncheon/map/`

글만 고쳤는데 안 바뀌면 터미널에서 서버를 끄고(`Ctrl+C`) 다시 `npm run dev`.

## 노트 하나 올리기

1. `src/content/notes/` 에 Markdown을 만든다. **파일 이름 = URL**
   - `hello.md` → https://alzza.github.io/notes/hello/
2. 맨 위 frontmatter는 필수. 따옴표 있는 날짜를 쓴다.
3. 본문은 일반 Markdown. 코드는 언어 이름 fence.
4. `npm run dev` 로 확인한다.
5. `main`에 커밋하고 푸시한다.
6. 홈 Notes와 `/notes/` 는 `listNotes()`가 같이 읽는다. 목록에 손으로 한 줄 넣지 않는다.

예시 `src/content/notes/hello.md`:

```md
---
title: 첫 노트
date: "2026-08-19"
excerpt: 목록에 보일 한 줄
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

### 수정 / 삭제

| 하고 싶은 일 | 하는 일 |
|---|---|
| 본문 | 그 md를 고친다 |
| 제목·날짜·한 줄 | 파일 맨 위 `title` `date` `excerpt` |
| 주소 | **파일 이름**을 바꾼다. 옛 주소는 끊긴다 |
| 삭제 | 파일을 지운다 |
| 춘천처럼 md가 아닌 페이지를 목록에 | `src/lib/notes.ts` 의 `extra` |

홈에만 빼고 목록에만 넣는 필터는 없다. md를 만들면 홈과 목록에 둘 다 뜬다.

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

## 춘천 일정 / 지도

- 일정 글: `src/pages/chuncheon/index.astro`
- 지도: `src/pages/chuncheon/map.astro`
- 좌표·코스: `src/data/chuncheon.ts`

길찾기는 **카카오맵** URL이다. (`map.kakao.com/link/by/car/...`) 네이버 URL을 다시 넣지 않는다.

지도 위 카카오 타일을 쓰려면 JavaScript 키가 필요하다. 없어도 마커(OSM 폴백)와 카카오 길찾기 버튼은 동작한다. 키를 쓰려면 [developers.kakao.com](https://developers.kakao.com) 에서 앱을 만들고 JavaScript 키를 받은 뒤, 도메인에 `http://localhost:4321` 과 `https://alzza.github.io` 를 등록한다. 로컬은 `.env` 에 `PUBLIC_KAKAO_JS_KEY=키` . 라이브는 GitHub 저장소 Secrets에 같은 이름으로 넣고 Actions가 빌드에 넣게 한다.

## 테마. 커스텀 CSS가 맞다

Astro 테마 패키지가 아니다. `src/styles/global.css` 에 neubrutalism 문법을 직접 적은 것이다.

- 라이트 기본. 다크는 오른쪽 위 달을 눌러 `localStorage.theme=dark` 일 때만
- 토큰: 파일 맨 위 `:root` 와 `[data-theme="dark"]`
- 해/달, 맨 위로: `public/theme.js`
- 노트 코드 하이라이트: Astro Shiki. `astro.config.mjs` 의 `github-dark`

색만 바꾸려면 `:root` 의 `--yellow` `--pink` `--ink` `--bg` 를 고친다. 다른 디자인 시스템으로 갈아타려면 CSS를 크게 다시 쓰는 일이다.

## 포스팅 팁

- 한 글 = 한 md. 목록은 자동.
- `date` 는 `"YYYY-MM-DD"`. 목록 정렬에 쓴다.
- `excerpt` 는 홈/목록 한 줄. 짧게.
- 이미지: `public/` 에 두고 `/파일명` 으로 링크.
- 긴 일정·지도는 노트가 아니라 `chuncheon/` 페이지.
- AI에게 시킬 때: `src/content/notes/제목.md` 에 frontmatter 포함해서 써 달라고 하면 된다.

## 커밋 / 푸시

```bash
cd /Users/akanus/orca/workspaces/design-page/alzza.github.io
git status
git add -A
git commit -m "Add hello note"
git push origin main
```

Actions가 `npm ci` → `npm run build` → `dist/` 를 Pages에 올린다. 1~2분. 실패하면 GitHub **Actions** 탭.

HTML을 루트에 올리지 않는다.

## 롤백 (바닐라)

함부로 `--force` 하지 말 것.

```bash
git checkout main
git reset --hard vanilla-v1
git push --force origin main
```

이후 Pages 설정을 다시 `main` 브랜치 `/` (legacy)로 바꿔야 바닐라 HTML이 바로 뜬다.
