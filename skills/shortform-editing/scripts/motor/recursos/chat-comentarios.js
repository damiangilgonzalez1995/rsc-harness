// Resource "chat-comentarios": 2-4 chat bubbles in the brand colours (extra on the left, linea on the right,
// alternating, 56 px radius with a tail). Optional header pill. They enter one by one from their side with a
// small bounce (back.out(1.6)) and the previous ones nudge up to make room. Under the chin. Phone sizes
// (62 px bubbles, right 8 % kept free): header + 2 messages reach ~85 % of the height; 3 may pass 88 %
// (Instagram buttons) unless the chin is high.
// opts:
//   titulo   (str)              optional header (e.g. "comentarios").
//   mensajes (str[] | obj[])    2-4 messages; each a text or {texto, quien}. `quien` (optional) shows small
//                               above the text (use invented names, never real accounts). *word* = bold.
//   ticks    (num[])            optional seconds from t0 when each bubble enters.
// Fonts: titulos. zona: "pantalla" (lower-band card: captions hide while it is
// on screen; a plan-level "zona" overrides it).
(function () {
  window.REC = window.REC || {};
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function css(M) {
    if (document.getElementById("css-chat-comentarios")) return;
    var s = document.createElement("style"); s.id = "css-chat-comentarios";
    s.textContent =
      ".cc-chat{position:absolute;left:70px;right:92px;display:flex;flex-direction:column;gap:20px}" +
      ".cc-chat .cc-cab{align-self:center;display:flex;align-items:center;gap:16px;height:80px;padding:0 40px;border-radius:40px;" +
      "background:" + M.rgba(M.fondo, .95) + ";color:" + M.trazo + ";font:600 40px/1 '" + M.titulos + "';letter-spacing:.14em;text-transform:uppercase;" +
      "box-shadow:0 8px 22px " + M.rgba(M.trazo, .16) + "}" +
      ".cc-chat .cc-cab i{display:block;width:18px;height:18px;border-radius:50%;background:" + M.extra + "}" +
      ".cc-chat .cc-b{position:relative;max-width:900px;padding:26px 48px 30px;border-radius:64px;color:" + M.trazo + ";" +
      "font:500 62px/1.15 '" + M.titulos + "';letter-spacing:-.005em;box-shadow:0 14px 34px " + M.rgba(M.trazo, .18) + "}" +
      ".cc-chat .cc-b b{font-weight:700}" +
      ".cc-chat .cc-b .cc-q{display:block;font:600 36px/1 '" + M.titulos + "';letter-spacing:.02em;opacity:.7;margin-bottom:8px}" +
      ".cc-chat .cc-iz{align-self:flex-start;background:" + M.extra + ";transform-origin:0 100%}" +
      ".cc-chat .cc-de{align-self:flex-end;background:" + M.linea + ";transform-origin:100% 100%}" +
      ".cc-chat .cc-b::after{content:'';position:absolute;bottom:-28px;border:20px solid transparent}" +
      ".cc-chat .cc-iz::after{left:50px;border-top:28px solid " + M.extra + ";border-left:28px solid " + M.extra + "}" +
      ".cc-chat .cc-de::after{right:50px;border-top:28px solid " + M.linea + ";border-right:28px solid " + M.linea + "}";
    document.head.appendChild(s);
  }
  window.REC["chat-comentarios"] = function (tl, capa, t0, dur, opts, ctx) {
    var M = window.MARCA(ctx);
    css(M);
    opts = opts || {};
    var cara = (ctx && ctx.cara) || { barbilla: 0.47 };
    var msgs = (opts.mensajes && opts.mensajes.length ? opts.mensajes : ["¿Esto me pasa solo a mí?", "Literal, soy yo"]).slice(0, 4);
    var top = Math.round(cara.barbilla * 1920 + 26);
    var h = '<div class="cc-chat" style="top:' + top + 'px">';
    if (opts.titulo) h += '<div class="cc-cab"><i></i>' + esc(opts.titulo) + "</div>";
    msgs.forEach(function (m, i) {
      var o = typeof m === "string" ? { texto: m } : (m || {});
      var txt = esc(o.texto).replace(/\*(.+?)\*/g, "<b>$1</b>");
      h += '<div class="cc-b ' + (i % 2 ? "cc-de" : "cc-iz") + '">' + (o.quien ? '<span class="cc-q">' + esc(o.quien) + "</span>" : "") + txt + "</div>";
    });
    capa.innerHTML = h + "</div>";
    var cab = capa.querySelector(".cc-cab"), bs = capa.querySelectorAll(".cc-b");
    var n = bs.length;

    // La columna está anclada arriba, justo bajo la barbilla (todos los bocadillos ocupan su sitio desde el principio, invisibles);
    // al llegar uno nuevo, los anteriores dan un pequeño empujón hacia arriba, como en un chat.
    if (cab) tl.fromTo(cab, { opacity: 0, y: 16, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "power3.out", immediateRender: true }, t0);
    var ini = cab ? 0.3 : 0.05, fin = Math.max(ini + 0.3, dur - 1.1);
    var ticks = opts.ticks && opts.ticks.length >= n ? opts.ticks :
      msgs.map(function (_, i) { return n === 1 ? ini : ini + (fin - ini) * i / (n - 1); });
    for (var i = 0; i < n; i++) {
      var b = bs[i], t = t0 + ticks[i], dx = i % 2 ? 60 : -60;
      tl.fromTo(b, { opacity: 0, scale: 0.6, x: dx, y: 30 },
        { opacity: 1, scale: 1, x: 0, y: 0, duration: 0.45, ease: "back.out(1.6)", immediateRender: true }, t);
      // Los de antes hacen un pequeño empujón hacia arriba al llegar el nuevo.
      for (var j = 0; j < i; j++) tl.fromTo(bs[j], { y: 24 }, { y: 0, duration: 0.4, ease: "power3.out", immediateRender: false }, t);
      if (cab && i > 0) tl.fromTo(cab, { y: 24 }, { y: 0, duration: 0.4, ease: "power3.out", immediateRender: false }, t);
    }
    var ts = t0 + dur - 0.35;
    var todo = cab ? [cab].concat([].slice.call(bs)) : [].slice.call(bs);
    tl.to(todo, { opacity: 0, y: 30, duration: 0.3, ease: "power2.in", stagger: 0.03 }, ts);
    return { zona: "pantalla" };   // lower-band card: captions hide while it is on screen
  };
})();
