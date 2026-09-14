(function () {
  "use strict";

  var el = document.getElementById("codex-reset");
  var when = document.getElementById("codex-reset-when");
  if (!el || !when) return;

  function rel(iso) {
    var t = new Date(iso).getTime();
    if (isNaN(t)) return "";
    var sec = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (sec < 60) return "방금";
    var min = Math.floor(sec / 60);
    if (min < 60) return min + "분 전";
    var hr = Math.floor(min / 60);
    if (hr < 24) return hr + "시간 전";
    var day = Math.floor(hr / 24);
    return day + "일 전";
  }

  fetch("https://codex-resets.com/api/v1/status")
    .then(function (res) {
      if (!res.ok) throw new Error(String(res.status));
      return res.json();
    })
    .then(function (body) {
      var latest = body && body.data && body.data.latest_reset;
      if (!latest || !latest.announced_at) return;
      var label = rel(latest.announced_at);
      if (!label) return;
      when.textContent = label;
      var src = latest.source && latest.source.url;
      if (src) el.href = src;
      if (latest.text) el.setAttribute("title", latest.text);
      el.hidden = false;
    })
    .catch(function () {});
})();
