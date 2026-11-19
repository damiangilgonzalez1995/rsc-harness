// Resource "personas" (tender tone): a light card under the chin with a row of line figures (head and
// shoulders, no features, each slightly different) drawn one by one; then they light up together in the
// brand colours and do a small wave, a hand-drawn line joins them at the shoulders and a line heart pops
// above the middle one. For "we are not the only ones".
// opts:
//   n       (int)  figures, 5-9. Default 7.
//   ticks   ({juntos, corazon})  seconds from t0 when they light up and when the heart appears.
//                  Default 2.1 and dur-1.4.
//   semilla (int)  size variation. Default 9.
// Brand colours: fondo (card), trazo (lines), acento (joining line), suave/extra/linea (fills).
// Size: 934x300 px from chin + 36 px, bottom edge kept at or above 87 % of the height. zona: "pantalla" (lower-band card: captions hide while it is
// on screen; a plan-level "zona" overrides it).
(function () {
  window.REC = window.REC || {};
  var W = 1080, H = 1920, CW = 934, CH = 300;
  function rng(a) { return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function css(M) {
    if (document.getElementById("css-personas")) return;
    var s = document.createElement("style"); s.id = "css-personas";
    s.textContent =
      ".pe{position:absolute;left:56px;width:" + CW + "px;height:" + CH + "px;border-radius:40px;background:" + M.rgba(M.fondo, .97) + ";" +
      "box-shadow:0 24px 60px " + M.rgba(M.trazo, .22) + ",0 2px 0 rgba(255,255,255,.9) inset;visibility:hidden}" +
      ".pe svg{position:absolute;left:0;top:0;overflow:visible}" +
      ".pe .tz{fill:none;stroke:" + M.trazo + ";stroke-width:6;stroke-linecap:round;stroke-linejoin:round}" +
      ".pe .rl{stroke:none}" +
      ".pe .une{fill:none;stroke:" + M.acento + ";stroke-width:5;stroke-linecap:round}" +
      ".pe .cz{fill:" + M.suave + ";stroke:" + M.trazo + ";stroke-width:5;stroke-linejoin:round}";
    document.head.appendChild(s);
  }
  var CORA = "M0,26 C-17,13 -34,3 -32,-12 C-30,-26 -12,-29 0,-14 C12,-30 31,-26 33,-11 C35,4 17,14 0,26 Z";
  window.REC["personas"] = function (tl, capa, t0, dur, opts, ctx) {
    var M = window.MARCA(ctx);
    css(M); opts = opts || {};
    var cara = (ctx && ctx.cara) || { barbilla: 0.62 };
    var top = Math.min(Math.round(cara.barbilla * H + 36), Math.round(H * 0.87) - CH);
    var n = Math.max(5, Math.min(9, opts.n || 7)), R = rng(opts.semilla || 9), tk = opts.ticks || {};
    var tJ = tk.juntos != null ? tk.juntos : 2.1, tC = tk.corazon != null ? tk.corazon : dur - 1.4;
    var cols = [M.suave, M.extra, M.linea, M.suave, M.extra, M.linea, M.suave, M.extra, M.linea];
    var paso = (CW - 120) / (n - 1), base = CH - 34, svg = "", hombros = [];
    for (var i = 0; i < n; i++) {
      var cx = 60 + i * paso, r = 27 + R() * 8, bw = 44 + R() * 10, bh = 70 + R() * 22, cy = base - bh - r - 10;
      var cuerpo = "M" + (cx - bw).toFixed(1) + "," + base + " C" + (cx - bw).toFixed(1) + "," + (base - bh).toFixed(1) + " " + (cx + bw).toFixed(1) + "," + (base - bh).toFixed(1) + " " + (cx + bw).toFixed(1) + "," + base;
      var cabeza = "M" + cx.toFixed(1) + "," + (cy - r).toFixed(1) + " C" + (cx + r * 1.36).toFixed(1) + "," + (cy - r).toFixed(1) + " " + (cx + r * 1.36).toFixed(1) + "," + (cy + r).toFixed(1) + " " + cx.toFixed(1) + "," + (cy + r).toFixed(1) +
        " C" + (cx - r * 1.36).toFixed(1) + "," + (cy + r).toFixed(1) + " " + (cx - r * 1.36).toFixed(1) + "," + (cy - r).toFixed(1) + " " + (cx + 2).toFixed(1) + "," + (cy - r - 1).toFixed(1);
      hombros.push([cx, base - bh * 0.62]);
      svg += '<g class="pp" data-cy="' + cy.toFixed(1) + '"><path class="rl" fill="' + cols[i] + '" d="' + cuerpo + ' Z"/><circle class="rl" fill="' + cols[i] + '" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + r.toFixed(1) + '"/>' +
        '<path class="tz" d="' + cabeza + '"/><path class="tz" d="' + cuerpo + '"/></g>';
    }
    var une = "M" + hombros.map(function (h, i) { return (h[0]).toFixed(1) + "," + (h[1] + (i % 2 ? 6 : -4)).toFixed(1); }).join(" L");
    var mid = hombros[Math.floor(n / 2)];
    capa.innerHTML = '<div class="pe" style="top:' + top + 'px"><svg width="' + CW + '" height="' + CH + '">' + '<path class="une" d="' + une + '"/>' + svg +
      '<path class="cz" transform="translate(' + mid[0].toFixed(1) + ',' + 40 + ')" d="' + CORA + '"/></svg></div>';
    var pe = capa.querySelector(".pe"), fin = t0 + dur;
    tl.fromTo(pe, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out", immediateRender: true }, t0);
    var gs = capa.querySelectorAll(".pp"), ap = Math.max(0.12, Math.min(0.24, (tJ - 0.7) / n));
    gs.forEach(function (g, i) {
      var t = t0 + 0.3 + i * ap;
      g.querySelectorAll(".tz").forEach(function (p) {
        var l = p.getTotalLength();
        tl.fromTo(p, { strokeDasharray: l, strokeDashoffset: l, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, duration: 0.45, ease: "power2.out", immediateRender: true }, t);
      });
      tl.fromTo(g.querySelectorAll(".rl"), { opacity: 0 }, { opacity: 0.0, duration: 0.01, immediateRender: true }, t);
      // juntas: se encienden y hacen la ola
      tl.to(g.querySelectorAll(".rl"), { opacity: 1, duration: 0.35, ease: "power1.out" }, t0 + tJ + i * 0.06);
      tl.to(g, { y: -16, duration: 0.2, ease: "power2.out", yoyo: true, repeat: 1 }, t0 + tJ + i * 0.06);
    });
    var u = capa.querySelector(".une"), lu = u.getTotalLength();
    tl.fromTo(u, { strokeDasharray: lu, strokeDashoffset: lu, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, duration: 0.7, ease: "power2.inOut", immediateRender: true }, t0 + tJ + 0.15);
    var cz = capa.querySelector(".cz");
    tl.fromTo(cz, { opacity: 0, scale: 0.2, transformOrigin: "50% 100%" }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2.4)", immediateRender: true }, t0 + tC);
    tl.to(cz, { y: -6, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 1 }, t0 + tC + 0.45);
    tl.to(pe, { autoAlpha: 0, y: 40, duration: 0.3, ease: "power2.in" }, fin - 0.32);
    return { zona: "pantalla" };   // lower-band card: captions hide while it is on screen
  };
})();
