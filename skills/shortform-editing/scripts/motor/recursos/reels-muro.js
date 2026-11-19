// Resource "reels-muro": a wall of reel thumbnails falling in a cascade on the free side of the frame
// (columns of 9:16 cards, soft shadow, small seeded tilts) and a pill above it with a views counter
// (drawn play icon) that climbs faster and faster.
// Thumbnails come from the project's reels/marca/miniaturas/ (componer copies them into the composition;
// make invented ones with miniaturas.py). Without thumbnails the cards are plain brand gradients.
// opts:
//   imgs     (list of int|str)  number n = n-th file of reels/marca/miniaturas (1-based, wraps around),
//                               or a file name inside that folder. Default [1,9,2,13,3,5].
//   lado     (str)   "izq" | "der". Default "izq".
//   columnas (int)   1-3. Default 2.
//   ancho    (num)   card width in px. Default 140.
//   x, y     (num)   top-left of the block in px. Default x = 36 (or against the right margin), y = 330.
//                    The block never goes past 0.92*W minus a margin: the right 8 % holds Instagram's buttons.
//   cadencia (num)   seconds between cards. Default 0.16.
//   contador (obj|false)  {de, a, en, dur}: start and end figure, second (from t0) it starts climbing and how
//                         long it takes. Default {de: 1200, a: 2300000, en: 0.6, dur: dur-1.4}. false = none.
//   semilla  (int)   tilts. Default 5.
// Brand colours: fondo (pill), trazo (ink, shadows), acento (play icon), linea (empty card).
// zona: "lado" (does not move the captions).
(function () {
  window.REC = window.REC || {};
  var W = 1080, H = 1920;
  var BORDE_DER = Math.round(0.92 * W) - 24;   // right limit of the block (tilt + ring margin)
  function rng(a) { return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function css(M) {
    if (document.getElementById("css-reels-muro")) return;
    var s = document.createElement("style"); s.id = "css-reels-muro";
    s.textContent =
      ".rm-tj{position:absolute;border-radius:16px;overflow:hidden;background:" + M.linea + ";visibility:hidden;" +
      "box-shadow:0 14px 30px " + M.rgba(M.trazo, .30) + ",0 2px 4px " + M.rgba(M.trazo, .18) + ",0 0 0 3px " + M.rgba(M.fondo, .95) + "}" +
      ".rm-tj img{display:block;width:100%;height:100%;object-fit:cover}" +
      ".rm-cont{position:absolute;display:flex;align-items:center;gap:14px;height:84px;padding:0 30px 0 24px;border-radius:42px;" +
      "background:" + M.rgba(M.fondo, .97) + ";color:" + M.trazo + ";font:700 46px/1 '" + M.titulos + "';letter-spacing:-.01em;white-space:nowrap;" +
      "box-shadow:0 12px 30px " + M.rgba(M.trazo, .25) + ";visibility:hidden;font-variant-numeric:tabular-nums}" +
      ".rm-cont svg{width:34px;height:34px;overflow:visible}" +
      ".rm-cont path{fill:" + M.acento + ";stroke:" + M.acento + ";stroke-width:4;stroke-linejoin:round}";
    document.head.appendChild(s);
  }
  function fmt(n) {
    n = Math.round(n);
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(".", ",") + " M";
    if (n >= 1e4) return (Math.round(n / 100) / 10).toFixed(1).replace(".", ",") + " mil";
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  window.REC["reels-muro"] = function (tl, capa, t0, dur, opts, ctx) {
    var M = window.MARCA(ctx);
    css(M); opts = opts || {};
    var imgs = opts.imgs || [1, 9, 2, 13, 3, 5];
    var cols = Math.max(1, Math.min(3, opts.columnas || 2)), aw = opts.ancho || 140, ah = Math.round(aw * 16 / 9), gap = 22;
    var bw = cols * aw + (cols - 1) * gap;
    var der = opts.lado === "der";
    var x0 = opts.x != null ? opts.x : (der ? BORDE_DER - bw : 36), y0 = opts.y != null ? opts.y : 330;
    x0 = Math.max(0, Math.min(x0, BORDE_DER - bw));
    var cad = opts.cadencia || 0.16, R = rng(opts.semilla || 5);
    var html = "";
    imgs.forEach(function (v, i) {
      var c = i % cols, f = Math.floor(i / cols);
      var x = x0 + c * (aw + gap), y = y0 + f * (ah + gap) + (c % 2 ? 40 : 0);
      html += '<div class="rm-tj" style="left:' + x + "px;top:" + y + "px;width:" + aw + "px;height:" + ah + 'px">' + M.imagen(v, i) + "</div>";
    });
    var cont = opts.contador === false ? null : (opts.contador || {});
    // on the right the pill (no fixed width) is anchored by its right edge so it never reaches the buttons
    var ancla = der ? "right:" + (W - (x0 + bw)) : "left:" + x0;
    if (cont) html += '<div class="rm-cont" style="' + ancla + "px;top:" + (y0 - 112) + 'px"><svg viewBox="0 0 34 34"><path d="M9,5 L29,17 L9,29 Z"/></svg><b>0</b></div>';
    capa.innerHTML = html;
    var tjs = capa.querySelectorAll(".rm-tj");
    var fin = t0 + dur;
    tjs.forEach(function (el, i) {
      var r0 = (R() - 0.5) * 16, r1 = (R() - 0.5) * 5, t = t0 + 0.05 + i * cad;
      tl.fromTo(el, { autoAlpha: 0, y: -140, rotation: r0, scale: 0.86 },
        { autoAlpha: 1, y: 0, rotation: r1, scale: 1, duration: 0.55, ease: "back.out(1.5)", immediateRender: true }, t);
      tl.to(el, { y: -14 - (i % 3) * 5, duration: Math.max(0.5, fin - t - 0.9), ease: "sine.inOut" }, t + 0.55);
      tl.to(el, { autoAlpha: 0, y: "-=40", duration: 0.28, ease: "power2.in" }, fin - 0.34 + (i % 3) * 0.02);
    });
    if (cont) {
      var pill = capa.querySelector(".rm-cont"), num = pill.querySelector("b");
      var de = cont.de != null ? cont.de : 1200, a = cont.a != null ? cont.a : 2300000;
      var en = cont.en != null ? cont.en : 0.6, cd = cont.dur || Math.max(1, dur - en - 0.8);
      num.textContent = fmt(de);
      var o = { v: 0 };
      tl.fromTo(pill, { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: "power3.out", immediateRender: true }, t0 + 0.1);
      // curva exponencial: arranca despacio y se dispara
      tl.fromTo(o, { v: 0 }, { v: 1, duration: cd, ease: "power1.in", immediateRender: false,
        onUpdate: function () { num.textContent = fmt(de * Math.pow(a / de, o.v)); } }, t0 + en);
      tl.to(pill, { autoAlpha: 0, duration: 0.25 }, fin - 0.3);
    }
    return { zona: "lado" };
  };
})();
