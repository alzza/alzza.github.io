(function () {
  "use strict";

  const root = document.querySelector(".finger-retry-replay[data-source]");
  if (!root) return;

  const label = (value) => value === null || value === undefined ? "해당 없음" : value ? "1" : "0";
  const stepLabel = (value) => value || "상위 완료 후 추적 중지";
  const step = (id, operand, y) => ({
    kind: "step", id, x: 120, y, operand,
    initialStep: false, hideDesc: false, showActions: false, actions: []
  });
  const transition = (id, operand, condition, y) => ({
    kind: "transition", id, x: 120, y, operand,
    hideDesc: false, force: false, condition: [condition]
  });

  function chart(sfc) {
    const steps = [
      step(101, sfc.lower, 80), step(102, sfc.raise, 340),
      step(103, sfc.hammer, 600), step(104, sfc.flex, 860)
    ];
    const transitions = [
      transition(201, sfc.transition, sfc.lowerCondition, 250),
      transition(202, sfc.raiseExit.name, sfc.raiseExit.condition, 510),
      transition(203, sfc.hammerExit.name, sfc.hammerExit.condition, 770)
    ];
    return {
      sheetSize: "Letter", sheetOrientation: "Landscape",
      steps, transitions, branches: [], stops: [], textBoxes: [], sbrRets: [],
      links: [
        {fromId: 101, toId: 201, show: true}, {fromId: 201, toId: 102, show: true},
        {fromId: 102, toId: 202, show: true}, {fromId: 202, toId: 103, show: true},
        {fromId: 103, toId: 203, show: true}, {fromId: 203, toId: 104, show: true}
      ],
      attachments: [], byId: Object.fromEntries([...steps, ...transitions].map((item) => [item.id, item])),
      warnings: []
    };
  }

  function paintSfc(host, sfc, row) {
    const renderer = window.L5XSFC?.renderSFC;
    if (typeof renderer !== "function") {
      host.textContent = "SFC 렌더러를 불러오지 못했다. 아래 상태표와 원본 SFC 설명을 확인한다.";
      return;
    }
    const model = chart(sfc);
    const measured = renderer(model);
    if (measured.warnings?.length || measured.overlap) {
      host.textContent = "이 경로의 SFC 배치를 확인할 수 없다. 상태표에는 시험 결과가 남아 있다.";
      return;
    }
    const probe = new DOMParser().parseFromString(measured.svg, "image/svg+xml");
    const boxes = Array.from(probe.querySelectorAll("rect.sfc-box"));
    if (boxes.length !== model.steps.length) {
      host.textContent = "SFC Step 수가 원본 경로와 다르다. 그림은 표시하지 않는다.";
      return;
    }
    const widths = boxes.map((box) => Number(box.getAttribute("width")));
    if (widths.some((width) => !Number.isFinite(width) || width <= 0)) {
      host.textContent = "SFC Step의 폭을 확인할 수 없다.";
      return;
    }
    const center = Math.max(...widths) / 2 + 26;
    model.steps.forEach((item, index) => { item.x = center - widths[index] / 2; });
    model.transitions.forEach((item) => { item.x = center - 18; });
    const rendered = renderer(model);
    if (rendered.warnings?.length || rendered.overlap) {
      host.textContent = "SFC 연결선이 겹쳐 그림을 표시하지 않는다.";
      return;
    }
    host.innerHTML = window.L5XScopeSfcSvgIds ?
      window.L5XScopeSfcSvgIds(rendered.svg, "retry-replay") : rendered.svg;
    host.dataset.renderer = "L5XSFC.renderSFC";
    const svg = host.querySelector("svg");
    if (!svg) return;
    svg.setAttribute("aria-label", `${sfc.lower}부터 ${sfc.flex}까지의 제한된 SFC 경로`);
    const names = Array.from(svg.querySelectorAll("text.sfc-name"));
    const renderedBoxes = Array.from(svg.querySelectorAll("rect.sfc-box"));
    let activeBox = null;
    names.forEach((name, index) => {
      if (name.textContent === row.sourceStep) {
        activeBox = renderedBoxes[index];
        renderedBoxes[index].style.fill = "#fff0a6";
        renderedBoxes[index].style.stroke = "#a75500";
        renderedBoxes[index].style.strokeWidth = "3";
      } else if (name.textContent === row.nextStep && row.nextStep !== row.sourceStep) {
        renderedBoxes[index].style.fill = "#e8fff2";
        renderedBoxes[index].style.stroke = "#087a45";
        renderedBoxes[index].style.strokeWidth = "2.5";
      }
    });
    if (activeBox) {
      const offset = activeBox.getBoundingClientRect().top - host.getBoundingClientRect().top + host.scrollTop;
      host.scrollTop = Math.max(0, offset - host.clientHeight / 3);
    }
    Array.from(svg.querySelectorAll("text.sfc-label")).forEach((item) => {
      if (item.textContent === row.firedTransition) {
        item.style.fill = "#087a45";
        item.style.fontWeight = "700";
      }
    });
  }

  function option(value, text) {
    const item = document.createElement("option");
    item.value = value;
    item.textContent = text;
    return item;
  }
  function control(name, values) {
    const wrap = document.createElement("label");
    wrap.className = "fr-control";
    const span = document.createElement("span");
    span.textContent = name;
    const select = document.createElement("select");
    values.forEach(([value, text]) => select.appendChild(option(value, text)));
    wrap.append(span, select);
    return {wrap, select};
  }
  function button(text, title) {
    const item = document.createElement("button");
    item.type = "button";
    item.textContent = text;
    item.setAttribute("aria-label", title || text);
    return item;
  }

  fetch(root.dataset.source, {cache: "no-store"})
    .then((response) => {
      if (!response.ok) throw Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      if (!Array.isArray(data.traces) || data.traces.length !== 12) throw Error("시험 추적 수가 다르다");
      root.replaceChildren();
      const heading = document.createElement("h4");
      heading.textContent = "SM Finger Retry 스캔 재생";
      const warning = document.createElement("p");
      warning.className = "fr-warning";
      warning.textContent = "오프라인 시험이다. 시도 횟수 한계와 위치·Hammer 완료 입력은 시험에서 주입했다. 재생 속도는 실제 PLC 시간과 무관하다. 좁은 화면에서는 SFC 그림을 좌우로 움직여 볼 수 있다.";
      const controls = document.createElement("div");
      controls.className = "fr-controls";
      const sm = control("장비", [["1", "SM#1"], ["2", "SM#2"]]);
      const finger = control("Finger", [["1", "Finger 1"], ["2", "Finger 2"]]);
      const variant = control("로직", [["before", "변경 전"], ["after-off", "변경 후 OFF"], ["after-on", "변경 후 ON"]]);
      variant.select.value = "after-on";
      const speed = control("재생 속도", [["1500", "느리게"], ["900", "보통"], ["400", "빠르게"]]);
      speed.select.value = "900";
      const prev = button("← 이전 스캔");
      const play = button("▶ 재생", "재생 또는 일시정지");
      const next = button("다음 스캔 →");
      controls.append(sm.wrap, finger.wrap, variant.wrap, speed.wrap, prev, play, next);
      const position = document.createElement("div");
      position.className = "fr-position";
      const rangeLabel = document.createElement("label");
      rangeLabel.textContent = "스캔 위치";
      const range = document.createElement("input");
      range.type = "range";
      range.min = "0";
      range.step = "1";
      range.setAttribute("aria-label", "스캔 위치");
      const count = document.createElement("output");
      position.append(rangeLabel, range, count);
      const event = document.createElement("div");
      event.className = "fr-event";
      event.setAttribute("aria-live", "polite");
      const chartHost = document.createElement("div");
      chartHost.className = "fr-sfc";
      const visual = document.createElement("div");
      visual.className = "fr-visual";
      const returnNote = document.createElement("p");
      returnNote.className = "fr-return";
      const signals = document.createElement("div");
      signals.className = "fr-signals";
      visual.append(chartHost, signals);
      const compareTitle = document.createElement("h5");
      compareTitle.textContent = "같은 시험 입력의 변경 전·OFF·ON 비교";
      const compare = document.createElement("div");
      compare.className = "fr-compare";
      root.append(heading, warning, controls, position, event, visual, returnNote, compareTitle, compare);

      let cursor = 0;
      let timer = null;
      const selected = () => data.traces.find((trace) => trace.sm === Number(sm.select.value) &&
        trace.finger === Number(finger.select.value) &&
        (variant.select.value === "before" ? trace.variant === "before" :
          trace.variant === "after" && trace.enabled === (variant.select.value === "after-on")));
      const stop = () => {
        if (timer !== null) window.clearInterval(timer);
        timer = null;
        play.textContent = "▶ 재생";
      };
      function render() {
        const trace = selected();
        if (!trace) throw Error("선택한 시험 추적을 찾을 수 없다");
        cursor = Math.min(cursor, trace.rows.length - 1);
        const row = trace.rows[cursor];
        range.max = String(trace.rows.length - 1);
        range.value = String(cursor);
        count.textContent = `${cursor + 1} / ${trace.rows.length} 스캔`;
        event.replaceChildren();
        const title = document.createElement("strong");
        title.textContent = row.scan;
        const path = document.createElement("span");
        path.textContent = `스캔 시작: ${stepLabel(row.sourceStep)}  |  성립한 전이: ${row.firedTransition || "없음"}  |  다음 Step: ${stepLabel(row.nextStep)}`;
        event.append(title, path);
        paintSfc(chartHost, trace.sfc, row);
        returnNote.textContent = `${trace.sfc.flexExit.name}: ${trace.sfc.flexExit.condition}이 성립하면 원래 ${trace.sfc.lower}로 돌아간다. 그림에서는 이 되돌아가는 연결과 다른 분기를 생략했다.`;
        signals.replaceChildren();
        const values = [
          ["실제 No Copper", row.rawNoCopper], ["내부 No Copper 판단", row.effectiveNoCopper],
          ["Finger Down", row.fingerDown], ["Finger Up", row.fingerUp],
          ["Raise 실패 시험 주입", row.failureInjected], ["실패 비트(스캔 끝)", row.stripFailed],
          ["Pending", row.pending],
          ["우회 Active", row.active], ["탈취 완료 비트", row.separated],
          ["상위 완료 전이", row.parentCompletionTransition], ["Gate 진입", row.gate],
          ["기능 Enable", row.enable], ["Lower 타임아웃 DN", row.timeoutDone]
        ];
        values.forEach(([name, value]) => {
          const cell = document.createElement("div");
          cell.className = "fr-signal";
          const small = document.createElement("span");
          small.textContent = name;
          const val = document.createElement("b");
          val.textContent = label(value);
          if (value === true) val.className = "on";
          cell.append(small, val);
          signals.appendChild(cell);
        });
        compare.replaceChildren();
        [["before", false, "변경 전"], ["after", false, "변경 후 OFF"], ["after", true, "변경 후 ON"]].forEach(([kind, enabled, name]) => {
          const other = data.traces.find((item) => item.sm === trace.sm && item.finger === trace.finger &&
            item.variant === kind && item.enabled === enabled);
          const same = other?.rows[cursor];
          const card = document.createElement("div");
          card.className = "fr-compare-card";
          if (name === variant.select.options[variant.select.selectedIndex].textContent) card.classList.add("selected");
          const title = document.createElement("b");
          title.textContent = name;
          const detail = document.createElement("span");
          detail.textContent = same ?
            `${stepLabel(same.sourceStep)} → ${stepLabel(same.nextStep)}\n판단 ${label(same.effectiveNoCopper)} · Active ${label(same.active)} · 완료 ${label(same.separated)} · Gate ${label(same.gate)}` :
            "이 경로에는 해당 스캔이 없다.";
          card.append(title, detail);
          compare.appendChild(card);
        });
        prev.disabled = cursor === 0;
        next.disabled = cursor === trace.rows.length - 1;
      }
      function start() {
        stop();
        const trace = selected();
        if (cursor >= trace.rows.length - 1) cursor = 0;
        play.textContent = "Ⅱ 일시정지";
        render();
        timer = window.setInterval(() => {
          if (cursor >= selected().rows.length - 1) { stop(); return; }
          cursor += 1;
          render();
          if (cursor >= selected().rows.length - 1) stop();
        }, Number(speed.select.value));
      }
      [sm.select, finger.select, variant.select].forEach((select) => select.addEventListener("change", () => {
        stop(); cursor = 0; render();
      }));
      speed.select.addEventListener("change", () => { if (timer !== null) start(); });
      prev.addEventListener("click", () => { stop(); cursor = Math.max(0, cursor - 1); render(); });
      next.addEventListener("click", () => { stop(); cursor = Math.min(selected().rows.length - 1, cursor + 1); render(); });
      play.addEventListener("click", () => { if (timer === null) start(); else stop(); });
      range.addEventListener("input", () => { stop(); cursor = Number(range.value); render(); });
      render();
    })
    .catch((error) => {
      root.textContent = `재생 화면을 불러오지 못했다: ${error.message}. 아래의 스캔별 비교표를 확인한다.`;
    });
})();
