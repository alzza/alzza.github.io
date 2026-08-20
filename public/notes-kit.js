(function () {
  "use strict";
  var KEY = "note-mods";
  var DEFAULTS = ["tag-filter", "insight-grid"];

  function savedMods() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch (e) {}
    return DEFAULTS.slice();
  }

  function applyMods(mods) {
    document.querySelectorAll("[data-mod]").forEach(function (el) {
      var on = mods.indexOf(el.getAttribute("data-mod")) !== -1;
      el.hidden = !on;
    });
    document.querySelectorAll("[data-mod-toggle]").forEach(function (btn) {
      var on = mods.indexOf(btn.getAttribute("data-mod-toggle")) !== -1;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.classList.toggle("is-on", on);
    });
    try {
      localStorage.setItem(KEY, JSON.stringify(mods));
    } catch (e) {}
  }

  var mods = savedMods();
  applyMods(mods);

  document.querySelectorAll("[data-mod-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-mod-toggle");
      var next = mods.slice();
      var i = next.indexOf(id);
      if (i === -1) next.push(id);
      else next.splice(i, 1);
      if (!next.length) next = DEFAULTS.slice();
      mods = next;
      applyMods(mods);
    });
  });

  var q = document.querySelector("[data-note-q]");
  var empty = document.querySelector("[data-note-empty]");
  var activeTag = "";

  function filter() {
    var needle = ((q && q.value) || "").trim().toLowerCase();
    var items = document.querySelectorAll("[data-note-item]");
    var shown = 0;
    items.forEach(function (el) {
      var tags = (el.getAttribute("data-tags") || "").split(",").filter(Boolean);
      var hay = el.getAttribute("data-hay") || "";
      var okTag = !activeTag || tags.indexOf(activeTag) !== -1;
      var okQ = !needle || hay.indexOf(needle) !== -1;
      var on = okTag && okQ;
      el.hidden = !on;
      if (on) shown += 1;
    });
    if (empty) empty.hidden = shown !== 0;
  }

  document.querySelectorAll("[data-tag]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      activeTag = btn.getAttribute("data-tag") || "";
      document.querySelectorAll("[data-tag]").forEach(function (b) {
        var on = (b.getAttribute("data-tag") || "") === activeTag;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      filter();
    });
  });
  if (q) q.addEventListener("input", filter);

  var params = new URLSearchParams(window.location.search);
  var startTag = params.get("tag") || "";
  if (startTag) {
    var hit = document.querySelector('[data-tag="' + startTag.replace(/"/g, "") + '"]');
    if (hit) hit.click();
  }

})();
