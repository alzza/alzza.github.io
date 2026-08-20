(function () {
  "use strict";
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  function bind(card) {
    var face = card.querySelector("[data-tilt-face]") || card;
    card.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      face.style.transform =
        "rotateX(" + (-y * 8).toFixed(2) + "deg) rotateY(" + (x * 10).toFixed(2) + "deg)";
    });
    card.addEventListener("mouseleave", function () {
      face.style.transform = "";
    });
  }

  document.querySelectorAll("[data-tilt]").forEach(bind);
})();
