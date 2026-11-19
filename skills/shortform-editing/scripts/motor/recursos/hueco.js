// Resource "hueco": draws nothing; it only reserves a zone so the captions avoid it ("abajo" and "pantalla"
// hide them for the span; captions never rise toward the face).
// Use it over stretches with an `fx` effect (e.g. `phone-fan` under the chin), which is painted into
// base.mp4 and the captions do not know about.
// opts:
//   zona (str)  "abajo" | "arriba" | "pantalla" | ... Default "abajo".
// zona: the one in opts.
(function () {
  window.REC = window.REC || {};
  window.REC["hueco"] = function (tl, capa, t0, dur, opts) {
    return { zona: (opts && opts.zona) || "abajo" };
  };
})();
