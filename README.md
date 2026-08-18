# alzza.github.io

Astro. 라이브: https://alzza.github.io/

바닐라 스냅샷: 태그 `vanilla-v1`

## 로컬

```bash
npm install
npm run dev
```

http://localhost:4321

## 무엇을 고치나

| 하고 싶은 일 | 파일 |
|---|---|
| 노트 추가/수정 | `src/content/notes/이름.md` (홈 목록도 같이 갱신) |
| 홈 타일 | `src/pages/index.astro` |
| 춘천 일정 | `src/pages/chuncheon/index.astro` |
| 지도·코스 좌표 | `src/pages/chuncheon/map.astro`, `src/data/chuncheon.ts` |
| 헤더 | `src/components/Header.astro` |
| 색·테마 | `src/styles/global.css` |

자세한 예시: 사이트 노트 [페이지 올리고 고치는 법](https://alzza.github.io/notes/how-to-post/) 또는 `src/content/notes/how-to-post.md`

## 배포

`main` 푸시 → GitHub Actions → Pages. HTML을 루트에 직접 올리지 않는다.
