// Captions for the reel composition (style B: heavy font, thick stroke, active word in the accent colour).
// Browser: window.SUBS(tl, capa, palabras, opts) and window.SUBS_POS(H, altoCaja, zonaRecurso).
// Node (tests): module.exports = { SUBS_POS, SUBS_TRAMOS }.
//   palabras: [{p, ini, fin}] in seconds of the final video
//   opts.estilo:  estilo.json object {colores:{texto,acento,trazo}, fuentes:{subtitulos}}; neutral fallbacks if missing
//   opts.apartar: [{ini, fin, zona}] resource zones over time (alias: opts.zonas). zona is one of
//                 'abajo' | 'arriba' | 'izquierda' | 'derecha' | 'pantalla' | 'esquina' | null
//   opts.enfasis: ["word", ...] words that always get their own caption group
//   opts.alto:    approximate caption box height in px (default 200)
// Captions sit in the lower third: default top = 0.74*H, never above 0.70*H (the chin), bottom edge <= 0.87*H
// (Instagram buttons below). No zone ever lifts them: 'pantalla' and 'abajo' hide them, and only for the
// exact time the resource is on screen (words spoken before it starts stay visible).
(function () {
  var W = 1080, H = 1920;
  var TOP_DEF = 0.74, TOP_MIN = 0.70, LIMITE_INF = 0.87;
  var CFG = { min: 2, max: 3, letras: 16, pausa: 0.28 };

  // Pure positioning. Returns {top} in px, or null when captions must be hidden.
  // 'pantalla' and 'abajo' hide them (they never rise to the face); any other zone = default.
  function SUBS_POS(alto, altoCaja, zona) {
    if (oculta(zona)) return null;
    var tope = Math.floor(LIMITE_INF * alto - altoCaja);
    // The floor wins over the bottom reserve: a tall box overflows downward, it never rises.
    return { top: Math.max(Math.min(Math.round(TOP_DEF * alto), tope), Math.round(TOP_MIN * alto)) };
  }
  function oculta(zona) { return zona === "pantalla" || zona === "abajo"; }

  function colores(estilo) {
    var c = (estilo && estilo.colores) || {}, f = (estilo && estilo.fuentes) || {};
    return {
      texto: c.texto || "#FFFFFF", acento: c.acento || "#FFC83D", trazo: c.trazo || "#000000",
      fuente: String(f.subtitulos || f.titulos || "sans-serif").replace(/['"\;{}<>]/g, "")
    };
  }
  function css(K) {
    if (document.getElementById("css-subs")) return;
    var CSS =
      ".sub{position:absolute;left:0;right:0;display:flex;justify-content:center;opacity:0;will-change:transform,opacity}" +
      ".sub .t{display:inline-block;max-width:" + Math.round(W * 0.84) + "px;text-align:center;text-wrap:balance;" +
      "font:800 86px/1.06 '" + K.fuente + "',sans-serif;letter-spacing:-.015em;color:" + K.texto + ";" +
      "-webkit-text-stroke:16px " + K.trazo + ";paint-order:stroke fill;text-shadow:0 7px 0 " + K.trazo + ",0 12px 22px rgba(0,0,0,.35)}" +
      ".sub .w{display:inline-block;transform-origin:50% 60%;margin:0 .1em}";
    var s = document.createElement("style"); s.id = "css-subs"; s.textContent = CSS; document.head.appendChild(s);
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function limpia(p) { return p.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ""); }
  function cierra(p) { return /[.,;:!?…]$/.test(p); }
  function letras(g) { return g.reduce(function (n, w) { return n + w.p.length + 1; }, 0); }

  function agrupar(pal, cfg, enfasis) {
    var gs = [], g = [];
    pal.forEach(function (w, i) {
      var prev = pal[i - 1];
      var corta = g.length && (g.length >= cfg.max || letras(g) + w.p.length > cfg.letras ||
        cierra(prev.p) || w.ini - prev.fin > cfg.pausa || enfasis[limpia(w.p)] || enfasis[limpia(prev.p)]);
      if (corta) { gs.push(g); g = []; }
      g.push(w);
    });
    if (g.length) gs.push(g);
    for (var i = 0; i < gs.length; i++) {
      var s = gs[i];
      if (s.length !== 1 || enfasis[limpia(s[0].p)]) continue;
      var ant = gs[i - 1], sig = gs[i + 1];
      var cabeAnt = ant && !enfasis[limpia(ant[0].p)] && s[0].ini - ant[ant.length - 1].fin < 0.6 && ant.length < cfg.max + 1 && letras(ant) + s[0].p.length <= cfg.letras + 8;
      var cabeSig = sig && !enfasis[limpia(sig[0].p)] && sig[0].ini - s[0].fin < 0.6 && sig.length < cfg.max + 1 && letras(sig) + s[0].p.length <= cfg.letras + 8;
      var preferAnt = cierra(s[0].p) || (ant && !cierra(ant[ant.length - 1].p) && !cabeSig);
      if (cabeAnt && (preferAnt || !cabeSig)) { ant.push(s[0]); gs.splice(i, 1); i--; }
      else if (cabeSig) { sig.unshift(s[0]); gs.splice(i, 1); i--; }
    }
    return gs;
  }

  // [ini, fin] minus every span where a hiding zone is on screen. Returns [[a, b], ...] (pieces < 0.05 s dropped).
  function visibles(ini, fin, zonas) {
    var tramos = [[ini, fin]];
    zonas.forEach(function (a) {
      if (!oculta(a.zona)) return;
      var nuevos = [];
      tramos.forEach(function (t) {
        if (!(a.ini < t[1] && a.fin > t[0])) { nuevos.push(t); return; }
        if (a.ini > t[0]) nuevos.push([t[0], a.ini]);
        if (a.fin < t[1]) nuevos.push([a.fin, t[1]]);
      });
      tramos = nuevos;
    });
    return tramos.filter(function (t) { return t[1] - t[0] >= 0.05; });
  }

  // Pure timing: one entry {g, ini, fin, top} per visible piece of each caption group.
  function SUBS_TRAMOS(palabras, opts) {
    opts = opts || {};
    var zonas = opts.apartar || opts.zonas || [];
    var alto = Math.min(opts.alto || 200, Math.round(0.25 * H));
    var enfasis = {}; (opts.enfasis || []).forEach(function (e) { enfasis[limpia(e)] = true; });
    var gs = agrupar(palabras, CFG, enfasis), out = [];
    var top = SUBS_POS(H, alto, null).top;
    gs.forEach(function (g, i) {
      var ini = g[0].ini, sig = gs[i + 1];
      var fin = Math.max(ini + 0.35, sig ? Math.min(sig[0].ini, g[g.length - 1].fin + 0.5) : g[g.length - 1].fin + 0.5);
      visibles(ini, fin, zonas).forEach(function (t) { out.push({ g: g, ini: t[0], fin: t[1], top: top }); });
    });
    return out;
  }

  function SUBS(tl, capa, palabras, opts) {
    opts = opts || {};
    var K = colores(opts.estilo);
    css(K);
    SUBS_TRAMOS(palabras, opts).forEach(function (tr) {
      var g = tr.g, ini = tr.ini, fin = tr.fin, pos = tr;
      var el = document.createElement("div");
      el.className = "sub";
      el.style.top = pos.top + "px";
      el.innerHTML = '<span class="t">' + g.map(function (w, k) {
        var p = k === g.length - 1 ? w.p.replace(/(\.\.\.|[.,;:…])+$/, "") : w.p;
        return '<span class="w">' + esc(p) + "</span>";
      }).join(" ") + "</span>";
      capa.appendChild(el);
      tl.fromTo(el, { opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1, duration: 0.2, ease: "back.out(2.2)", immediateRender: false }, ini);
      tl.to(el, { opacity: 0, duration: 0.06, ease: "none" }, fin - 0.06);
      var spans = el.querySelectorAll(".w");
      g.forEach(function (w, k) {
        var hasta = k + 1 < g.length ? g[k + 1].ini : fin;
        // a piece that starts after a hidden span shows words already spoken in their resting colour
        if (hasta <= ini) return;
        var desde = Math.max(w.ini, ini);
        tl.set(spans[k], { color: K.acento }, desde);
        if (k + 1 < g.length) tl.set(spans[k], { color: K.texto }, hasta);
        if (w.ini < ini) return;
        tl.fromTo(spans[k], { scale: 1 }, { scale: 1.08, duration: 0.14, ease: "back.out(3)", immediateRender: false }, w.ini);
        tl.to(spans[k], { scale: 1, duration: 0.12, ease: "power2.out" }, Math.max(w.ini + 0.14, hasta - 0.12));
      });
    });
  }

  if (typeof window !== "undefined") { window.SUBS = SUBS; window.SUBS_POS = SUBS_POS; window.SUBS_TRAMOS = SUBS_TRAMOS; }
  if (typeof module !== "undefined" && module.exports) module.exports = { SUBS_POS: SUBS_POS, SUBS_TRAMOS: SUBS_TRAMOS };
})();
