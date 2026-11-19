// Resource "frase-remate": a big italic phrase (body font), 1-2 lines, on the free wall above the head.
// Enters with blur 8px->0 and scale 1.06->1 (0.5 s, power3.out); the highlighted word goes in the accent
// colour with a hand-drawn underline. Leaves with fade and blur (0.35 s).
// opts:
//   texto   (str)  the phrase. "\n" forces a line break; otherwise the browser balances the lines.
//   resalta (str)  optional word (or chunk) of `texto` highlighted with an underline.
//   tinta   (str)  optional, "clara" (colores.texto with shadow, default) or "oscura" (colores.trazo with a
//                  light halo, only for very light walls).
//   tam     (num)  optional size in px (default 112; shrinks only if it does not fit).
//   ocultar_subs (bool) optional: true when the phrase repeats what is said; captions hide meanwhile.
// Fonts: texto (fuentes.texto). zona: "arriba" (or "pantalla" with ocultar_subs).
(function () {
  window.REC = window.REC || {};
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function css(M) {
    if (document.getElementById("css-frase-remate")) return;
    var s = document.createElement("style"); s.id = "css-frase-remate";
    s.textContent =
      ".fr-remate{position:absolute;left:70px;right:70px;display:flex;align-items:flex-end;justify-content:center;text-align:center}" +
      ".fr-remate .fr-in{font-family:'" + M.cuerpo + "';font-style:italic;font-weight:400;letter-spacing:-.015em;line-height:1.04;" +
      "text-wrap:balance;transform-origin:50% 60%;will-change:transform,filter,opacity}" +
      ".fr-remate.oscura .fr-in{color:" + M.trazo + ";text-shadow:0 0 28px " + M.rgba(M.fondo, .75) + ",0 0 6px " + M.rgba(M.fondo, .5) + "}" +
      ".fr-remate.clara .fr-in{color:" + M.texto + ";font-weight:500;text-shadow:0 2px 3px " + M.rgba(M.trazo, .35) + ",0 4px 26px " + M.rgba(M.trazo, .6) + "}" +
      ".fr-remate .fr-res{position:relative;display:inline-block;color:" + M.acento + ";font-weight:600}" +
      ".fr-remate.clara .fr-res{color:" + M.claro + ";font-weight:700}" +
      ".fr-remate .fr-sub{position:absolute;left:-4%;width:108%;bottom:-.3em;height:.3em;overflow:visible}" +
      ".fr-remate .fr-sub path{fill:none;stroke:" + M.acento + ";stroke-width:7;stroke-linecap:round;stroke-linejoin:round}" +
      ".fr-remate.clara .fr-sub path{stroke:" + M.suave + "}";
    document.head.appendChild(s);
  }
  window.REC["frase-remate"] = function (tl, capa, t0, dur, opts, ctx) {
    var M = window.MARCA(ctx);
    css(M);
    opts = opts || {};
    var cara = (ctx && ctx.cara) || { arriba: 0.14 };
    var tam = opts.tam || 112;
    // Free gap: from 130 px (below the Instagram header) to a bit above the forehead (hair takes ~120 px more).
    // Capped at 390 px: hair often reaches higher than the median face box says.
    var bajo = Math.round(Math.min(390, Math.max(330, cara.arriba * 1920 - 130)));
    var texto = esc(opts.texto || "Menos es más.").replace(/\n/g, "<br>");
    var res = opts.resalta ? esc(opts.resalta) : "";
    if (res && texto.indexOf(res) >= 0) {
      texto = texto.replace(res, '<span class="fr-res">' + res +
        '<svg class="fr-sub" viewBox="0 0 200 20" preserveAspectRatio="none"><path d="M3 13 C 40 6, 90 4, 130 8 S 185 14, 197 7"/></svg></span>');
    }
    capa.innerHTML = '<div class="fr-remate ' + (opts.tinta === "oscura" ? "oscura" : "clara") + '" style="top:130px;height:' + (bajo - 130) + 'px">' +
      '<div class="fr-in" style="font-size:' + tam + 'px">' + texto + "</div></div>";
    var caja = capa.querySelector(".fr-remate"), inn = capa.querySelector(".fr-in");
    // Si no cabe en el hueco, se reduce el cuerpo. Se estima por número de letras (no se mide el DOM:
    // al cargar la página la fuente aún puede no estar lista y el resultado no sería determinista).
    var crudo = String(opts.texto || ""), alto = bajo - 130;
    function lineas(t) {
      var cpl = 940 / (t * 0.43);
      return crudo.split("\n").reduce(function (n, l) { return n + Math.max(1, Math.ceil(l.length / cpl)); }, 0);
    }
    while (tam > 60 && lineas(tam) * tam * 1.06 > alto) tam -= 6;
    inn.style.fontSize = tam + "px";
    var path = capa.querySelector(".fr-sub path");

    tl.fromTo(inn, { opacity: 0, scale: 1.06, filter: "blur(8px)", y: 10 },
      { opacity: 1, scale: 1, filter: "blur(0px)", y: 0, duration: 0.5, ease: "power3.out", immediateRender: true }, t0);
    // Respira muy poco mientras está en pantalla.
    tl.to(inn, { scale: 1.015, duration: Math.max(0.4, dur - 1.0), ease: "sine.inOut" }, t0 + 0.55);
    if (path) {
      var L = 260;
      path.style.strokeDasharray = L;
      tl.fromTo(path, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: 0.55, ease: "power1.inOut", immediateRender: true }, t0 + 0.45);
    }
    tl.to(inn, { opacity: 0, filter: "blur(6px)", y: -8, duration: 0.35, ease: "power2.in" }, t0 + dur - 0.35);
    return { zona: opts.ocultar_subs ? "pantalla" : "arriba" };
  };
})();
