// Resource "movil-feed": a drawn phone (rounded light frame, no brand) on the free side with a reels feed
// that scrolls up fast, slows down and stops on one (a line heart pulses on screen). Optional: the screen
// then switches off (fade to dark with the switch-off flash) and the phone drifts away, for "off social media".
// Thumbnails come from reels/marca/miniaturas/ (plain brand gradients when there are none).
// opts:
//   imgs    (list of int|str)  feed reels in order (n-th thumbnail, 1-based, or file name).
//                              Default [5,9,13,2,7,15,1,10].
//   para    (int)    index (0-based) of the reel it stops on. Default the last one.
//   x, y    (num)    top-left of the phone in px. Default 40, 600.
//   ancho   (num)    phone width. Default 270 (height = 2.05 x width).
//   scroll  ({en, dur})  seconds from t0 when it starts scrolling and how long. Default 0.5 and 2.2.
//   apagar  (num|null)   seconds from t0 when the screen switches off and the phone leaves. Default null.
// Brand colours: fondo (frame), trazo (screen), acento (heart), oscuro (off screen), linea.
// zona: "lado" (does not move the captions).
(function () {
  window.REC = window.REC || {};
  var CORA = "M17,29 C8,22 3,17 3,11 C3,6.5 6.5,3.5 10.5,3.5 C13.5,3.5 15.8,5.4 17,8 C18.2,5.4 20.5,3.5 23.5,3.5 C27.5,3.5 31,6.5 31,11 C31,17 26,22 17,29 Z";
  function css(M) {
    if (document.getElementById("css-movil-feed")) return;
    var s = document.createElement("style"); s.id = "css-movil-feed";
    s.textContent =
      ".mf{position:absolute;visibility:hidden;border-radius:46px;background:" + M.fondo + ";padding:12px;" +
      "box-shadow:0 26px 60px " + M.rgba(M.trazo, .38) + ",0 3px 8px " + M.rgba(M.trazo, .2) + ",inset 0 0 0 2px " + M.rgba(M.linea, .9) + "}" +
      ".mf .pan{position:relative;width:100%;height:100%;border-radius:35px;overflow:hidden;background:" + M.trazo + "}" +
      ".mf .tira{position:absolute;left:0;top:0;width:100%}" +
      ".mf .tira img{display:block;width:100%;object-fit:cover}" +
      ".mf .isla{position:absolute;left:50%;top:10px;width:30%;height:20px;margin-left:-15%;border-radius:10px;background:" + M.trazo + ";z-index:3}" +
      ".mf .ui{position:absolute;right:10px;bottom:62px;display:flex;flex-direction:column;gap:16px;z-index:2}" +
      ".mf .ui i{display:block;width:30px;height:30px;border-radius:50%;border:3.5px solid " + M.rgba(M.fondo, .95) + ";box-shadow:0 1px 4px rgba(0,0,0,.25)}" +
      ".mf .barra{position:absolute;left:14px;right:14px;bottom:16px;height:5px;border-radius:3px;background:" + M.rgba(M.fondo, .45) + ";z-index:2;overflow:hidden}" +
      ".mf .barra b{display:block;height:100%;width:100%;background:" + M.fondo + ";transform-origin:0 50%}" +
      ".mf .gusta{position:absolute;left:50%;top:44%;width:96px;height:96px;margin:-48px 0 0 -48px;z-index:4;overflow:visible;opacity:0}" +
      ".mf .gusta path{fill:" + M.fondo + ";stroke:" + M.acento + ";stroke-width:2.6;stroke-linejoin:round}" +
      ".mf .negro{position:absolute;inset:0;background:" + M.oscuro + ";opacity:0;z-index:5}" +
      ".mf .raya{position:absolute;left:8%;right:8%;top:50%;height:4px;margin-top:-2px;background:" + M.fondo + ";border-radius:2px;opacity:0;z-index:6;box-shadow:0 0 18px " + M.fondo + "}";
    document.head.appendChild(s);
  }
  window.REC["movil-feed"] = function (tl, capa, t0, dur, opts, ctx) {
    var M = window.MARCA(ctx);
    css(M); opts = opts || {};
    var imgs = opts.imgs || [5, 9, 13, 2, 7, 15, 1, 10];
    var para = opts.para != null ? opts.para : imgs.length - 1;
    var aw = opts.ancho || 270, ah = Math.round(aw * 2.05), x = opts.x != null ? opts.x : 40, y = opts.y != null ? opts.y : 600;
    var sw = aw - 24, sh = ah - 24;
    var sc = opts.scroll || {}, en = sc.en != null ? sc.en : 0.5, sd = sc.dur || 2.2;
    var tira = imgs.map(function (v, i) { return M.imagen(v, i, "display:block;width:100%;object-fit:cover;height:" + sh + "px"); }).join("");
    capa.innerHTML = '<div class="mf" style="left:' + x + "px;top:" + y + "px;width:" + aw + "px;height:" + ah + 'px"><div class="pan">' +
      '<div class="tira">' + tira + '</div><div class="isla"></div><div class="ui"><i></i><i></i><i></i></div><div class="barra"><b></b></div>' +
      '<svg class="gusta" viewBox="0 0 34 34"><path d="' + CORA + '"/></svg><div class="negro"></div><div class="raya"></div></div></div>';
    var mf = capa.querySelector(".mf"), t = capa.querySelector(".tira"), b = capa.querySelector(".barra b");
    var g = capa.querySelector(".gusta"), ng = capa.querySelector(".negro"), ry = capa.querySelector(".raya"), fin = t0 + dur;
    tl.fromTo(mf, { autoAlpha: 0, y: 80, rotation: -6 }, { autoAlpha: 1, y: 0, rotation: -3, duration: 0.55, ease: "back.out(1.3)", immediateRender: true }, t0);
    tl.set(t, { y: 0 }, t0);
    // desliza: rápido al principio, frena y encaja en el reel elegido
    tl.to(t, { y: -para * sh, duration: sd, ease: "power3.inOut" }, t0 + en);
    tl.fromTo(b, { scaleX: 0 }, { scaleX: 1, duration: Math.max(0.5, (opts.apagar != null ? opts.apagar : dur) - en - sd), ease: "none", immediateRender: true }, t0 + en + sd);
    tl.to(g, { opacity: 1, scale: 1.15, duration: 0.25, ease: "back.out(2.5)" }, t0 + en + sd + 0.2);
    tl.to(g, { scale: 1, duration: 0.2 }, t0 + en + sd + 0.45);
    tl.to(g, { opacity: 0, duration: 0.3 }, t0 + en + sd + 1.0);
    if (opts.apagar != null) {
      var ta = t0 + opts.apagar;
      tl.to(ng, { opacity: 1, duration: 0.18, ease: "power2.in" }, ta);
      tl.fromTo(ry, { opacity: 0, scaleX: 1 }, { opacity: 1, duration: 0.08, immediateRender: true }, ta + 0.12);
      tl.to(ry, { scaleX: 0, opacity: 0, duration: 0.32, ease: "power2.in" }, ta + 0.22);
      // y el móvil se aleja: baja, gira y se hace pequeño
      tl.to(mf, { y: 140, x: -40, rotation: -12, scale: 0.72, autoAlpha: 0, duration: Math.min(1.4, fin - ta - 0.7), ease: "power2.in" }, ta + 0.7);
    } else {
      tl.to(mf, { autoAlpha: 0, y: 50, duration: 0.3, ease: "power2.in" }, fin - 0.32);
    }
    return { zona: "lado" };
  };
})();
