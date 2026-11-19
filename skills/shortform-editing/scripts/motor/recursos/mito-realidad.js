// Resource "mito-realidad": two paper cards under the chin. First the colores.linea card "lo que creemos"
// with the myth, crossed out by hand in the accent colour; then on top, slightly tilted and with
// colores.extra tape, the colores.fondo card "lo que pasa" with the reality.
// opts:
//   mito      (str)  short phrase (<= 60 characters to fit in 2 lines).
//   realidad  (str)  short phrase; *word* = italic in the accent colour.
//   etiquetas (list of 2 str)  default ["lo que creemos", "lo que pasa"].
//   grande    (bool) phone size (~1.3x, 62-66 px phrases). Default true.
// Fonts: titulos (labels), texto (phrases). zona: "pantalla" (lower-band card: captions hide while it is
// on screen; a plan-level "zona" overrides it).
(function () {
  window.REC = window.REC || {};
  var W = 1080, H = 1920;
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function css(M) {
    if (document.getElementById("css-mito-realidad")) return;
    var s = document.createElement("style"); s.id = "css-mito-realidad";
    s.textContent =
      ".rb-mr{position:absolute;left:0;right:0;color:" + M.trazo + "}" +
      ".rb-mr .tj{position:relative;border-radius:30px;padding:30px 40px 36px;box-shadow:0 16px 40px " + M.rgba(M.trazo, .22) + ",0 2px 5px " + M.rgba(M.trazo, .12) + "}" +
      ".rb-mr .uno{margin-left:64px;width:780px;background:" + M.linea + ";transform:rotate(-2deg)}" +
      ".rb-mr .dos{margin-left:200px;width:820px;margin-top:-4px;background:" + M.fondo + ";transform:rotate(1.6deg)}" +
      ".rb-mr .eti{display:inline-block;font:700 25px/1 '" + M.titulos + "';letter-spacing:.1em;text-transform:uppercase;border-radius:20px;padding:9px 18px 10px;margin-bottom:16px}" +
      ".rb-mr .uno .eti{background:" + M.fondo + ";color:" + M.trazo + "}" +
      ".rb-mr .dos .eti{background:" + M.extra + ";color:" + M.trazo + "}" +
      ".rb-mr .fr{position:relative;font:500 50px/1.12 '" + M.cuerpo + "';letter-spacing:-.01em}" +
      ".rb-mr .uno .fr{font-size:46px;color:" + M.rgba(M.trazo, .82) + "}" +
      ".rb-mr .fr em{font-style:italic;color:" + M.acento + ";font-weight:600}" +
      ".rb-mr .pw{position:relative;white-space:nowrap}" +
      ".rb-mr .tacha{position:absolute;left:-7px;top:.36em;width:calc(100% + 14px);height:.36em;overflow:visible}" +
      ".rb-mr .tacha path{fill:none;stroke:" + M.acento + ";stroke-width:8;stroke-linecap:round;vector-effect:non-scaling-stroke}" +
      ".rb-mr .cinta{position:absolute;top:-24px;left:50%;width:190px;height:52px;margin-left:-95px;background:" + M.rgba(M.extra, .82) + ";transform:rotate(-4deg);transform-origin:0 50%}" +
      // "grande" (default): ~1.3x for the phone, staying above 88 % of height and out of the right 8 %
      ".rb-mr.grande .tj{padding:18px 32px 22px;border-radius:34px}" +
      ".rb-mr.grande .uno{margin-left:40px;width:900px}" +
      ".rb-mr.grande .dos{margin-left:96px;width:880px;margin-top:6px}" +
      ".rb-mr.grande .eti{font-size:31px;padding:9px 18px 10px;margin-bottom:10px}" +
      ".rb-mr.grande .fr{font-size:64px;line-height:1.06}" +
      ".rb-mr.grande .uno .fr{font-size:58px}";
    document.head.appendChild(s);
  }
  window.REC["mito-realidad"] = function (tl, capa, t0, dur, opts, ctx) {
    var M = window.MARCA(ctx);
    css(M);
    opts = opts || {};
    var mito = String(opts.mito || "Para empezar hace falta tenerlo todo claro");
    var real = String(opts.realidad || "Se empieza con dudas y *se aclara andando*");
    var et = opts.etiquetas || ["lo que creemos", "lo que pasa"];
    var c = (ctx && ctx.cara) || {};
    var grande = opts.grande != null ? !!opts.grande : true;
    var top = Math.round((c.barbilla != null ? c.barbilla : .47) * H + (grande ? 2 : 44));
    // word-by-word strike (each word has its own stroke, revealed in a chain): does not depend on measuring text
    var pals = mito.split(/\s+/), mitoHtm = pals.map(function (w, i) {
      var y1 = 9 + (i % 3) - 1, y2 = 11 - (i % 2) * 2;
      return '<span class="pw">' + esc(w) + '<svg class="tacha" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0,' + y1 + " C30," + (y1 - 3) + " 70," + (y2 + 3) + " 100," + y2 + '"/></svg></span>';
    }).join(" ");
    capa.innerHTML = '<div class="rb-mr' + (grande ? " grande" : "") + '" style="top:' + top + 'px">' +
      '<div class="tj uno"><div class="eti">' + esc(et[0]) + '</div><div class="fr">' + mitoHtm + '</div></div>' +
      '<div class="tj dos"><div class="cinta"></div><div class="eti">' + esc(et[1]) + '</div><div class="fr">' +
      esc(real).replace(/\*(.+?)\*/g, "<em>$1</em>") + "</div></div></div>";
    var uno = capa.querySelector(".uno"), dos = capa.querySelector(".dos"), tacha = capa.querySelectorAll(".tacha"), cinta = capa.querySelector(".cinta");
    var fin = t0 + dur;
    var tT = t0 + Math.min(0.6, dur * 0.18), tD = tT + 0.7;
    tl.fromTo(uno, { autoAlpha: 0, y: 70, rotation: -6 }, { autoAlpha: 1, y: 0, rotation: -2, duration: 0.45, ease: "power3.out", immediateRender: true }, t0);
    var pt = 0.6 / tacha.length;
    tl.fromTo(tacha, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: pt, ease: "none", stagger: pt, immediateRender: true }, tT);
    tl.to(uno, { scale: 0.97, duration: 0.3, ease: "power2.out" }, tT + 0.4);
    tl.fromTo(dos, { autoAlpha: 0, y: 90, rotation: 7, scale: 0.92 }, { autoAlpha: 1, y: 0, rotation: 1.6, scale: 1, duration: 0.5, ease: "back.out(1.6)", immediateRender: true }, tD);
    tl.fromTo(cinta, { scaleX: 0 }, { scaleX: 1, duration: 0.25, ease: "power2.out", immediateRender: true }, tD + 0.35);
    tl.to(dos, { y: -6, duration: Math.max(0.4, fin - tD - 1.0), ease: "sine.inOut" }, tD + 0.5);
    tl.to([uno, dos], { autoAlpha: 0, y: "+=40", duration: 0.28, ease: "power2.in", stagger: 0.05 }, fin - 0.33);
    return { zona: "pantalla" };   // lower-band card: captions hide while it is on screen
  };
})();
