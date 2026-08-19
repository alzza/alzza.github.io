(function () {
  "use strict";

  var KEY = "theme";
  var GISCUS_LIGHT =
    "https://raw.githubusercontent.com/alzza/alzza.github.io/main/public/giscus-light.css";
  var GISCUS_DARK =
    "https://raw.githubusercontent.com/alzza/alzza.github.io/main/public/giscus-dark.css";
  var ICONS =
    '<svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.5 2.8a1 1 0 0 1 1.2 1.5A8.2 8.2 0 1 0 19.7 16a1 1 0 0 1 1.7 1 10.2 10.2 0 1 1-5-14.2z"/></svg>' +
    '<svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="currentColor"/><path fill="currentColor" d="M11 1h2v3h-2zm0 19h2v3h-2zM1 11h3v2H1zm19 0h3v2h-3zM4.2 3.8l1.4-1.4 2.1 2.1-1.4 1.4zm12.1 12.1 2.1 2.1-1.4 1.4-2.1-2.1zm2.1-12.1 1.4 1.4-2.1 2.1-1.4-1.4zM6.3 17.7l1.4 1.4-2.1 2.1-1.4-1.4z"/></svg>';

  var toggle = document.getElementById("theme-toggle");
  var themeColorMeta = document.querySelector('meta[name="theme-color"]');

  if (toggle && !toggle.querySelector(".icon-moon")) {
    toggle.innerHTML = ICONS;
  }

  function applyTheme(t) {
    if (t !== "dark") t = "light";
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem(KEY, t);
    } catch (e) {}
    if (toggle) {
      var dark = t === "dark";
      toggle.setAttribute("aria-pressed", dark ? "true" : "false");
      toggle.setAttribute("aria-label", dark ? "라이트 테마로 전환" : "다크 테마로 전환");
    }
    if (themeColorMeta) {
      var lightC = themeColorMeta.getAttribute("data-light") || "#FFD23F";
      var darkC = themeColorMeta.getAttribute("data-dark") || "#14131a";
      themeColorMeta.setAttribute("content", t === "dark" ? darkC : lightC);
    }
    var frame = document.querySelector("iframe.giscus-frame");
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage(
        { giscus: { setConfig: { theme: t === "dark" ? GISCUS_DARK : GISCUS_LIGHT } } },
        "https://giscus.app"
      );
    }
  }

  applyTheme(document.documentElement.getAttribute("data-theme") || "light");

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
    });
  }

  var topBtn = document.getElementById("back-to-top");
  if (topBtn) {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    topBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
    var sentinel = document.getElementById("top-sentinel");
    if (sentinel && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        var hide = entries[0] && entries[0].isIntersecting;
        topBtn.classList.toggle("is-visible", !hide);
      }).observe(sentinel);
    }
  }

  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var wrap = btn.closest(".code-block-wrap");
      var block = wrap && wrap.querySelector(".code-block");
      if (!block) return;
      var text = block.textContent || "";
      function done() {
        btn.textContent = "copied";
        btn.classList.add("is-copied");
        setTimeout(function () {
          btn.textContent = "copy";
          btn.classList.remove("is-copied");
        }, 1400);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () {});
      }
    });
  });
})();
