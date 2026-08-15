---
title: 테마 토큰
date: "2026-08-15"
excerpt: 라이트/다크와 코드 블록 쓰는 법
home: true
---

공식 npm 패키지는 없다. [neubrutalism/neubrutalism.com](https://github.com/neubrutalism/neubrutalism.com) 의 CSS 토큰을 그대로 옮겼다. 라이트 기본, 다크는 `data-theme="dark"` 로 잉크색만 뒤집는 cyber-brutalism.

## 핵심 세 줄

```css
border:        3px solid #000;
box-shadow:    5px 5px 0 0 #000;
border-radius: 0;
```

## 토글

페인트 전에 `localStorage.theme` 또는 시스템 설정을 읽는다. 오른쪽 위 달/해 버튼이 `light` / `dark` 를 바꾼다.

```js
// head, before CSS
var t = localStorage.getItem("theme");
if (t !== "dark" && t !== "light") {
  t = matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark" : "light";
}
document.documentElement.setAttribute("data-theme", t);
```

## 노트에 코드 넣는 법

`src/content/notes/` 아래에 Markdown 파일을 만들면 목록에 붙는다. 본문 코드는 언어 fence만 쓰면 된다.

```python
print("ok")
```
