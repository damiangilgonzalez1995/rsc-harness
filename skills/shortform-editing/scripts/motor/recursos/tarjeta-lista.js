// Resource "tarjeta-lista": a light card (40 px radius, soft shadow) under the chin. Title (fuentes.titulos
// 600) with an underline in colores.suave; 2-4 points appear one by one: the colores.extra dot pops with
// back.out(1.7) and a check is drawn inside; the current point is bold.
// opts:
//   titulo (str)        optional short title.
//   items  (str[])      2-3 short points (~24 letters per line; 4 points or 2-line points pass 88 % of height).
//   ticks  (num[])      optional seconds from t0 when each point appears (default spread 0.55 s .. dur-0.9 s).
//   lado   (str)        optional, "centro" (default, under the chin) or "derecha" (narrow right column).
// Phone sizes: title 58 px, points 58 px; the right 8 % stays free for the Instagram buttons.
// zona: "pantalla" (lower-band card: captions hide while it is
// on screen; a plan-level "zona" overrides it).
(function () {
  window.REC = window.REC || {};
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function css(M) {
    if (document.getElementById("css-tarjeta-lista")) return;
    var s = document.createElement("style"); s.id = "css-tarjeta-lista";
    s.textContent =
      ".tl-card{position:absolute;background:" + M.rgba(M.fondo, .97) + ";border-radius:40px;color:" + M.trazo + ";" +
      "box-shadow:0 24px 60px " + M.rgba(M.trazo, .20) + ",0 2px 0 rgba(255,255,255,.9) inset;padding:44px 56px 30px;transform-origin:50% 100%}" +
      ".tl-card .tl-tit{font:600 58px/1.1 '" + M.titulos + "';letter-spacing:-.015em}" +
      ".tl-card .tl-raya{height:6px;width:130px;border-radius:3px;background:" + M.suave + ";margin:18px 0 14px;transform-origin:0 50%}" +
      ".tl-card .tl-it{display:flex;align-items:flex-start;gap:30px;padding:10px 0;font:400 58px/1.16 '" + M.titulos + "';letter-spacing:-.005em}" +
      ".tl-card .tl-it + .tl-it{border-top:2px solid " + M.rgba(M.linea, .9) + "}" +
      ".tl-card .tl-txt{flex:1;padding-top:2px}" +
      ".tl-card .tl-bola{flex:none;width:64px;height:64px;border-radius:50%;background:" + M.extra + ";position:relative}" +
      ".tl-card .tl-hueco{flex:none;width:64px;height:64px;border-radius:50%;border:3px dashed " + M.linea + ";position:absolute;left:0;top:0}" +
      ".tl-card .tl-marca{flex:none;width:64px;height:64px;position:relative}" +
      ".tl-card .tl-bola svg{position:absolute;left:0;top:0;width:64px;height:64px}" +
      ".tl-card .tl-bola path{fill:none;stroke:" + M.fondo + ";stroke-width:7;stroke-linecap:round;stroke-linejoin:round}";
    document.head.appendChild(s);
  }
  window.REC["tarjeta-lista"] = function (tl, capa, t0, dur, opts, ctx) {
    var M = window.MARCA(ctx);
    css(M);
    opts = opts || {};
    var cara = (ctx && ctx.cara) || { barbilla: 0.47 };
    var items = (opts.items && opts.items.length ? opts.items : ["Punto uno", "Punto dos"]).slice(0, 4);
    var top = Math.round(cara.barbilla * 1920 + 26);
    var geo = opts.lado === "derecha" ? "right:92px;width:560px;" : "left:70px;right:92px;";
    var h = '<div class="tl-card" style="top:' + top + "px;" + geo + '">';
    if (opts.titulo) h += '<div class="tl-tit">' + esc(opts.titulo) + '</div><div class="tl-raya"></div>';
    else h += '<div style="height:6px"></div>';
    items.forEach(function (it) {
      h += '<div class="tl-it"><div class="tl-marca"><div class="tl-hueco"></div><div class="tl-bola">' +
        '<svg viewBox="0 0 56 56"><path d="M16 29 L25 38 L41 19"/></svg></div></div><div class="tl-txt">' + esc(it) + "</div></div>";
    });
    capa.innerHTML = h + "</div>";
    var card = capa.querySelector(".tl-card"), raya = capa.querySelector(".tl-raya");
    var filas = capa.querySelectorAll(".tl-it");

    tl.fromTo(card, { opacity: 0, y: 80, scale: 0.96, rotation: -1.2 },
      { opacity: 1, y: 0, scale: 1, rotation: 0, duration: 0.5, ease: "power3.out", immediateRender: true }, t0);
    if (raya) tl.fromTo(raya, { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: "power2.inOut", immediateRender: true }, t0 + 0.25);

    var n = filas.length, ini = 0.55, fin = Math.max(ini + 0.3, dur - 0.9);
    var ticks = opts.ticks && opts.ticks.length >= n ? opts.ticks :
      items.map(function (_, i) { return n === 1 ? ini : ini + (fin - ini) * i / (n - 1); });
    for (var i = 0; i < n; i++) {
      var f = filas[i], bola = f.querySelector(".tl-bola"), txt = f.querySelector(".tl-txt"), p = f.querySelector("path");
      var t = t0 + ticks[i];
      p.style.strokeDasharray = 40;
      tl.fromTo(txt, { opacity: 0.28, x: -10 }, { opacity: 1, x: 0, duration: 0.3, ease: "power2.out", immediateRender: true }, t);
      tl.fromTo(bola, { scale: 0 }, { scale: 1, duration: 0.42, ease: "back.out(1.7)", immediateRender: true }, t);
      tl.fromTo(p, { strokeDashoffset: 40 }, { strokeDashoffset: 0, duration: 0.3, ease: "power2.out", immediateRender: true }, t + 0.14);
      // El punto en curso va en negrita; al llegar el siguiente vuelve a peso normal.
      tl.set(txt, { fontWeight: 600 }, t);
      if (i < n - 1) tl.set(txt, { fontWeight: 400 }, t0 + ticks[i + 1]);
    }
    tl.to(card, { opacity: 0, y: 40, scale: 0.98, duration: 0.32, ease: "power2.in" }, t0 + dur - 0.32);
    return { zona: "pantalla" };   // lower-band card: captions hide while it is on screen
  };
})();
