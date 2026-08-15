---
title: 페이지 올리고 고치는 법
date: "2026-08-15"
excerpt: 노트, 홈 타일, 춘천, 로컬 미리보기, 배포
---

라이브는 Astro다. `main`에 푸시하면 GitHub Actions가 빌드해서 https://alzza.github.io/ 에 올린다. HTML을 직접 올리지 않는다.

바닐라로 되돌리려면 태그 `vanilla-v1` 을 쓴다.

## 로컬에서 보기

저장소에서:

```bash
git checkout main
npm install
npm run dev
```

브라우저: http://localhost:4321

글만 고친 뒤 화면이 안 바뀌면 서버를 끄고 다시 `npm run dev`.

## 노트 하나 올리기

1. `src/content/notes/` 에 Markdown 파일을 만든다. 파일 이름이 주소가 된다.
   - `src/content/notes/hello.md` → https://alzza.github.io/notes/hello/
2. 맨 위 frontmatter는 필수다.
3. 본문은 일반 Markdown. 코드는 언어 이름 fence.
4. `npm run dev` 로 확인한 뒤 `main`에 커밋하고 푸시한다.
5. 목록(`/notes/`)은 자동이다. 손으로 한 줄 추가하지 않는다.

예시 파일 `src/content/notes/hello.md`:

```md
---
title: 첫 노트
date: "2026-08-15"
excerpt: 목록에 보일 한 줄
---

본문이다. 인라인 코드는 `pio run` 처럼 쓴다.

## Python

print("ok")
```

코드 블록은 아래처럼 언어를 붙인다.

````
```python
print("ok")
```

```cpp
int main() { return 0; }
```
````

홈 Notes 줄(춘천, 테마 토큰)은 자동이 아니다. 홈에 새 줄을 넣으려면 `src/pages/index.astro` 를 고쳐야 한다. 노트 목록에만 뜨면 되면 md만 추가하면 된다.

## 노트 고치기 / 지우기

- 고치기: 그 md를 편집 → 푸시
- 제목·날짜·한 줄: 파일 맨 위 `title` `date` `excerpt`
- 주소 바꾸기: 파일 이름을 바꾼다. 예전 주소는 끊긴다
- 지우기: 파일을 삭제하고 푸시

## 홈 프로젝트 타일

파일: `src/pages/index.astro`

타일 하나 예:

```html
<a class="card fill-yellow" href="https://github.com/alzza/t2-can-board">
  <span class="kicker">Tesla / CAN</span>
  <h2>t2-can-board</h2>
  <p>LILYGO T2-CAN, Tesla HW3 듀얼 CAN 펌웨어.</p>
  <span class="go">GitHub →</span>
</a>
```

- 페이지가 있으면 `href`를 그 URL로, 문구는 `페이지 열기 →`
- GitHub만 있으면 저장소 URL, `GitHub →`
- 색: `fill-paper` `fill-yellow` `fill-pink` `fill-blue`

## 춘천 일정 / 지도

- 일정 표: `src/pages/chuncheon/index.astro`
- 지도·충전기: `src/pages/chuncheon/map.astro`

일정만 바꿀 때는 index 쪽 표 행을 고친다.

## 푸시하면 일어나는 일

```bash
git add -A
git commit -m "Add hello note"
git push origin main
```

Actions가 `npm ci` → `npm run build` → Pages에 `dist/` 를 올린다. 1~2분. 실패하면 GitHub 저장소 Actions 탭을 본다.

## 롤백

바닐라 HTML로:

```bash
git checkout main
git reset --hard vanilla-v1
git push --force origin main
```

Pages 설정을 다시 `main` 브랜치 `/` 로 바꿔야 바닐라가 바로 뜬다. 함부로 `--force` 하지 말 것.
