# Plantillas

Código probado en una demo de panel de agencia. Copia y adapta la paleta y la letra.

## Estilo en `<html>` antes del primer render

```ts
// src/lib/estilo.ts (impórtalo lo primero en main.tsx)
export type Estilo = 'suave' | 'formal' | 'bruma' | 'nocturna';
const pedido = new URLSearchParams(location.search).get('estilo') as Estilo | null;
export const estilo: Estilo = pedido && ['suave','formal','bruma','nocturna'].includes(pedido) ? pedido : 'suave';
document.documentElement.dataset.estilo = estilo;
if (estilo === 'nocturna') document.documentElement.style.colorScheme = 'dark';
```

## Tokens

```css
@import "tailwindcss";
@theme { /* fuentes de la demo: sustitúyelas por las del proyecto (tipografia.md) */
  --font-sans: "Geist Variable", ui-sans-serif, system-ui, sans-serif;
  --font-dot: "Doto", ui-monospace, monospace;
}
:root {
  --r-shell: 30px; --r-card: 28px; --r-tile: 22px; --r-ctl: 9999px; --r-chip: 9999px; --r-bar: 9999px;
  --num-scale: 1; --num-weight: 800;
  --shadow-soft: 0 10px 30px rgb(16 64 110 / .12), 0 2px 6px rgb(16 64 110 / .06);
  --grain-opacity: .25;
  --grain-url: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
:root[data-estilo="formal"] {
  --font-dot: "Geist Variable", ui-sans-serif, sans-serif;
  --r-shell: 8px; --r-card: 8px; --r-tile: 6px; --r-ctl: 6px; --r-chip: 4px; --r-bar: 2px;
  --num-scale: .74; --num-weight: 500; --grain-opacity: .06;
}
```

En JSX: `rounded-[var(--r-card)]`, nunca `rounded-[28px]`.

## Materiales

```css
@layer components {
  .glass {
    position: relative;
    background: linear-gradient(135deg, rgb(255 255 255 / .6), rgb(255 255 255 / .4));
    -webkit-backdrop-filter: blur(20px) saturate(170%);
    backdrop-filter: blur(20px) saturate(170%);
    border: 1px solid rgb(255 255 255 / .85);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / .95), inset 0 -1px 0 rgb(11 37 64 / .05), var(--shadow-soft);
  }
  .glass-flat { /* mismo aspecto, sin blur: para todo lo que pase del presupuesto */
    position: relative;
    background: linear-gradient(135deg, rgb(255 255 255 / .66), rgb(255 255 255 / .5));
    border: 1px solid rgb(255 255 255 / .9);
    box-shadow: inset 0 1px 0 #fff, 0 8px 24px rgb(16 64 110 / .09), 0 1px 3px rgb(16 64 110 / .06);
  }
  @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    .glass { background: rgb(255 255 255 / .9); }
  }
  @media (prefers-reduced-transparency: reduce) {
    .glass, .glass-flat, .lens { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; background: #fff !important; }
  }
  .grain-layer { position: absolute; inset: 0; pointer-events: none; background-image: var(--grain-url); mix-blend-mode: overlay; opacity: var(--grain-opacity); }

  /* Formal: Mica en navegación */
  [data-estilo="formal"] .glass {
    background: rgb(250 252 253 / .88);
    -webkit-backdrop-filter: blur(48px) saturate(140%);
    backdrop-filter: blur(48px) saturate(140%);
    border: 0; box-shadow: none;
  }
}
```

## Lente (solo Chromium)

```tsx
export function LensFilter() {
  useEffect(() => {
    if (!/Chrome\//.test(navigator.userAgent)) return;
    const id = requestAnimationFrame(() => document.documentElement.classList.add('has-lens'));
    return () => { cancelAnimationFrame(id); document.documentElement.classList.remove('has-lens'); };
  }, []);
  const d = (s: number, r: string) => <feDisplacementMap in="SourceGraphic" in2="map" scale={s} xChannelSelector="R" yChannelSelector="G" result={r} />;
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <filter id="lens" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.02 0.03" numOctaves="2" seed="7" result="map" />
        {d(30,'dr')}{d(42,'dg')}{d(54,'db')}
        <feColorMatrix in="dr" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
        <feColorMatrix in="dg" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
        <feColorMatrix in="db" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
        <feBlend in="r" in2="g" mode="screen" result="rg" /><feBlend in="rg" in2="b" mode="screen" />
      </filter>
    </svg>
  );
}
```

```css
.lens { border-radius: 50%; backdrop-filter: blur(14px) saturate(200%);
  background: radial-gradient(circle at 30% 25%, rgb(255 255 255 / .55), transparent 55%), linear-gradient(135deg, rgb(201 162 74 / .92), rgb(233 207 134 / .88));
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / .6), inset 6px 8px 14px rgb(255 255 255 / .35), inset -6px -8px 14px rgb(120 80 10 / .2), 0 12px 28px rgb(16 64 110 / .28); }
.has-lens .lens { backdrop-filter: url(#lens) blur(1px) saturate(160%); }
```

## Fondo con fallback

```tsx
import { MeshGradient } from '@paper-design/shaders-react';
const gl = new URLSearchParams(location.search).get('nogl') !== '1' && !!document.createElement('canvas').getContext('webgl2');
// gl ? <MeshGradient colors={c} distortion={0.9} swirl={0.6} grainMixer={0} grainOverlay={0} speed={reduce ? 0 : 0.2} style={{position:'absolute',inset:0}} />
//    : <div className="css-backdrop" style={{background:c[0]}}>{c.slice(1).map(x => <i style={{background:x}} />)}</div>
// + <div className="grain-layer" /> + velo opcional
```

`.css-backdrop i`: círculos absolutos al 70 % con `filter: blur(80px)` y una animación `drift` lenta (18 s, alternate) desactivada con `prefers-reduced-motion`.

## Muelles y cifras

```ts
export const spring = formal
  ? { snappy: { type: 'spring', stiffness: 400, damping: 40 }, soft: { type: 'spring', stiffness: 400, damping: 40 }, heavy: { type: 'spring', stiffness: 300, damping: 36 } }
  : { snappy: { type: 'spring', stiffness: 400, damping: 30 }, soft: { type: 'spring', stiffness: 200, damping: 18 }, heavy: { type: 'spring', stiffness: 80, damping: 20 } };
```

```tsx
// cifra que cuenta (motion 14 no trae AnimateNumber)
const mv = useMotionValue(value);
const text = useTransform(mv, v => v.toLocaleString('es-ES', { maximumFractionDigits: d, minimumFractionDigits: d }));
useEffect(() => { const c = animate(mv, value, reduce ? { duration: 0 } : { duration: .7, ease: [.22, 1, .36, 1] }); return () => c.stop(); }, [value]);
// <span role="img" aria-label="236 horas"><motion.span aria-hidden className="dot-digits">{text}</motion.span></span>
```

## Hoja móvil que se cierra arrastrando

`drag="y"` con `dragConstraints={{ top: 0 }}`; al soltar, cierra si `offset.y > 120 || velocity.y > 600`, si no vuelve con muelle. En el asa: `onPointerDown={e => e.preventDefault()}` y `select-none`, o el segundo arrastre se convierte en arrastre nativo del navegador y no cierra. Escape también cierra.
