(function () {
  "use strict";
  var timer = 0;
  var lastW = 0;

  function sheetWidth() {
    var wrap = document.querySelector(".wrap.prose") || document.querySelector(".wrap");
    if (!wrap) return 920;
    return Math.max(280, Math.floor(wrap.clientWidth));
  }

  function paint() {
    if (!window.L5XLadder || typeof L5XLadder.renderRung !== "function") return;
    var figs = document.querySelectorAll(".ld-rung[data-rll]");
    if (!figs.length) return;
    var w = sheetWidth();
    if (w === lastW && lastW !== 0) return;
    lastW = w;
    figs.forEach(function (fig) {
      var rll = fig.getAttribute("data-rll") || "";
      var num = fig.getAttribute("data-rung") || "0";
      var host = fig.querySelector(".ld-rung-live");
      if (!host) {
        host = document.createElement("div");
        host.className = "ld-rung-live";
        var img = fig.querySelector("img");
        if (img) {
          img.hidden = true;
          img.insertAdjacentElement("afterend", host);
        } else {
          fig.appendChild(host);
        }
      }
      try {
        var rr = L5XLadder.renderRung({ number: num, text: rll }, 0, w, false);
        host.innerHTML = rr.svg;
      } catch (e) {
        return;
      }
    });
  }

  function onResize() {
    lastW = 0;
    clearTimeout(timer);
    timer = setTimeout(paint, 120);
  }

  function start() {
    paint();
    window.addEventListener("resize", onResize);
    if (window.ResizeObserver) {
      var wrap = document.querySelector(".wrap.prose") || document.querySelector(".wrap");
      if (wrap) new ResizeObserver(onResize).observe(wrap);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
