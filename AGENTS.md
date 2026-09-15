# 이 사이트 글 규칙

RLL을 LD로 그리거나 노트·문서에 래더를 넣을 때는 아래 `## 노트 LD`를 다른 절보다 먼저 읽는다. 새 렌더러를 만들지 않는다.

보이는 문장은 한국 사람이 카톡에 쓰는 말로 쓴다.

금지: 북상, 남하, 북진, 남진, 기점, 종점, 상기, 금회.

대신: 가는 날, 오는 날, 올라가는 길, 내려오는 길, 출발, 도착.

휴게소 간판에 적힌 방향 이름(양평방향, 창원방향)만 예외.

## 노트와 배포 페이지의 한국어

`src/content/notes/`에 글을 쓰거나, `public/`에 HTML을 올려 노트 목록에 연결할 때는 [fluent-korean](https://github.com/snflkd/fluent-korean/) 규칙을 적용한다. GitHub Pages에 나가는 글이면 예외 없이 전부 적용한다. 채팅 한 줄만 짧게 받는 경우가 아니다.

요지만 남기고 조사와 어미를 빼지 않는다. 명사만 이어 붙인 문장, 번역체, AI가 흔히 쓰는 비유(층, 갈래, 여정, 한 수, 핵심만 말하면)는 쓰지 않는다. 태그 이름과 코드는 그대로 두고, 그 주변을 완전한 문장으로 설명한다.

적용할 때:

- 의미가 있는 주어, 목적어, 서술어를 생략하지 않는다.
- 본문 문장은 서술어와 종결어미로 끝낸다. 표의 칸도 가능하면 그렇게 쓴다. 제목과 목록 항목은 예외로 둘 수 있다.
- 조사와 어미를 빼지 않는다. 꼭 필요하지 않으면 비유 동사로 일반 동사를 바꾸지 않는다.
- 엠대시(—)는 쓰지 않는다. 콜론이나 접속사로 나눈다.
- 한국어로 나가는 제목, 요약, 본문, 표, 카드 문구에도 같은 규칙을 적용한다.
- 올리기 전에 위 항목에 어긋난 문장이 있으면 고친 뒤에 커밋한다.

인용, 코드, 커밋 메시지, 태그 식별자에는 이 규칙을 적용하지 않는다.

## 노트 LD

노트에 넣는 래더는 정적 SVG를 본문에 붙여 끝내지 않는다. `figure.ld-rung`에 `data-rll`과 `data-rung`을 두고, [L5X Ladder Studio](https://alzza.github.io/l5x-ld-studio/)와 같은 렌더러가 브라우저 본문 폭에 맞춰 다시 그린다. 짧은 렁도 Studio 5000처럼 좌우 레일이 가로를 채우고, 그보다 넓은 렁만 한 화면에 맞게 줄어든다. `img`는 자바스크립트가 없을 때의 예비 그림이다. 새 LD를 넣을 때도 이 형식을 쓴다.

손 SVG, Mermaid, PlantUML, ASCII, 스크린샷, 새 Canvas로 다시 그리지 않는다. `window.L5XLadder.renderRung`만 호출한다.

진실이 있는 곳:

- 렌더러 원본: `https://github.com/alzza/l5x-ld-studio`
- 이 저장소 복사본: `public/l5x-ld-studio.js`
- 페이지 삽입: `public/ld-embed.js`
- 노트 예시는 `src/content/notes/how-to-post.md`
- 옆 폴더 `design-page/theme`는 Next.js 공부용이며 이 사이트와 무관하다

호출:

```js
L5XLadder.renderRung({ number: "52", text: rll }, 0, viewportWidth, false)
```

노트와 문서에서는 네 번째 인자 `showIndex`를 항상 `false`로 둔다. `viewportWidth`는 그림이 들어갈 칸의 `clientWidth`이다. 없으면 920이다.

마크업:

```html
<figure class="ld-rung" data-rung="52" data-rll="XIC(i_finger_1_down)XIO(i_finger_1_no_copper)OTE(f_finger1_separated);">
<div class="rung-meta"><span class="rung-meta-number">Rung 52</span><span class="rung-status ok">정상</span></div>
<img src="/images/notes/.../ld_rung_00.svg" alt="원본 Finger 완료 LD" width="920" height="126">
</figure>
```

`data-rll`은 그 그림의 RLL이다. 세미콜론을 포함한다. `data-rung`은 Studio 렁 번호이며 SVG 속 텍스트가 아니다. 라이브에서는 `img`를 숨기고 `.ld-rung-live`에 SVG를 넣는다.

폭 공식 (`renderRung`):

```
pad = 22
railL = showIndex ? 72 : pad
contentW = measure(ast).w + railL + pad + 32 + 34
W = max(contentW, viewportWidth)
```

노트는 `showIndex=false`이므로 좌우 여백이 둘 다 22px이다. 짧은 렁은 `W = viewportWidth`가 되어 심볼 크기는 그대로이고 빈 가로 전선이 오른쪽 레일까지 이어진다. 넓은 렁은 `W = contentW`로 그린 뒤 CSS가 시트에 맞게 줄인다.

```css
.ld-rung-live svg,
.ld-rung img {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
}
```

다크 배경에서는 전선색 `#243b7a`가 사라지므로 `.ld-rung-live { background: #fff; }`를 둔다. 노트 시트 최소 가로는 920px이다 (`.wrap` 최대와 같다).

Logix 규칙. 렌더러가 이미 하므로 바꾸지 않는다.

- 좌우 세로 레일, 가로 전선, 접점/코일/블록
- 병렬 `[A,B]`는 첫 분기가 본선이고 나머지는 아래로 내려간다. 위아래 대칭으로 두지 않는다
- OTE/OTL/OTU는 오른쪽 레일 쪽에 붙는다
- SVG 안에 렁 번호를 넣지 않는다. 번호와 「정상」은 HTML `.rung-meta`에 둔다

금지. 이미 실패해서 버린 방법이다.

- 내용 폭으로만 그리고 `width:100%`를 주면 짧은 렁 심볼이 가로로 커진다
- 내용 폭으로 그린 뒤 CSS로 고정 px에 맞추면 짧은 렁이 가운데 작게 앉는다
- SVG 안에 렁 번호를 베이크하면 왼쪽 72px 칸 때문에 좌우가 비대칭이 된다
- 내보내기 작업을 파일명만으로 키하면 `ld_rung_00.svg`처럼 문서가 달라도 파일이 같아 `data-rll`이 섞인다. 키는 `폴더/파일명`이다
- 색, 폰트, 접점 모양, 레일 두께를 새로 창작하지 않는다
- 본문을 `ch`로 좁히지 않는다. Starlight 기본 본문(~632px)은 RLL과 LD가 잘리므로 문서 칸을 그보다 넓힌다

페이지에 붙일 때 `ld-embed.js`가 `.ld-rung` 폭을 넘긴다. `resize`와 `ResizeObserver`로 다시 그린다. `<details>`가 열리면 `toggle`에서 다시 그린다. 노트 페이지 스크립트는 본문에 `ld-rung` 문자열이 있을 때만 넣는다.

## 본문 폭

노트, 차량, 정보, 홈, 춘천 페이지의 본문·목록·표는 같은 `.wrap` 폭을 쓴다. 지금은 최대 920px이다. 문단이나 목록만 `ch`로 좁히지 않는다. 글을 쓸 때도 신문 칼럼처럼 짧게 끊지 말고, 표와 같은 가로폭에 맞춰 쓴다.
