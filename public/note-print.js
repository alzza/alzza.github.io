(function () {
  "use strict";

  var button = document.getElementById("note-print-button");
  if (!button) return;
  var openedForPrint = [];
  var PRINT_RUNG_WIDTH = 640;

  function safeCut(svg, target, start, end) {
    var blocks = Array.from(svg.querySelectorAll("text, rect"), function (node) {
      var box = node.getBBox();
      return [box.y, box.y + box.height];
    });
    for (var side = 0; side < 2; side++) {
      for (var offset = 0; offset <= 85; offset += 5) {
        var cut = target + (side ? -offset : offset);
        if (cut < start + 145 || cut > end - 145) continue;
        if (blocks.every(function (box) { return box[1] < cut - 12 || box[0] > cut + 12; })) return cut;
      }
    }
    return target;
  }

  function renderPrintRungs() {
    document.querySelectorAll(".ld-print-sheets").forEach(function (node) { node.remove(); });
    if (typeof window.L5XRenderNoteRungs !== "function") return;
    window.L5XRenderNoteRungs(PRINT_RUNG_WIDTH);
    document.querySelectorAll(".ld-rung[data-rll]").forEach(function (figure) {
      var source = figure.querySelector(".ld-rung-live svg");
      if (!source) return;
      var view = source.viewBox.baseVal;
      var height = view.height;
      var cuts = [0];
      if (height > 780) {
        cuts.push(safeCut(source, 165, 0, height));
        while (height - cuts[cuts.length - 1] > 650) {
          var next = safeCut(source, cuts[cuts.length - 1] + 540, cuts[cuts.length - 1], height);
          if (next <= cuts[cuts.length - 1]) break;
          cuts.push(next);
        }
      }
      cuts.push(height);
      var sheets = document.createElement("div");
      sheets.className = "ld-print-sheets";
      var number = figure.getAttribute("data-rung") || "";
      for (var i = 0; i < cuts.length - 1; i++) {
        var sheet = document.createElement("div");
        sheet.className = "ld-print-sheet";
        if (i > 0) sheet.classList.add("ld-print-continuation");
        if (cuts.length > 2) {
          var caption = document.createElement("p");
          caption.className = "ld-print-caption";
          caption.textContent = "Rung " + number + " · 도면 " + (i + 1) + "/" + (cuts.length - 1) +
            (i > 0 ? " (앞 도면에서 이어짐)" : "");
          sheet.appendChild(caption);
        }
        var svg = source.cloneNode(true);
        svg.setAttribute("viewBox", [view.x, view.y + cuts[i], view.width, cuts[i + 1] - cuts[i]].join(" "));
        svg.setAttribute("height", cuts[i + 1] - cuts[i]);
        svg.setAttribute("aria-label", "Rung " + number + " LD 도면 " + (i + 1) + "/" + (cuts.length - 1));
        sheet.appendChild(svg);
        if (i < cuts.length - 2) {
          var continued = document.createElement("p");
          continued.className = "ld-print-next";
          continued.textContent = "다음 도면에서 계속됩니다.";
          sheet.appendChild(continued);
        }
        sheets.appendChild(sheet);
      }
      figure.appendChild(sheets);
    });
  }

  function openDetails() {
    document.querySelectorAll(".prose details:not([open])").forEach(function (details) {
      openedForPrint.push(details);
      details.open = true;
    });
  }

  function renderDiagrams() {
    // Keep the original ladder renderer; only paginate its output for paper.
    renderPrintRungs();
    if (typeof window.L5XRenderNoteSFC === "function") window.L5XRenderNoteSFC();
  }

  function prepare() {
    window.L5XNotePrinting = true;
    openDetails();
    renderDiagrams();
  }

  function restore() {
    window.L5XNotePrinting = false;
    document.querySelectorAll(".ld-print-sheets").forEach(function (node) { node.remove(); });
    openedForPrint.forEach(function (details) { details.open = false; });
    openedForPrint = [];
    button.disabled = false;
    if (typeof window.L5XRenderNoteRungs === "function") window.L5XRenderNoteRungs();
  }

  window.addEventListener("beforeprint", prepare);
  window.addEventListener("afterprint", restore);

  button.addEventListener("click", async function () {
    button.disabled = true;
    prepare();
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      await Promise.race([
        Promise.all(Array.from(document.querySelectorAll(".prose img:not([hidden])"), function (img) {
          return img.decode ? img.decode().catch(function () {}) : Promise.resolve();
        })),
        new Promise(function (resolve) { setTimeout(resolve, 5000); })
      ]);
      renderDiagrams();
      window.print();
    } catch (error) {
      restore();
    }
  });
})();
