// Brand palette and fonts for the resources, read from the project's reels/marca/estilo.json.
// window.MARCA(ctx) -> {fondo, texto, trazo, acento, suave, extra, linea, oscuro, claro,
//                       titulos, cuerpo, mano, handle, logo, frase, rgba(hex, a), miniatura(v, i)}
// ctx.estilo is the estilo.json object; every key has a neutral fallback, so a resource never breaks.
//   colores.fondo   light surface of cards and panels
//   colores.texto   text drawn straight over the video (captions fill, phrases on the wall)
//   colores.trazo   ink: text on cards, line drawings, outlines
//   colores.acento  highlight: active word, circles, key words
//   colores.suave   soft fill (hearts, figures, boxes)
//   colores.extra   second fill (alternate bubbles, bars, tape)
//   fuentes.titulos / texto / manuscrita   family names (bundled: Outfit, Source Serif 4, Caveat)
(function () {
  function hex(v, def) { return /^#[0-9a-fA-F]{6}$/.test(String(v || "")) ? String(v).toUpperCase() : def; }
  function rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function mezcla(a, b, t) {
    var x = rgb(a), y = rgb(b);
    return "#" + x.map(function (v, i) { var n = Math.round(v + (y[i] - v) * t).toString(16); return n.length < 2 ? "0" + n : n; }).join("").toUpperCase();
  }
  function familia(v, def) { var s = String(v || "").replace(/['"\\;{}<>]/g, "").trim(); return s || def; }
  function miniatura(v, i) {
    var lista = window.MINIATURAS || [];
    if (typeof v === "string" && v) return v.indexOf("/") >= 0 ? v : "miniaturas/" + v;
    if (!lista.length) return null;
    var n = typeof v === "number" ? v - 1 : (i || 0);
    return lista[((n % lista.length) + lista.length) % lista.length];
  }
  window.MARCA = function (ctx) {
    var e = (ctx && ctx.estilo) || {}, c = e.colores || {}, f = e.fuentes || {};
    var M = {
      fondo: hex(c.fondo, "#FFFFFF"), texto: hex(c.texto, "#FFFFFF"), trazo: hex(c.trazo, "#1F1F24"),
      acento: hex(c.acento, "#FFC83D"), suave: hex(c.suave, "#BFC8D6"), extra: hex(c.extra, "#A9C4A4"),
      titulos: familia(f.titulos, "Outfit"), cuerpo: familia(f.texto, "Source Serif 4"), mano: familia(f.manuscrita, "Caveat"),
      handle: e.handle ? String(e.handle) : "", logo: e.logo ? String(e.logo) : "",
      frase: (e.cierre && e.cierre.frase) ? String(e.cierre.frase) : "",
      miniatura: miniatura
    };
    M.linea = mezcla(M.fondo, M.trazo, 0.12);     // hairlines, dashed rings, paper cards
    M.oscuro = mezcla(M.trazo, "#000000", 0.35);  // screen-off black
    M.claro = mezcla(M.suave, M.fondo, 0.7);      // highlighted word on light-ink phrases
    M.rgba = function (h, a) { var x = rgb(hex(h, "#000000")); return "rgba(" + x.join(",") + "," + a + ")"; };
    // Thumbnail card content: <img> from reels/marca/miniaturas (copied by componer into miniaturas/),
    // or a plain brand gradient when the project has none (never a bundled real thumbnail).
    M.imagen = function (v, i, estilo) {
      var s = miniatura(v, i), css = estilo || "display:block;width:100%;height:100%;object-fit:cover";
      if (s) return '<img src="' + String(s).replace(/[&<>"]/g, "") + '" style="' + css + '">';
      var cols = [M.suave, M.extra, M.acento, M.linea], a = cols[(i || 0) % 4], b = cols[((i || 0) + 1) % 4];
      return '<i style="' + css + ';background:linear-gradient(165deg,' + a + "," + b + ')"></i>';
    };
    return M;
  };
})();
