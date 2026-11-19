// Resource "cierre-firma" (closing card, typically 2.5-3 s). The video fades to colores.fondo with blurred
// blobs (suave, extra, linea; blur 80 px) drifting slowly; then the brand logo, the handle (fuentes.titulos)
// and, optionally, a short phrase in italic (fuentes.texto). It does not leave: it is the last shot.
// Defaults come from estilo.json: logo (componer copies it as marca/logo.<ext>), handle, cierre.frase.
// opts:
//   frase  (str)  optional goodbye phrase (1-2 lines); *word* goes in the accent colour. Default cierre.frase.
//   handle (str)  optional. Default estilo.handle (nothing if empty).
//   logo   (str)  optional logo path inside the composition. Default the brand logo (none if not set).
// zona: "pantalla".
(function () {
  window.REC = window.REC || {};
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function css(M) {
    if (document.getElementById("css-cierre-firma")) return;
    var s = document.createElement("style"); s.id = "css-cierre-firma";
    s.textContent =
      ".cf-fondo{position:absolute;inset:0;background:" + M.fondo + ";overflow:hidden}" +
      ".cf-fondo i{position:absolute;display:block;border-radius:50%;filter:blur(80px)}" +
      ".cf-fondo .m1{width:820px;height:820px;left:-300px;top:-160px;background:" + M.suave + ";opacity:.75}" +
      ".cf-fondo .m2{width:760px;height:760px;right:-320px;bottom:-120px;background:" + M.extra + ";opacity:.7}" +
      ".cf-fondo .m3{width:480px;height:480px;right:-80px;top:520px;background:" + M.linea + ";opacity:.9}" +
      ".cf-fondo .m4{width:420px;height:420px;left:-60px;bottom:280px;background:" + M.suave + ";opacity:.4}" +
      ".cf-cont{position:absolute;left:100px;right:100px;top:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:" + M.trazo + "}" +
      ".cf-cont .cf-logo{width:340px;height:auto;mix-blend-mode:multiply}" +
      ".cf-cont .cf-frase{font:italic 400 86px/1.08 '" + M.cuerpo + "';letter-spacing:-.015em;margin-top:70px;text-wrap:balance}" +
      ".cf-cont .cf-frase em{color:" + M.acento + ";font-weight:500}" +
      ".cf-cont .cf-raya{width:120px;height:4px;border-radius:2px;background:" + M.suave + ";margin:64px 0 34px}" +
      ".cf-cont .cf-handle{font:500 44px/1 '" + M.titulos + "';letter-spacing:.03em;color:" + M.trazo + "}" +
      ".cf-cont .cf-handle b{font-weight:500;color:" + M.acento + "}";
    document.head.appendChild(s);
  }
  window.REC["cierre-firma"] = function (tl, capa, t0, dur, opts, ctx) {
    var M = window.MARCA(ctx);
    css(M);
    opts = opts || {};
    var handle = esc(opts.handle || M.handle).replace(/^@/, "<b>@</b>");
    var frase = (opts.frase || M.frase) ? esc(opts.frase || M.frase).replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/\n/g, "<br>") : "";
    capa.innerHTML = '<div class="cf-fondo"><i class="m1"></i><i class="m2"></i><i class="m3"></i><i class="m4"></i></div>' +
      '<div class="cf-cont">' + (opts.logo || M.logo ? '<img class="cf-logo" src="' + esc(opts.logo || M.logo) + '" alt="">' : "") +
      (frase ? '<div class="cf-frase">' + frase + "</div>" : "") +
      '<div class="cf-raya"></div><div class="cf-handle">' + handle + "</div></div>";
    var fondo = capa.querySelector(".cf-fondo"), ms = capa.querySelectorAll(".cf-fondo i");
    var logo = capa.querySelector(".cf-logo"), fr = capa.querySelector(".cf-frase");
    var raya = capa.querySelector(".cf-raya"), hd = capa.querySelector(".cf-handle");

    tl.fromTo(fondo, { opacity: 0 }, { opacity: 1, duration: 0.55, ease: "power2.inOut", immediateRender: true }, t0);
    // The blobs drift during the whole closing card (deterministic: fixed offsets).
    var deriva = [[120, 90], [-110, -80], [-70, 60], [80, -50]];
    for (var i = 0; i < ms.length; i++) {
      tl.fromTo(ms[i], { x: 0, y: 0, scale: 0.85 }, { x: deriva[i][0], y: deriva[i][1], scale: 1.08, duration: dur, ease: "sine.inOut", immediateRender: true }, t0);
    }
    if (logo) {
      tl.fromTo(logo, { opacity: 0, scale: 0.86, y: 20, filter: "blur(6px)" },
        { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "power3.out", immediateRender: true }, t0 + 0.35);
      // Soft pulse of the logo.
      tl.to(logo, { scale: 1.05, duration: 0.35, ease: "sine.inOut", yoyo: true, repeat: 1 }, t0 + 1.05);
    }
    if (fr) tl.fromTo(fr, { opacity: 0, y: 18, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.55, ease: "power3.out", immediateRender: true }, t0 + 0.6);
    tl.fromTo(raya, { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: "power2.inOut", immediateRender: true }, t0 + 0.8);
    tl.fromTo(hd, { opacity: 0, y: 12, letterSpacing: "0.12em" }, { opacity: 1, y: 0, letterSpacing: "0.03em", duration: 0.6, ease: "power3.out", immediateRender: true }, t0 + 0.9);
    return { zona: "pantalla" };
  };
})();
