// Resource "palabra-caja": a key word on a straight box that grows left to right (scaleX 0->1, 0.22 s,
// power3.out); the word follows, rising from a mask. Optional small italic line above for context.
// Sits on the wall above the head.
// opts:
//   palabra (str)  the key word (1-2 short words).
//   antes   (str)  optional small line above (e.g. "lo que de verdad pasa es").
//   tinta   (str)  optional, "oscura" (trazo on suave, default) or "clara" (fondo on acento).
//   caja_en (num)  optional seconds from t0 when the box with the word enters (default 0.25 s after `antes`),
//                  to sync it with the moment it is said; `antes` enters at t0.
//   lugar   (str)  optional, "arriba" (centred above the head, default) or "izquierda" (eye level, left side).
// Fonts: titulos (word), texto (line above). zona: "arriba".
(function () {
  window.REC = window.REC || {};
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function css(M) {
    if (document.getElementById("css-palabra-caja")) return;
    var s = document.createElement("style"); s.id = "css-palabra-caja";
    s.textContent =
      ".pcj{position:absolute;display:flex;flex-direction:column}" +
      ".pcj .pcj-antes{font:italic 500 64px/1.1 '" + M.cuerpo + "';color:" + M.texto + ";margin:0 0 16px 6px;" +
      "text-shadow:0 2px 3px " + M.rgba(M.trazo, .35) + ",0 4px 22px " + M.rgba(M.trazo, .6) + "}" +
      ".pcj .pcj-fila{position:relative;align-self:flex-start;padding:4px 30px 14px}" +
      ".pcj .pcj-caja{position:absolute;inset:0;background:" + M.suave + ";border-radius:3px;transform-origin:0 50%;" +
      "box-shadow:0 14px 34px " + M.rgba(M.trazo, .18) + "}" +
      ".pcj.clara .pcj-caja{background:" + M.acento + "}" +
      ".pcj .pcj-mask{position:relative;overflow:hidden;padding-bottom:4px}" +
      ".pcj .pcj-pal{display:block;font:700 128px/1.05 '" + M.titulos + "';letter-spacing:-.035em;color:" + M.trazo + ";white-space:nowrap}" +
      ".pcj.clara .pcj-pal{color:" + M.fondo + "}";
    document.head.appendChild(s);
  }
  window.REC["palabra-caja"] = function (tl, capa, t0, dur, opts, ctx) {
    var M = window.MARCA(ctx);
    css(M);
    opts = opts || {};
    var cara = (ctx && ctx.cara) || { arriba: 0.14, izq: 0.32 };
    var pal = String(opts.palabra || "palabra");
    var tam = Math.min(128, Math.round(880 / Math.max(4, pal.length * 0.56)));
    var pos;
    if (opts.lugar === "izquierda") {
      tam = Math.min(tam, Math.round((cara.izq * 1080 - 120) / Math.max(3, pal.length * 0.56)));
      pos = "left:48px;top:" + Math.round(cara.arriba * 1920 + 40) + "px;align-items:flex-start;";
    } else {
      var bajo = Math.min(390, Math.max(330, cara.arriba * 1920 - 120));   // hair often reaches higher than the face box
      pos = "left:0;right:0;bottom:" + Math.round(1920 - bajo) + "px;align-items:center;";
    }
    capa.innerHTML = '<div class="pcj ' + (opts.tinta === "clara" ? "clara" : "oscura") + '" style="' + pos + '">' +
      (opts.antes ? '<div class="pcj-antes">' + esc(opts.antes) + "</div>" : "") +
      '<div class="pcj-fila" style="align-self:' + (opts.lugar === "izquierda" ? "flex-start" : "center") + '"><div class="pcj-caja"></div>' +
      '<div class="pcj-mask"><span class="pcj-pal" style="font-size:' + tam + 'px">' + esc(pal) + "</span></div></div></div>";
    var antes = capa.querySelector(".pcj-antes"), caja = capa.querySelector(".pcj-caja"), palEl = capa.querySelector(".pcj-pal");
    var fila = capa.querySelector(".pcj-fila");

    var tc = t0;
    if (antes) {
      tl.fromTo(antes, { opacity: 0, y: 14, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.4, ease: "power3.out", immediateRender: true }, t0);
      tc = t0 + 0.25;
    }
    if (opts.caja_en != null) tc = t0 + Math.max(0, Math.min(Number(opts.caja_en), dur - 0.9));
    tl.fromTo(caja, { scaleX: 0 }, { scaleX: 1, duration: 0.22, ease: "power3.out", immediateRender: true }, tc);
    tl.fromTo(palEl, { yPercent: 105 }, { yPercent: 0, duration: 0.34, ease: "power3.out", immediateRender: true }, tc + 0.1);
    // Un pequeño golpe al asentarse y una deriva lenta.
    tl.fromTo(fila, { scale: 1 }, { scale: 1.035, duration: 0.12, ease: "power2.out", yoyo: true, repeat: 1, immediateRender: false }, tc + 0.3);
    tl.to(fila, { y: -6, duration: Math.max(0.4, dur - 1.0), ease: "sine.inOut" }, tc + 0.55);
    // Salida: la caja se recoge hacia la derecha y la palabra baja.
    var ts = t0 + dur - 0.32;
    tl.to(palEl, { yPercent: 105, duration: 0.24, ease: "power2.in" }, ts);
    tl.to(caja, { scaleX: 0, transformOrigin: "100% 50%", duration: 0.26, ease: "power3.in" }, ts + 0.06);
    if (antes) tl.to(antes, { opacity: 0, duration: 0.25 }, ts);
    return { zona: "arriba" };
  };
})();
