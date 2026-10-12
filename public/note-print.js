(function () {
  "use strict";

  var button = document.getElementById("note-print-button");
  if (!button) return;
  var openedForPrint = [];

  function openDetails() {
    document.querySelectorAll(".prose details:not([open])").forEach(function (details) {
      openedForPrint.push(details);
      details.open = true;
    });
  }

  function renderDiagrams() {
    // The paper sheet has a stable width even when printing from a narrow phone.
    if (typeof window.L5XRenderNoteRungs === "function") window.L5XRenderNoteRungs(1040);
    if (typeof window.L5XRenderNoteSFC === "function") window.L5XRenderNoteSFC();
  }

  function prepare() {
    window.L5XNotePrinting = true;
    openDetails();
    renderDiagrams();
  }

  function restore() {
    window.L5XNotePrinting = false;
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
