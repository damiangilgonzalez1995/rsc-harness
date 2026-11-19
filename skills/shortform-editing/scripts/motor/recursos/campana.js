// Resource "campana": a light card under the chin with a hand-drawn normal (bell) curve that draws itself;
// below it, line figures stacked like a histogram (many in the middle, very few at the ends) appearing from
// the centre outwards. Then the centre dims, the ends light up in the accent colour with a marker circle, and
// two handwritten notes ("aquí sí") with little arrows appear. For "very specific, very few people, the edges".
// opts:
//   ticks    ({poca, extremos, normal})  seconds from t0: ends light up (poca), notes are written (extremos)
//            and the centre pulses (normal). Default 2.3, 6.2 and dur-1.2.
//   nota     (str)  text of the end notes. Default "aquí sí".
//   centro   (str)  optional small note over the centre (e.g. "casi todos"). Default none.
//   semilla  (int)  stroke wobble. Default 4.
// Brand colours: fondo (card), trazo (curve, arrows), acento (ends, rings, notes), suave/extra (figures),
// linea (axis). Fonts: manuscrita (notes).
// Size: 934x400 px from chin + 36 px, bottom edge kept at or above 87 % of the height. zona: "pantalla" (lower-band card: captions hide while it is
// on screen; a plan-level "zona" overrides it).
(function () {
  window.REC = window.REC || {};
  var W = 1080, H = 1920, CW = 934, CH = 400;
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function rng(a) { return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function css(M) {
    if (document.getElementById("css-campana")) return;
    var s = document.createElement("style"); s.id = "css-campana";
    s.textContent =
      ".cg{position:absolute;left:56px;width:" + CW + "px;height:" + CH + "px;border-radius:40px;background:" + M.rgba(M.fondo, .97) + ";" +
      "box-shadow:0 24px 60px " + M.rgba(M.trazo, .22) + ",0 2px 0 rgba(255,255,255,.9) inset;visibility:hidden;transform-origin:50% 100%}" +
      ".cg svg{position:absolute;left:0;top:0;overflow:visible}" +
      ".cg .eje{stroke:" + M.linea + ";stroke-width:5;stroke-linecap:round;fill:none}" +
      ".cg .cur{stroke:" + M.trazo + ";stroke-width:6;stroke-linecap:round;stroke-linejoin:round;fill:none}" +
      ".cg .cur2{fill:" + M.suave + ";opacity:.16;stroke:none}" +
      ".cg .ring{stroke:" + M.acento + ";stroke-width:6;stroke-linecap:round;fill:none}" +
      ".cg .fl{stroke:" + M.trazo + ";stroke-width:4.5;stroke-linecap:round;stroke-linejoin:round;fill:none}" +
      ".cg .nota{font-family:'" + M.mano + "';font-weight:700;font-size:64px;fill:" + M.acento + "}" +
      ".cg .nc{font-family:'" + M.mano + "';font-weight:700;font-size:44px;fill:" + M.trazo + ";opacity:.7}";
    document.head.appendChild(s);
  }
  window.REC["campana"] = function (tl, capa, t0, dur, opts, ctx) {
    var M = window.MARCA(ctx);
    css(M); opts = opts || {};
    var cara = (ctx && ctx.cara) || { barbilla: 0.62 };
    var top = Math.min(Math.round(cara.barbilla * H + 36), Math.round(H * 0.87) - CH);
    var tk = opts.ticks || {}, tPoca = tk.poca != null ? tk.poca : 2.3, tExt = tk.extremos != null ? tk.extremos : 6.2;
    var tNor = tk.normal != null ? tk.normal : dur - 1.2, nota = esc(opts.nota || "aquí sí"), R = rng(opts.semilla || 4);
    var base = 352, x0 = 60, x1 = CW - 60, mid = CW / 2, sig = (x1 - x0) / 6.4, alto = 236;
    // curva con un pelín de temblor de mano
    var pts = [], d = "", area = "";
    for (var i = 0; i <= 60; i++) {
      var x = x0 + (x1 - x0) * i / 60, z = (x - mid) / sig, y = base - 6 - alto * Math.exp(-z * z / 2) + (R() - 0.5) * 3;
      pts.push([x, y]);
    }
    d = "M" + pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" L");
    area = d + " L" + x1 + "," + base + " L" + x0 + "," + base + " Z";
    // personitas (cabeza + hombros) apiladas por columnas
    var N = 17, paso = (x1 - x0 - 30) / (N - 1), per = [], svgP = "";
    for (var c = 0; c < N; c++) {
      var xc = x0 + 15 + c * paso, zc = (xc - mid) / sig, n = Math.round(6 * Math.exp(-zc * zc / 2));
      var ext = Math.abs(c - (N - 1) / 2) >= (N - 1) / 2;
      if (ext) n = 1; else if (n < 1) n = 0;
      for (var k = 0; k < n; k++) {
        var yc = base - 16 - k * 36, col = ext ? M.acento : ((c + k) % 3 === 0 ? M.extra : M.suave);
        per.push({ c: c, k: k, ext: ext, dist: Math.abs(c - (N - 1) / 2) * 1.35 + k * 0.4, x: xc, y: yc + 12 });
        svgP += '<g class="per' + (ext ? " ext" : " cen") + '" data-i="' + (per.length - 1) + '"><circle cx="' + xc.toFixed(1) + '" cy="' + (yc - 14) + '" r="8.5" fill="' + col + '"/>' +
          '<path d="M' + (xc - 13).toFixed(1) + "," + (yc + 12) + " C" + (xc - 13).toFixed(1) + "," + (yc - 5) + " " + (xc + 13).toFixed(1) + "," + (yc - 5) + " " + (xc + 13).toFixed(1) + "," + (yc + 12) + ' Z" fill="' + col + '"/></g>';
      }
    }
    var xa = x0 + 15, xb = x0 + 15 + (N - 1) * paso;
    function ring(cx) { return "M" + (cx - 26) + "," + (base - 52) + " C" + (cx - 6) + "," + (base - 74) + " " + (cx + 34) + "," + (base - 56) + " " + (cx + 30) + "," + (base - 20) +
      " C" + (cx + 26) + "," + (base + 8) + " " + (cx - 26) + "," + (base + 10) + " " + (cx - 32) + "," + (base - 18) + " C" + (cx - 36) + "," + (base - 40) + " " + (cx - 18) + "," + (base - 58) + " " + (cx + 4) + "," + (base - 60); }
    var svg = '<svg width="' + CW + '" height="' + CH + '" viewBox="0 0 ' + CW + " " + CH + '">' +
      '<path class="eje" d="M' + (x0 - 14) + "," + base + " L" + (x1 + 14) + "," + base + '"/>' +
      '<path class="cur2" d="' + area + '"/>' + svgP + '<path class="cur" d="' + d + '"/>' +
      '<path class="ring r1" d="' + ring(xa) + '"/><path class="ring r2" d="' + ring(xb) + '"/>' +
      '<path class="fl f1" d="M' + (xa + 70) + ",150 C" + (xa + 40) + ",170 " + (xa + 14) + ",200 " + (xa + 8) + "," + (base - 78) + " M" + (xa - 6) + "," + (base - 96) + " L" + (xa + 8) + "," + (base - 76) + " L" + (xa + 24) + "," + (base - 94) + '"/>' +
      '<path class="fl f2" d="M' + (xb - 70) + ",150 C" + (xb - 40) + ",170 " + (xb - 14) + ",200 " + (xb - 8) + "," + (base - 78) + " M" + (xb - 24) + "," + (base - 94) + " L" + (xb - 8) + "," + (base - 76) + " L" + (xb + 6) + "," + (base - 96) + '"/>' +
      '<text class="nota n1" x="' + (xa + 22) + '" y="128">' + nota + '</text>' +
      '<text class="nota n2" x="' + (xb - 22) + '" y="128" text-anchor="end">' + nota + '</text>' +
      (opts.centro ? '<text class="nc" x="' + mid + '" y="' + (base - alto - 26) + '" text-anchor="middle">' + esc(opts.centro) + '</text>' : "") +
      "</svg>";
    capa.innerHTML = '<div class="cg" style="top:' + top + 'px">' + svg + "</div>";
    var cg = capa.querySelector(".cg"), cur = capa.querySelector(".cur"), cur2 = capa.querySelector(".cur2"), fin = t0 + dur;
    var L = cur.getTotalLength();
    tl.fromTo(cg, { autoAlpha: 0, y: 60, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out", immediateRender: true }, t0);
    tl.fromTo(cur, { strokeDasharray: L, strokeDashoffset: L, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, duration: 1.2, ease: "power2.inOut", immediateRender: true }, t0 + 0.15);
    tl.fromTo(cur2, { opacity: 0 }, { opacity: 0.16, duration: 0.6, immediateRender: true }, t0 + 1.1);
    var gs = capa.querySelectorAll(".per");
    gs.forEach(function (g) {
      var p = per[+g.getAttribute("data-i")];
      tl.fromTo(g, { opacity: 0, scale: 0.2, svgOrigin: p.x + " " + p.y }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2.2)", immediateRender: true }, t0 + 0.7 + p.dist * 0.07);
    });
    var cen = capa.querySelectorAll(".per.cen"), ext = capa.querySelectorAll(".per.ext");
    // «muy poca gente»: el centro se apaga, los extremos laten y se rodean
    tl.to(cen, { opacity: 0.38, duration: 0.4, ease: "power1.out" }, t0 + tPoca);
    tl.to(cur2, { opacity: 0.07, duration: 0.4 }, t0 + tPoca);
    ext.forEach(function (g) {
      var p = per[+g.getAttribute("data-i")];
      tl.to(g, { scale: 1.5, svgOrigin: p.x + " " + p.y, duration: 0.3, ease: "back.out(2.5)" }, t0 + tPoca);
    });
    capa.querySelectorAll(".ring").forEach(function (r, i) {
      var l = r.getTotalLength();
      tl.fromTo(r, { strokeDasharray: l, strokeDashoffset: l, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, duration: 0.55, ease: "power2.out", immediateRender: true }, t0 + tPoca + 0.15 + i * 0.2);
    });
    // «rozando los extremos»: notas a mano y flechas
    capa.querySelectorAll(".fl").forEach(function (f, i) {
      var l = f.getTotalLength();
      tl.fromTo(f, { strokeDasharray: l, strokeDashoffset: l, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, duration: 0.5, ease: "power2.out", immediateRender: true }, t0 + tExt + 0.2 + i * 0.25);
    });
    tl.fromTo(capa.querySelectorAll(".nota"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", stagger: 0.25, immediateRender: true }, t0 + tExt);
    var nc = capa.querySelector(".nc");
    if (nc) tl.fromTo(nc, { opacity: 0 }, { opacity: 0.7, duration: 0.4, immediateRender: true }, t0 + 1.4);
    // «una conducta normal que todos tenemos»: el centro late una vez (sin perder el foco de los extremos)
    if (tNor < dur - 0.4) tl.to(cen, { opacity: 0.6, duration: 0.25, yoyo: true, repeat: 1, ease: "sine.inOut" }, t0 + tNor);
    tl.to(cg, { autoAlpha: 0, y: 40, duration: 0.3, ease: "power2.in" }, fin - 0.32);
    return { zona: "pantalla" };   // lower-band card: captions hide while it is on screen
  };
})();
