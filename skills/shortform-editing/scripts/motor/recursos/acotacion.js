// Resource "acotacion": an ironic handwritten side note (fuentes.manuscrita, typed letter by letter) with a
// drawn arrow curving down to point at the speaker. The note sits in the top corner of the chosen side (free
// wall, below the Instagram header) and the arrow ends at that side's cheek.
// opts:
//   texto  (str)  the note. Default "spoiler: no".
//   lado   (str)  "izq" | "der". Default "izq".
//   color  (str)  "trazo" | "acento" | #hex. Text colour. Default "trazo". The arrow is always colores.trazo,
//                 11 px stroke (the accent did not read on the wall).
//   tam    (num)  size in px (60-140). Default 112, readable on a phone.
//   ancho  (num)  max note width in px. Default 880.
//   apunta (str)  "cara" | "gesto": the arrow ends at the cheek or lower, at hand level. Default "cara".
//   punta  ({x,y}, optional)  arrow tip in px; overrides "apunta" when the face is not where CARA says.
// zona: "izquierda" or "derecha".
(function () {
  window.REC = window.REC || {};
  var W = 1080, H = 1920, TOPE = 172; // fuera de la cabecera de Instagram (~150 px)
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function css(M) {
    if (document.getElementById("css-acotacion")) return;
    var s = document.createElement("style"); s.id = "css-acotacion";
    s.textContent =
      ".rb-aco{position:absolute;font-family:'" + M.mano + "';font-weight:700;line-height:.98;letter-spacing:.005em;" +
      "text-shadow:0 0 12px " + M.rgba(M.fondo, .75) + ",0 0 3px " + M.rgba(M.fondo, .6) + "}" +
      ".rb-aco span{visibility:hidden}" +
      ".rb-aco-svg{position:absolute;left:0;top:0;overflow:visible}" +
      ".rb-aco-svg path{fill:none;stroke:" + M.trazo + ";stroke-width:11;stroke-linecap:round;stroke-linejoin:round}";
    document.head.appendChild(s);
  }
  window.REC["acotacion"] = function (tl, capa, t0, dur, opts, ctx) {
    var M = window.MARCA(ctx);
    css(M);
    opts = opts || {};
    var texto = String(opts.texto || "spoiler: no"), der = opts.lado === "der";
    var col = opts.color === "acento" || opts.color === "remate" ? M.acento : (opts.color && opts.color.charAt(0) === "#" ? opts.color : M.trazo);
    var c = (ctx && ctx.cara) || {};
    var cIzq = (c.izq != null ? c.izq : .32) * W, cDer = (c.der != null ? c.der : .68) * W, cy = (c.cy != null ? c.cy : .3) * H;
    var barb = (c.barbilla != null ? c.barbilla : .47) * H;
    var F = Math.max(60, Math.min(140, opts.tam || 112)), ancho = opts.ancho || 880;
    var lineas = Math.max(1, Math.ceil(texto.length * F * 0.4 / ancho));
    var alto = lineas * F * 0.98;
    var rot = der ? 2.5 : -2.5;
    // el giro levanta la punta de la nota: se baja lo justo para que no entre en la cabecera de Instagram
    var top = TOPE + Math.round(Math.min(ancho, texto.length * F * 0.4) * Math.sin(Math.abs(rot) * Math.PI / 180));
    // texto
    var spans = "";
    for (var i = 0; i < texto.length; i++) spans += texto[i] === " " ? " " : "<span>" + esc(texto[i]) + "</span>";
    var lado = der ? "right:44px;text-align:right;" : "left:48px;";
    var nota = '<div class="rb-aco" style="' + lado + "top:" + top + "px;width:" + ancho + "px;font-size:" + F + "px;color:" + col +
      ";transform:rotate(" + rot + "deg);transform-origin:" + (der ? "100% 0" : "0 0") + '">' + spans + "</div>";
    // flecha: sale bajo el texto, baja por la pared y entra a la cara de lado
    var sx = der ? W - 44 - Math.min(ancho, texto.length * F * 0.4) * 0.45 : 48 + Math.min(ancho, texto.length * F * 0.4) * 0.35;
    var sy = top + alto + 26;
    var ex = der ? cDer + 22 : cIzq - 22, ey = opts.apunta === "gesto" ? barb + 140 : cy + 30;
    if (opts.punta) { ex = +opts.punta.x; ey = +opts.punta.y; }   // la cara se mueve: punta fija medida en el clip
    var dir = der ? 1 : -1;
    var c1x = sx + dir * 90, c1y = sy + (ey - sy) * 0.45, c2x = ex + dir * 150, c2y = ey + 10;
    var ang = Math.atan2(ey - c2y, ex - c2x), L = 34;
    function p(x, y) { return x.toFixed(1) + "," + y.toFixed(1); }
    var cuerpo = "M" + p(sx, sy) + " C" + p(c1x, c1y) + " " + p(c2x, c2y) + " " + p(ex, ey);
    var punta1 = "M" + p(ex + L * Math.cos(ang + 2.55), ey + L * Math.sin(ang + 2.55)) + " L" + p(ex, ey);
    var punta2 = "M" + p(ex, ey) + " L" + p(ex + L * Math.cos(ang - 2.6), ey + L * Math.sin(ang - 2.6));
    var svg = '<svg class="rb-aco-svg" width="' + W + '" height="' + H + '"><path class="cu" pathLength="1" d="' + cuerpo + '"/>' +
      '<path class="pu" pathLength="1" d="' + punta1 + '"/><path class="pu" pathLength="1" d="' + punta2 + '"/></svg>';
    capa.innerHTML = nota + svg;
    var letras = capa.querySelectorAll(".rb-aco span"), cu = capa.querySelector(".cu"), pu = capa.querySelectorAll(".pu");
    var nodo = capa.querySelector(".rb-aco"), svgEl = capa.querySelector(".rb-aco-svg");
    var paso = Math.min(0.045, (dur * 0.35) / Math.max(1, letras.length));
    for (var k = 0; k < letras.length; k++) tl.set(letras[k], { visibility: "visible" }, t0 + k * paso);
    var tf = t0 + letras.length * paso + 0.08;
    tl.fromTo([cu, pu[0], pu[1]], { visibility: "hidden" }, { visibility: "visible", duration: 0.01, stagger: 0.42, immediateRender: true }, tf);
    tl.fromTo(cu, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, autoRound: false, duration: 0.45, ease: "power2.inOut", immediateRender: true }, tf);
    tl.fromTo(pu, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, autoRound: false, duration: 0.12, ease: "power1.out", stagger: 0.08, immediateRender: true }, tf + 0.42);
    // vida: la nota respira un poco
    tl.to(nodo, { rotation: rot + (der ? -1.5 : 1.5), duration: Math.max(0.4, (t0 + dur - tf - 0.9) / 2), ease: "sine.inOut", yoyo: true, repeat: 1 }, tf + 0.6);
    tl.to([nodo, svgEl], { autoAlpha: 0, duration: 0.22, ease: "power1.in" }, t0 + dur - 0.24);
    return { zona: der ? "derecha" : "izquierda" };
  };
})();
