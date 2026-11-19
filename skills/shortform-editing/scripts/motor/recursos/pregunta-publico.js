// Resource "pregunta-publico": a question box / poll card (no Instagram logos) under the chin. Question in
// fuentes.texto, two options in pills (colores.extra / colores.suave); one gets a hand-drawn tick and, with
// percentages, the bars fill up.
// opts:
//   pregunta    (str)   <= 48 characters (2 lines at 66 px). *word* = italic in the accent colour.
//   opciones    (list of 2 str)  short (<= 18 characters).
//   marca       (int)   index of the ticked option. Default 0. null = none.
//   porcentajes (list of 2 num, optional)  e.g. [78, 22]: result bars.
//   etiqueta    (str)   card label. Default "te pregunto".
// zona: "pantalla" (lower-band card: captions hide while it is
// on screen; a plan-level "zona" overrides it).
(function () {
  window.REC = window.REC || {};
  var W = 1080, H = 1920;
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function css(M) {
    if (document.getElementById("css-pregunta-publico")) return;
    var s = document.createElement("style"); s.id = "css-pregunta-publico";
    s.textContent =
      ".rb-pp{position:absolute;left:56px;right:104px;background:" + M.fondo + ";border-radius:44px;padding:22px 34px 26px;color:" + M.trazo + ";" +
      "box-shadow:0 18px 46px " + M.rgba(M.trazo, .24) + ",0 2px 6px " + M.rgba(M.trazo, .12) + "}" +
      ".rb-pp .cab{display:flex;align-items:center;gap:16px;margin-bottom:8px}" +
      ".rb-pp .eti{font:700 32px/1 '" + M.titulos + "';letter-spacing:.1em;text-transform:uppercase;background:" + M.suave + ";border-radius:24px;padding:10px 20px 11px}" +
      ".rb-pp .cab svg{overflow:visible}" +
      ".rb-pp .cab path{fill:" + M.linea + ";stroke:" + M.trazo + ";stroke-width:4.5;stroke-linecap:round;stroke-linejoin:round}" +
      ".rb-pp .q{font:500 66px/1.08 '" + M.cuerpo + "';letter-spacing:-.012em;margin-bottom:10px;text-wrap:balance}" +
      ".rb-pp .q em{font-style:italic;color:" + M.acento + ";font-weight:600}" +
      ".rb-pp .op{position:relative;height:94px;border-radius:47px;margin-top:12px;overflow:hidden;display:flex;align-items:center;" +
      "padding:0 32px 0 22px;font:650 56px/1 '" + M.titulos + "';letter-spacing:-.015em;border:5px solid " + M.trazo + "}" +
      ".rb-pp .op .bar{position:absolute;left:0;top:0;bottom:0;transform-origin:0 50%}" +
      ".rb-pp .op .rad{position:relative;flex:none;width:58px;height:58px;border-radius:50%;border:6px solid " + M.trazo + ";background:" + M.fondo + ";margin-right:20px}" +
      ".rb-pp .op .rad svg{position:absolute;left:-6px;top:-6px;overflow:visible}" +
      ".rb-pp .op .rad path{fill:none;stroke:" + M.fondo + ";stroke-width:7;stroke-linecap:round;stroke-linejoin:round}" +
      ".rb-pp .op .tx{position:relative;flex:1}" +
      ".rb-pp .op .pc{position:relative;font-weight:800}";
    document.head.appendChild(s);
  }
  window.REC["pregunta-publico"] = function (tl, capa, t0, dur, opts, ctx) {
    var M = window.MARCA(ctx);
    var FONDO = [M.extra, M.suave], CLARO = [M.rgba(M.extra, .38), M.rgba(M.suave, .38)];
    css(M);
    opts = opts || {};
    var preg = String(opts.pregunta || "¿Te ha pasado *alguna vez*?");
    var ops = (opts.opciones && opts.opciones.length ? opts.opciones : ["sí, más de una vez", "no, nunca"]).slice(0, 2);
    var marca = opts.marca === null ? -1 : (opts.marca != null ? opts.marca : 0);
    var pcs = opts.porcentajes;
    var c = (ctx && ctx.cara) || {};
    var top = Math.round((c.barbilla != null ? c.barbilla : .47) * H + 14);   // phone size: starts right under the chin so it stays above 88 %
    var bocadillo = '<svg width="60" height="52" viewBox="0 0 46 40"><path d="M6,4 C18,1 32,2 42,5 C45,14 44,22 41,28 C34,30 26,30 20,30 L9,38 L11,29 C6,28 3,26 3,22 C2,15 3,9 6,4 Z"/></svg>';
    var htm = '<div class="rb-pp" style="top:' + top + 'px"><div class="cab">' + bocadillo + '<div class="eti">' + esc(opts.etiqueta || "te pregunto") + "</div></div>" +
      '<div class="q">' + esc(preg).replace(/\*(.+?)\*/g, "<em>$1</em>") + "</div>";
    ops.forEach(function (o, i) {
      var pc = pcs ? Math.max(0, Math.min(100, +pcs[i] || 0)) : 100;
      htm += '<div class="op" style="background:' + CLARO[i % 2] + '"><div class="bar" style="width:' + pc + "%;background:" + FONDO[i % 2] + '"></div>' +
        '<div class="rad"><svg width="58" height="58" viewBox="0 0 44 44"><path pathLength="1" d="M11,23 L19,31 L34,13"/></svg></div>' +
        '<div class="tx">' + esc(o) + "</div>" + (pcs ? '<div class="pc">' + pc + " %</div>" : "") + "</div>";
    });
    capa.innerHTML = htm + "</div>";
    var card = capa.querySelector(".rb-pp"), q = capa.querySelector(".q"), cab = capa.querySelector(".cab");
    var opEls = capa.querySelectorAll(".op"), bars = capa.querySelectorAll(".bar"), pcEls = capa.querySelectorAll(".pc");
    var fin = t0 + dur;
    tl.fromTo(card, { autoAlpha: 0, y: 80, rotation: 2.5, scale: 0.94 }, { autoAlpha: 1, y: 0, rotation: -1, scale: 1, duration: 0.5, ease: "back.out(1.5)", immediateRender: true }, t0);
    tl.fromTo(cab, { autoAlpha: 0, x: -20 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: "power2.out", immediateRender: true }, t0 + 0.15);
    tl.fromTo(opEls, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.32, ease: "power3.out", stagger: 0.1, immediateRender: true }, t0 + 0.32);
    // bars: empty until the vote
    var tv = t0 + Math.min(1.1, dur * 0.38);
    tl.fromTo(bars, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power2.out", immediateRender: true }, tv);
    if (pcEls.length) tl.fromTo(pcEls, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, immediateRender: true }, tv + 0.3);
    if (marca >= 0 && marca < opEls.length) {
      var el = opEls[marca], rad = el.querySelector(".rad"), tic = el.querySelector(".rad path");
      tl.fromTo(rad, { backgroundColor: M.fondo }, { backgroundColor: M.trazo, duration: 0.12, immediateRender: true }, tv - 0.05);
      tl.fromTo(tic, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, autoRound: false, duration: 0.28, ease: "power2.out", immediateRender: true }, tv + 0.02);
      tl.fromTo(el, { scale: 1 }, { scale: 1.045, duration: 0.14, ease: "power2.out", yoyo: true, repeat: 1, immediateRender: false }, tv - 0.05);
      for (var k = 0; k < opEls.length; k++) if (k !== marca) tl.to(opEls[k], { opacity: 0.6, duration: 0.25 }, tv + 0.2);
    }
    tl.to(card, { rotation: 0, y: -5, duration: Math.max(0.4, fin - t0 - 1.2), ease: "sine.inOut" }, t0 + 0.6);
    tl.to(card, { autoAlpha: 0, y: "+=50", duration: 0.28, ease: "power2.in" }, fin - 0.3);
    return { zona: "pantalla" };   // lower-band card: captions hide while it is on screen
  };
})();
