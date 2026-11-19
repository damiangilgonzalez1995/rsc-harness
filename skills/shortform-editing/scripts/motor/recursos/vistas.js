// Resource "vistas": one reel thumbnail on the free side with two pills below it (views with a play icon,
// likes with a line heart) whose numbers climb faster and faster, and line hearts floating out of the card.
// For "online this works / it reaches more people".
// opts:
//   img      (int|str)  thumbnail: n-th file of reels/marca/miniaturas (1-based) or a file name. Default 16.
//   x, y     (num)      top-left of the card in px. Default 46, 560.
//   ancho    (num)      card width. Default 236.
//   de, a    (num)      views at start and end. Default 3400 -> 4200000.
//   likes    (num)      likes / views ratio. Default 0.072.
//   en       (num)      seconds from t0 when it starts climbing. Default 0.5.
//   sube     (num)      seconds it takes to climb. Default dur - en - 1.
//   corazones(int)      floating hearts. Default 12.
//   semilla  (int)      default 3.
// Brand colours: fondo (pills), trazo, acento, suave, extra, linea (hearts).
// zona: "lado" (does not move the captions).
(function () {
  window.REC = window.REC || {};
  function rng(a) { return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  var CORA = "M17,29 C8,22 3,17 3,11 C3,6.5 6.5,3.5 10.5,3.5 C13.5,3.5 15.8,5.4 17,8 C18.2,5.4 20.5,3.5 23.5,3.5 C27.5,3.5 31,6.5 31,11 C31,17 26,22 17,29 Z";
  function css(M) {
    if (document.getElementById("css-vistas")) return;
    var s = document.createElement("style"); s.id = "css-vistas";
    s.textContent =
      ".vi-tj{position:absolute;border-radius:22px;overflow:hidden;visibility:hidden;" +
      "box-shadow:0 18px 40px " + M.rgba(M.trazo, .32) + ",0 2px 5px " + M.rgba(M.trazo, .18) + ",0 0 0 4px " + M.rgba(M.fondo, .95) + "}" +
      ".vi-tj img{display:block;width:100%;height:100%;object-fit:cover}" +
      ".vi-p{position:absolute;display:flex;align-items:center;gap:14px;height:80px;padding:0 28px 0 22px;border-radius:40px;" +
      "background:" + M.rgba(M.fondo, .97) + ";color:" + M.trazo + ";font:700 46px/1 '" + M.titulos + "';letter-spacing:-.01em;white-space:nowrap;" +
      "box-shadow:0 12px 28px " + M.rgba(M.trazo, .24) + ";visibility:hidden;font-variant-numeric:tabular-nums}" +
      ".vi-p svg{width:34px;height:34px;overflow:visible;flex:none}" +
      ".vi-p .pl{fill:" + M.acento + ";stroke:" + M.acento + ";stroke-width:4;stroke-linejoin:round}" +
      ".vi-p .co{fill:" + M.suave + ";stroke:" + M.acento + ";stroke-width:3.4;stroke-linejoin:round}" +
      ".vi-c{position:absolute;left:0;top:0;width:58px;height:58px;visibility:hidden;overflow:visible}" +
      ".vi-c path{stroke-width:3.2;stroke-linejoin:round}";
    document.head.appendChild(s);
  }
  function fmt(n) {
    n = Math.round(n);
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(".", ",") + " M";
    if (n >= 1e4) return (Math.round(n / 100) / 10).toFixed(1).replace(".", ",") + " mil";
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  window.REC["vistas"] = function (tl, capa, t0, dur, opts, ctx) {
    var M = window.MARCA(ctx);
    css(M); opts = opts || {};
    var x = opts.x != null ? opts.x : 46, y = opts.y != null ? opts.y : 560, aw = opts.ancho || 236, ah = Math.round(aw * 16 / 9);
    var de = opts.de || 3400, a = opts.a || 4200000, lk = opts.likes || 0.072;
    var en = opts.en != null ? opts.en : 0.5, sube = opts.sube || Math.max(1, dur - en - 1);
    var n = opts.corazones != null ? opts.corazones : 12, R = rng(opts.semilla || 3);
    var cols = [[M.fondo, M.acento], [M.suave, M.trazo], [M.linea, M.acento], [M.extra, M.trazo]];
    var html = '<div class="vi-tj" style="left:' + x + "px;top:" + y + "px;width:" + aw + "px;height:" + ah + 'px">' + M.imagen(opts.img || 16, 0) + "</div>" +
      '<div class="vi-p v1" style="left:' + x + "px;top:" + (y + ah + 26) + 'px"><svg viewBox="0 0 34 34"><path class="pl" d="M9,5 L29,17 L9,29 Z"/></svg><b>0</b></div>' +
      '<div class="vi-p v2" style="left:' + x + "px;top:" + (y + ah + 120) + 'px"><svg viewBox="0 0 34 34"><path class="co" d="' + CORA + '"/></svg><b>0</b></div>';
    for (var i = 0; i < n; i++) { var c = cols[i % cols.length]; html += '<svg class="vi-c" viewBox="0 0 34 34"><path d="' + CORA + '" fill="' + c[0] + '" stroke="' + c[1] + '"/></svg>'; }
    capa.innerHTML = html;
    var tj = capa.querySelector(".vi-tj"), p1 = capa.querySelector(".v1"), p2 = capa.querySelector(".v2");
    var b1 = p1.querySelector("b"), b2 = p2.querySelector("b"), fin = t0 + dur;
    b1.textContent = fmt(de); b2.textContent = fmt(de * lk);
    tl.fromTo(tj, { autoAlpha: 0, y: 60, rotation: -5, scale: 0.9 }, { autoAlpha: 1, y: 0, rotation: -2, scale: 1, duration: 0.55, ease: "back.out(1.4)", immediateRender: true }, t0);
    tl.fromTo(p1, { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: "power3.out", immediateRender: true }, t0 + 0.2);
    tl.fromTo(p2, { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: "power3.out", immediateRender: true }, t0 + 0.32);
    var o = { v: 0 };
    tl.fromTo(o, { v: 0 }, { v: 1, duration: sube, ease: "power1.in", immediateRender: false, onUpdate: function () {
      var val = de * Math.pow(a / de, o.v); b1.textContent = fmt(val); b2.textContent = fmt(val * lk); } }, t0 + en);
    // latido de la tarjeta cuando se dispara
    tl.to(tj, { scale: 1.04, duration: 0.18, ease: "power2.out", yoyo: true, repeat: 1 }, t0 + en + sube * 0.8);
    // corazones: nacen en el borde derecho de la tarjeta y suben haciendo eses, cada vez más seguidos
    capa.querySelectorAll(".vi-c").forEach(function (h, i) {
      var f = i / Math.max(1, n - 1), ts = t0 + en + sube * (1 - Math.pow(1 - f, 1.6)) * 0.95;
      var sx = x + aw - 30 + (R() - 0.5) * 40, sy = y + ah * (0.55 + R() * 0.3), s = 0.75 + R() * 0.6;
      var vida = 1.5 + R() * 0.6, alto = 300 + R() * 220, dx = (R() - 0.75) * 110;
      tl.set(h, { x: sx, y: sy, scale: 0.2, rotation: (R() - 0.5) * 30, autoAlpha: 0 }, t0);
      tl.to(h, { autoAlpha: 1, scale: s, duration: 0.22, ease: "back.out(2)" }, ts);
      tl.to(h, { y: sy - alto, duration: vida, ease: "sine.out" }, ts);
      tl.to(h, { x: sx + dx, duration: vida / 2, ease: "sine.inOut", yoyo: true, repeat: 1 }, ts);
      tl.to(h, { autoAlpha: 0, duration: 0.35 }, Math.min(ts + vida - 0.35, fin - 0.35));
    });
    tl.to([tj, p1, p2], { autoAlpha: 0, y: "+=30", duration: 0.3, ease: "power2.in", stagger: 0.04 }, fin - 0.38);
    return { zona: "lado" };
  };
})();
