(function () {
  "use strict";

  // New notes supply source positions with data attributes. The original
  // Finger Retry note keeps its existing HTML and uses this source mapping.
  var fingerRetryPositions = {
    Tran_099: { id: 15, transitionY: 260, nextY: 340 },
    Tran_103: { id: 15, transitionY: 280, nextY: 400 },
    Tran_155: { id: 16, transitionY: 260, nextY: 400 },
    Tran_160: { id: 17, transitionY: 280, nextY: 400 }
  };

  function step(id, operand, y) {
    return {
      kind: "step", id: id, x: 120, y: y, operand: operand,
      initialStep: false, hideDesc: false, showActions: false, actions: []
    };
  }

  function chart(fromName, transitionName, condition, toName, position) {
    var from = step(7, fromName, 80);
    var to = step(10, toName, position.nextY);
    var transition = {
      kind: "transition", id: position.id, x: 120,
      y: position.transitionY, operand: transitionName,
      hideDesc: false, force: false, condition: [condition]
    };
    return {
      sheetSize: "Letter", sheetOrientation: "Landscape",
      steps: [from, to], transitions: [transition],
      branches: [], stops: [], textBoxes: [], sbrRets: [],
      links: [
        { fromId: from.id, toId: transition.id, show: true },
        { fromId: transition.id, toId: to.id, show: true }
      ],
      attachments: [],
      byId: { 7: from, 10: to, [transition.id]: transition },
      warnings: []
    };
  }

  function paint() {
    if (!window.L5XSFC || typeof window.L5XSFC.renderSFC !== "function") return;
    document.querySelectorAll(".sfc-snippet, .prose-finger-retry .sfc-sheet").forEach(function (host) {
      var names = host.querySelectorAll(".sfc-step");
      var transition = host.querySelector(".sfc-transition b");
      var condition = host.querySelector("code");
      if (names.length !== 2 || !transition || !condition) return;
      var name = transition.textContent.trim();
      var position = host.classList.contains("sfc-snippet") ? {
        id: Number(host.dataset.transitionId),
        transitionY: Number(host.dataset.transitionY),
        nextY: Number(host.dataset.nextY)
      } : fingerRetryPositions[name];
      if (!position) return;
      if (!Number.isInteger(position.id) || position.id === 7 || position.id === 10 ||
          !Number.isFinite(position.transitionY) || !Number.isFinite(position.nextY) ||
          position.transitionY <= 80 || position.nextY <= position.transitionY) return;
      var snippet = chart(
        names[0].textContent.trim(), name, condition.textContent.trim(),
        names[1].textContent.trim(), position
      );
      // The Studio renderer measures step boxes from their full names. Align
      // their measured centers with the transition center before final paint.
      var measured = window.L5XSFC.renderSFC(snippet);
      if (measured.warnings.length || measured.overlap) return;
      var probe = new DOMParser().parseFromString(measured.svg, "image/svg+xml");
      var boxes = probe.querySelectorAll("rect.sfc-box");
      if (boxes.length !== 2) return;
      var widths = Array.from(boxes, function (box) { return Number(box.getAttribute("width")); });
      if (widths.some(function (width) { return !Number.isFinite(width) || width <= 0; })) return;
      var center = Math.max(widths[0], widths[1]) / 2 + 26;
      snippet.steps[0].x = center - widths[0] / 2;
      snippet.steps[1].x = center - widths[1] / 2;
      snippet.transitions[0].x = center - 18; // Studio transition width is 36.
      var result = window.L5XSFC.renderSFC(snippet);
      if (result.warnings.length || result.overlap) return;
      host.innerHTML = result.svg;
      host.setAttribute("data-renderer", "L5XSFC.renderSFC");
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paint);
  else paint();
})();
