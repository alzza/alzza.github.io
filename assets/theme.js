(function () {
  "use strict";

  var KEY = "theme";
  var toggle = document.getElementById("theme-toggle");
  var themeColorMeta = document.querySelector('meta[name="theme-color"]');

  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem(KEY, t);
    } catch (e) {}
    if (toggle) {
      var dark = t === "dark";
      toggle.setAttribute("aria-pressed", dark ? "true" : "false");
      toggle.setAttribute("aria-label", dark ? "라이트 테마로 전환" : "다크 테마로 전환");
      var icon = toggle.querySelector(".theme-toggle-icon");
      if (icon) icon.textContent = dark ? "\u2600" : "\u263E";
    }
    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", t === "dark" ? "#14131a" : "#FFD23F");
    }
  }

  applyTheme(document.documentElement.getAttribute("data-theme") || "light");

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
    });
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
