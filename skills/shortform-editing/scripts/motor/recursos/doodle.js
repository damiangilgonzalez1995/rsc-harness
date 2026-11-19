// Resource "doodle" (emoji replacement): a small line sticker in SVG that draws itself (stroke-dashoffset),
// gets filled with a brand colour slightly off-register (like a screen print) and then loops a small motion
// of its own. 6 px stroke in colores.trazo with round caps.
// opts:
//   dibujo  (str)  "taza" | "chispa" | "zzz" | "corazon" | "nube" | "interrogacion" | "bombilla" | "etiqueta".
//                  Default "chispa".
//   x, y    (num)  centre in px (1080x1920). If missing, beside the head on the side with more wall.
//   tam     (num)  side in px. Default 190 (280 for "etiqueta").
//   texto   (str)  "etiqueta" only: short handwritten word on the tag (fuentes.manuscrita). Without it, lines.
//   color   (str)  fill: brand key (suave, extra, linea, fondo, acento) or #hex. Default per drawing.
// zona: "izquierda" or "derecha" depending on the side it lands on.
(function () {
  window.REC = window.REC || {};
  var W = 1080, H = 1920;
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function css(M) {
    if (document.getElementById("css-doodle")) return;
    var s = document.createElement("style"); s.id = "css-doodle";
    s.textContent =
      ".rb-doo{position:absolute;left:0;top:0;visibility:hidden}" +
      ".rb-doo svg{display:block;overflow:visible}" +
      ".rb-doo .t{fill:none;stroke:" + M.trazo + ";stroke-linecap:round;stroke-linejoin:round}" +
      ".rb-doo .f{stroke:none}" +
      ".rb-doo text{font-family:'" + M.mano + "';font-weight:700;fill:" + M.trazo + "}";
    document.head.appendChild(s);
  }
  function z(cx, cy, s) {
    var h = s / 2;
    return "M" + (cx - h) + "," + (cy - h + 2) + " C" + (cx - h / 3) + "," + (cy - h - 2) + " " + (cx + h / 3) + "," + (cy - h + 1) + " " + (cx + h) + "," + (cy - h) +
      " L" + (cx - h + 3) + "," + (cy + h - 1) + " C" + (cx - h / 3) + "," + (cy + h + 2) + " " + (cx + h / 3) + "," + (cy + h - 2) + " " + (cx + h + 2) + "," + (cy + h);
  }
  function chispa(cx, cy, s) {
    function p(x, y) { return (cx + x * s).toFixed(1) + "," + (cy + y * s).toFixed(1); }
    return "M" + p(0, -1) + " C" + p(.1, -.3) + " " + p(.3, -.12) + " " + p(.95, 0) + " C" + p(.3, .12) + " " + p(.1, .3) + " " + p(0, 1) +
      " C" + p(-.1, .3) + " " + p(-.3, .12) + " " + p(-.95, 0) + " C" + p(-.3, -.12) + " " + p(-.1, -.3) + " " + p(0, -1) + " Z";
  }
  // cada dibujo: rellenos (f), trazos (t, en orden de dibujo), grupo «bucle» y color por defecto
  var D = {
    taza: { color: "suave",
      f: ["M-58,-16 L58,-16 C56,30 40,60 0,62 C-40,60 -56,30 -58,-16 Z"],
      t: ["M-61,-15 C-20,-21 22,-19 60,-17 C57,30 41,61 1,63 C-39,62 -57,32 -59,-10",
        "M57,-2 C84,-7 92,24 66,34 C59,37 52,36 46,33",
        "M-84,74 C-30,81 34,81 84,71"],
      v: ["M-24,-34 C-36,-50 -12,-60 -24,-80", "M6,-32 C-6,-50 20,-58 6,-86", "M36,-36 C26,-50 46,-58 36,-76"] },
    chispa: { color: "linea", f: [chispa(-8, 4, 74), chispa(62, -58, 26)], t: [chispa(-8, 4, 74), chispa(62, -58, 26), "M66,52 C66,46 76,46 76,52 C76,58 66,58 66,52"] },
    zzz: { color: "suave", f: [], t: [z(-58, 52, 38), z(-4, 4, 54), z(56, -56, 72)] },
    corazon: { color: "suave",
      f: ["M0,62 C-40,32 -84,6 -78,-30 C-73,-62 -30,-70 0,-34 C30,-72 76,-62 80,-28 C84,8 40,34 0,62 Z"],
      t: ["M2,-31 C30,-72 77,-62 80,-27 C84,9 40,35 -1,63 C-41,33 -85,6 -79,-31 C-73,-63 -29,-71 -2,-38"] },
    nube: { color: "fondo",
      f: ["M-70,30 C-96,28 -98,-10 -70,-14 C-72,-48 -30,-58 -12,-36 C0,-66 52,-62 54,-28 C86,-30 96,20 64,30 Z"],
      t: ["M-66,31 C-96,30 -99,-10 -71,-15 C-73,-49 -30,-59 -12,-37 C0,-68 53,-63 55,-28 C87,-31 97,21 63,31 C20,33 -24,29 -72,32",
        "M-40,56 L-46,72", "M-6,58 L-12,76", "M28,56 L22,72"] },
    interrogacion: { color: "extra",
      f: ["M0,-88 C52,-88 88,-52 88,0 C88,52 52,88 0,88 C-52,88 -88,52 -88,0 C-88,-52 -52,-88 0,-88 Z"],
      t: ["M-30,-30 C-34,-72 38,-80 40,-40 C42,-12 6,-10 4,24", "M4,50 C0,50 -2,54 2,58 C6,62 11,56 8,52 C6,49 3,50 3,52"] },
    bombilla: { color: "linea",
      f: ["M-34,20 C-62,-6 -54,-70 0,-72 C54,-70 62,-6 34,20 L30,42 L-30,42 Z"],
      t: ["M-30,42 L-34,20 C-62,-6 -55,-71 1,-72 C55,-70 62,-6 34,20 L30,42 Z", "M-12,26 L-9,-2 C-7,-16 7,-16 9,-2 L12,26",
        "M-26,56 L26,55", "M-18,68 L18,68"],
      v: ["M-94,-34 L-76,-30", "M0,-104 L0,-88", "M94,-34 L76,-30", "M-70,-88 L-58,-76", "M70,-88 L58,-76"] },
    etiqueta: { color: "linea",
      f: ["M-46,-40 C-30,-54 -14,-62 0,-66 C14,-62 30,-54 46,-40 L46,84 L-46,84 Z"],
      t: ["M2,-104 C-10,-90 12,-80 -4,-60 C-8,-54 -6,-46 0,-42",
        "M-46,-38 C-30,-54 -14,-62 0,-66 C14,-62 30,-54 46,-40 C47,0 46,44 47,84 C16,86 -16,85 -46,85 C-47,44 -46,0 -46,-38 Z",
        "M0,-50 C-6,-50 -7,-41 0,-40 C6,-40 7,-49 0,-50"],
      rayas: ["M-28,-8 C-8,-11 10,-6 28,-9", "M-28,18 C-10,15 6,20 22,17", "M-28,44 C-6,41 12,46 28,43"] },
  };
  window.REC["doodle"] = function (tl, capa, t0, dur, opts, ctx) {
    var M = window.MARCA(ctx);
    css(M);
    opts = opts || {};
    var nom = D[opts.dibujo] ? opts.dibujo : "chispa", d = D[nom];
    var tam = opts.tam || (nom === "etiqueta" ? 280 : 190), sw = 6 * 200 / tam;
    var c = (ctx && ctx.cara) || {};
    var izq = (c.izq != null ? c.izq : .32) * W, der = (c.der != null ? c.der : .68) * W, arr = (c.arriba != null ? c.arriba : .2) * H;
    var x = opts.x, y = opts.y;
    if (x == null) x = izq >= W - der ? Math.max(tam / 2 + 20, izq - 30 - tam / 2) : Math.min(W - tam / 2 - 20, der + 30 + tam / 2);
    if (y == null) y = arr + 30;
    y = Math.max(165 + tam / 2, y);   // never inside the Instagram header (~150 px)
    // opts.color: a brand key ("acento", "suave"...) or a #hex; anything else falls back to the drawing's own.
    var col = M[opts.color] && opts.color !== "rgba" ? M[opts.color] : (/^#[0-9a-fA-F]{6}$/.test(String(opts.color || "")) ? opts.color : M[d.color]);
    var s = '<svg width="' + tam + '" height="' + tam + '" viewBox="-100 -100 200 200"><g class="todo">';
    s += '<g class="relleno" transform="translate(7,7)">' + d.f.map(function (p) { return '<path class="f" fill="' + col + '" d="' + p + '"/>'; }).join("") + "</g>";
    var trazos = d.t.slice();
    if (nom === "etiqueta") {
      if (opts.texto) s += '<text class="tx" x="0" y="20" text-anchor="middle" font-size="' + Math.min(58, 200 / Math.max(3, String(opts.texto).length)) + '" transform="rotate(-6)">' + esc(opts.texto) + "</text>";
      else trazos = trazos.concat(d.rayas);
    }
    s += trazos.map(function (p) { return '<path class="t" pathLength="1" stroke-width="' + sw.toFixed(2) + '" d="' + p + '"/>'; }).join("");
    if (d.v) s += '<g class="vivo">' + d.v.map(function (p) { return '<path class="t v" pathLength="1" stroke-width="' + sw.toFixed(2) + '" d="' + p + '"/>'; }).join("") + "</g>";
    s += "</g></svg>";
    capa.innerHTML = '<div class="rb-doo">' + s + "</div>";
    var cont = capa.querySelector(".rb-doo"), todo = capa.querySelector(".todo"), rell = capa.querySelectorAll(".f");
    var ts = capa.querySelectorAll(".t"), tx = capa.querySelector(".tx"), viv = capa.querySelectorAll(".v");
    gsap.set(cont, { x: x, y: y, xPercent: -50, yPercent: -50 });
    var fin = t0 + dur;
    tl.set(cont, { visibility: "visible" }, t0);
    tl.fromTo(cont, { scale: 0.55, rotation: -8 }, { scale: 1, rotation: 0, duration: 0.3, ease: "back.out(3)", immediateRender: false }, t0);
    // dibujo: un trazo tras otro
    var t = t0 + 0.04, durT = Math.min(0.3, 0.95 / ts.length);
    tl.fromTo(ts, { visibility: "hidden" }, { visibility: "visible", duration: 0.01, stagger: durT * 0.85, immediateRender: true }, t);
    tl.fromTo(ts, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, autoRound: false, duration: durT, ease: "power1.inOut", stagger: durT * 0.85, immediateRender: true }, t);
    var tDib = t + durT * 0.85 * (ts.length - 1) + durT;
    if (rell.length) tl.fromTo(rell, { opacity: 0, scale: 0.7, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)", immediateRender: true }, t + 0.25);
    if (tx) tl.fromTo(tx, { opacity: 0 }, { opacity: 1, duration: 0.25, immediateRender: true }, tDib - 0.1);
    // bucle propio
    var vida = fin - 0.3 - tDib;
    function reps(per) { return Math.max(1, 2 * Math.floor(vida / (2 * per)) - 1); }
    if (vida > 0.6) {
      if (nom === "taza") tl.fromTo(viv, { y: 0, opacity: 1 }, { y: -10, opacity: 0.25, duration: 0.45, ease: "sine.inOut", yoyo: true, repeat: reps(0.45), stagger: 0.15, immediateRender: false }, tDib);
      else if (nom === "zzz") tl.to(ts, { y: -9, duration: 0.4, ease: "sine.inOut", yoyo: true, repeat: reps(0.4), stagger: 0.14 }, tDib);
      else if (nom === "corazon") tl.to(todo, { scale: 1.12, transformOrigin: "50% 50%", duration: 0.16, ease: "power2.out", yoyo: true, repeat: Math.max(1, 2 * Math.floor(vida / 0.92) - 1), repeatDelay: 0.14 }, tDib);
      else if (nom === "chispa") tl.to(todo, { rotation: 14, scale: 1.08, transformOrigin: "50% 50%", duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: reps(0.5) }, tDib);
      else if (nom === "nube") tl.to(todo, { x: 10, duration: 0.7, ease: "sine.inOut", yoyo: true, repeat: reps(0.7) }, tDib);
      else if (nom === "interrogacion") tl.to(todo, { rotation: 9, transformOrigin: "50% 80%", duration: 0.35, ease: "sine.inOut", yoyo: true, repeat: reps(0.35) }, tDib);
      else if (nom === "bombilla") tl.fromTo(viv, { opacity: 1, scale: 1, transformOrigin: "50% 50%" }, { opacity: 0.2, scale: 0.6, duration: 0.3, ease: "power1.inOut", yoyo: true, repeat: reps(0.3), stagger: 0.06, immediateRender: false }, tDib);
      else if (nom === "etiqueta") {
        tl.fromTo(todo, { rotation: 0, svgOrigin: "2 -104" }, { rotation: -11, svgOrigin: "2 -104", duration: 0.28, ease: "sine.out", immediateRender: false }, tDib - 0.25);
        tl.to(todo, { rotation: 9, svgOrigin: "2 -104", duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: Math.max(1, reps(0.6)) }, tDib + 0.03);
      }
    }
    tl.to(cont, { scale: 0.6, autoAlpha: 0, duration: 0.22, ease: "power2.in" }, fin - 0.24);
    return { zona: x < ((c.cx != null ? c.cx : .5) * W) ? "izquierda" : "derecha" };
  };
})();
