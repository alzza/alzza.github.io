---
title: 테마 토큰
date: "2026-08-19"
excerpt: 라이트/다크 CSS와 노트 코드 하이라이트(Shiki). Astro 테마 패키지가 아니다.
kicker: 테마
tags: ["CSS", "테마"]
---

공식 npm 테마 패키지는 없다. [astro.build/themes](https://astro.build/themes/) 의 테마는 **새 프로젝트를 복사해 시작하는 템플릿**이다. 이 사이트 CSS를 그 위에 씌우거나, 숫자만 바꿔 다른 Astro 버전 스킨으로 바꾸는 기능은 없다.

색과 보더는 [neubrutalism/neubrutalism.com](https://github.com/neubrutalism/neubrutalism.com) 의 CSS 토큰을 `src/styles/global.css`에 직접 옮긴 것이다. 라이트 기본, 다크는 `data-theme="dark"` 로 잉크색만 뒤집는 cyber-brutalism.

운영 전체는 [페이지 올리고 고치는 법](/notes/how-to-post/).

## 핵심 세 줄

```css
border:        3px solid #000;
box-shadow:    5px 5px 0 0 #000;
border-radius: 0;
```

색만 바꾸려면 `global.css` 맨 위 `:root` 의 `--yellow` `--pink` `--ink` `--bg`. 다크는 `[data-theme="dark"]`.

## 토글

기본은 라이트다. `localStorage.theme` 이 `dark` 일 때만 다크다. 오른쪽 위 달/해 버튼이 바꾼다. 스크립트는 `public/theme.js` → 주소 `/theme.js`. ([public 폴더](https://docs.astro.build/ko/basics/project-structure/#public))

```js
// head, before CSS
var t = localStorage.getItem("theme");
document.documentElement.setAttribute("data-theme", t === "dark" ? "dark" : "light");
```

지도는 테마가 바뀌어도 타일을 다시 그리지 않는다. 카카오/OSM 타일 자체는 사이트 다크와 별개다.

## 노트에 코드 넣는 법

`src/content/notes/` 아래에 Markdown 파일을 만들면 목록에 붙는다. 본문 코드는 언어 fence만 쓰면 된다.

Astro 7 기본 Markdown은 [Sätteri](https://satteri.bruits.org/)이고 GitHub Flavored Markdown을 따른다. remark 플러그인은 이 사이트에 없다. ([Markdown](https://docs.astro.build/ko/guides/markdown-content/), [v7](https://docs.astro.build/ko/guides/upgrade-to/v7/))

코드 색은 Shiki. 설정은 `astro.config.mjs`:

```js
markdown: {
  shikiConfig: {
    theme: "github-dark",
  },
}
```

```python
print("ok")
```

모양 확인용 페이지: [/notes/highlight-test/](/notes/highlight-test/)
