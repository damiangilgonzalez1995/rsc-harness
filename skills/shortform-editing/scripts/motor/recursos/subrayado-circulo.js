// Resource "subrayado-circulo": a handwritten word (fuentes.manuscrita) above the head and a hand-drawn
// marker stroke (a circle whose loop overshoots, or a double underline) drawn around it.
// opts:
//   texto  (str)  a word or 2-3 words. Default "etiqueta".
//   forma  (str)  "circulo" | "subrayado". Default "circulo".
//   x, y   (num)  centre in px; default centred over the head, below the Instagram header.
//   tam    (num)  size in px. Default 118.
// Brand colours: trazo (word), acento (stroke), fondo (halo). zona: "arriba".
(function () {
  window.REC = window.REC || {};
  var W = 1080, H = 1920, TOPE = 165; // the whole stroke stays below the Instagram header (~150 px)
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function css(M) {
    if (document.getElementById("css-subrayado-circulo")) return;
    var s = document.createElement("style"); s.id = "css-subrayado-circulo";
    s.textContent =
      ".rb-sc{position:absolute;left:0;top:0;white-space:nowrap;visibility:hidden}" +
      ".rb-sc .pal{font-family:'" + M.mano + "';font-weight:700;line-height:1;color:" + M.trazo + ";text-shadow:0 0 14px " + M.rgba(M.fondo, .8) + ",0 0 3px " + M.rgba(M.fondo, .7) + "}" +
      ".rb-sc svg{position:absolute;overflow:visible}" +
      ".rb-sc path{fill:none;stroke:" + M.acento + ";stroke-width:10;stroke-linecap:round;stroke-linejoin:round}";
    document.head.appendChild(s);
  }
  var CIRC = "M-74,-50 C-40,-98 66,-96 94,-30 C112,24 52,88 -18,86 C-86,82 -108,22 -88,-30 C-76,-62 -36,-84 8,-88";
  var SUB = ["M-98,64 C-50,50 20,74 98,54", "M-66,86 C-20,76 30,92 76,80"];
  window.REC["subrayado-circulo"] = function (tl, capa, t0, dur, opts, ctx) {
    var M = window.MARCA(ctx);
    css(M);
    opts = opts || {};
    var texto = String(opts.texto || "etiqueta"), circ = opts.forma !== "subrayado";
    var F = opts.tam || 118;
    var c = (ctx && ctx.cara) || {};
    var cab = c.cabeza != null ? c.cabeza * H : ((c.arriba != null ? c.arriba : .2) - .12) * H;
    var x = opts.x != null ? opts.x : Math.max(300, Math.min(W - 300, (c.cx != null ? c.cx : .5) * W));
    var w = texto.length * F * 0.4 + (circ ? 110 : 40), h = circ ? F * 1.55 : F * 1.25;
    var y = opts.y != null ? opts.y : Math.max(TOPE + h / 2, cab - F * 0.35);
    var paths = circ ? [CIRC] : SUB;
    // the path is scaled by hand (not preserveAspectRatio) so stroke width and drawing do not distort
    function escala(d) { var k = 0; return d.replace(/-?\d+(\.\d+)?/g, function (n) { return (k++ % 2 ? +n * h / 200 : +n * w / 200).toFixed(1); }); }
    var svg = '<svg width="' + w.toFixed(0) + '" height="' + h.toFixed(0) + '" viewBox="' + (-w / 2).toFixed(1) + " " + (-h / 2).toFixed(1) + " " + w.toFixed(1) + " " + h.toFixed(1) +
      '" style="left:50%;top:50%;margin-left:' + (-w / 2).toFixed(0) + "px;margin-top:" + (-h / 2).toFixed(0) + 'px">' +
      paths.map(function (p) { return '<path pathLength="1" d="' + escala(p) + '"/>'; }).join("") + "</svg>";
    capa.innerHTML = '<div class="rb-sc">' + svg + '<div class="pal" style="font-size:' + F + 'px">' + esc(texto) + "</div></div>";
    var nodo = capa.querySelector(".rb-sc"), pal = capa.querySelector(".pal"), ps = capa.querySelectorAll("path");
    gsap.set(nodo, { x: x, y: y, xPercent: -50, yPercent: -50, rotation: -3 });
    var fin = t0 + dur;
    tl.set(nodo, { visibility: "visible" }, t0);
    tl.fromTo(pal, { autoAlpha: 0, y: 24, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.32, ease: "back.out(2)", immediateRender: true }, t0);
    tl.fromTo(ps, { visibility: "hidden" }, { visibility: "visible", duration: 0.01, stagger: 0.22, immediateRender: true }, t0 + 0.38);
    tl.fromTo(ps, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, autoRound: false, duration: circ ? 0.6 : 0.32, ease: "power2.inOut", stagger: 0.22, immediateRender: true }, t0 + 0.38);
    tl.to(nodo, { rotation: -1, duration: Math.max(0.4, dur - 1.5), ease: "sine.inOut" }, t0 + 1.0);
    tl.to(nodo, { autoAlpha: 0, scale: 0.92, duration: 0.22, ease: "power2.in" }, fin - 0.25);
    return { zona: "arriba" };
  };
})();
