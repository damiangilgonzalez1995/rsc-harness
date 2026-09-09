---
name: mejor-layout
description: "Use when building or reviewing a screen's layout — grouping, alignment, reading order, progressive disclosure, spacing, breakpoints, translated-text growth, and RTL."
tags: ["layout", "responsive-design", "ui-design"]
profiles: [ui, full]
---

# Layout

La posicion, el espaciado y la alineacion transmiten jerarquia antes de que se lea una sola palabra. Esta skill construye esa estructura y la somete a esfuerzo: redimensionala, traducela, reflejala en RTL.

Escribe cada arreglo en el sistema de estilos del proyecto. Los numeros de abajo son puntos de partida para interfaces sin sistema de densidad establecido; donde haya uno, usalo tal cual y no un sustituto que se le parezca. Conserva el chrome de plataforma deliberado, las herramientas profesionales compactas y los tokens del proyecto mientras sigan pasando las pruebas de esfuerzo.

Las areas de pulsacion y el comportamiento del foco son de `mejor-accesibilidad`. Radios, sombras y animacion son de `mejor-ui`. La longitud de linea y el espaciado del texto son de `mejor-tipografia`.

## Agrupa con espacio, no con lineas

Primero espacio, luego formas de fondo, y lineas separadoras al final, solo donde el espacio por si solo no sostiene la estructura. El hueco ENTRE grupos debe ser al menos 2x el hueco DENTRO de uno (`8px` intragrupo frente a `16px`+ intergrupo), o la agrupacion se lee como ruido. Los bordes de alineacion y el orden de importancia estan en [grouping-and-alignment.md](grouping-and-alignment.md).

## Manten los controles distintos del contenido

Da a todo elemento interactivo una forma de fondo, un borde o una zona de colocacion consistente. Un control estilizado como el texto estatico de al lado no se lee como control.

## Alinea a bordes compartidos

Elige bordes de alineacion y respetalos; cada borde suelto se lee como ruido. Usa un paso de espaciado del proyecto por nivel de subordinacion, con `16px` como valor por defecto util.

Usa propiedades logicas para el layout dependiente de direccion: `padding-inline-start`, `margin-inline-end`. Reserva left y right fisicos para geometria genuinamente fisica.

## Ordena por importancia

El contenido mas importante va arriba y en el borde de inicio. El orden de lectura fluye de arriba a abajo y de inicio a fin. Piensa en inicio y fin, no en izquierda y derecha.

## Insinua el contenido oculto

La divulgacion progresiva necesita una pista visible. Usa la senal establecida del proyecto, o deja que el siguiente elemento asome `16-32px` mas alla del borde de scroll, o muestra un control de despliegue. Contenido escondido sin ninguna pista es como si no existiera.

## Aire entre objetivos

Sin un sistema de densidad establecido, empieza con `12px` entre controles adyacentes con borde o relleno y `24px` alrededor de los que son solo texto o solo icono sin borde. Los layouts compactos pueden usar menos, siempre que las areas de pulsacion de `mejor-accesibilidad` no se solapen y los controles sigan distinguiendose. Los margenes de layout y las recetas de breakpoint estan en [spacing-and-adaptivity.md](spacing-and-adaptivity.md).

## Separa los botones de los bordes

En layouts de contenido, manten los botones a ancho completo dentro de los margenes del layout y con un radio visible, empezando cerca de `16px` en movil. Las acciones de borde a borde funcionan cuando siguen el chrome establecido de la plataforma, respetan las areas seguras y siguen siendo distinguibles de la UI del sistema.

## El contenido sangra, los controles flotan

Fondos y medios llegan hasta los bordes del viewport. Controles y texto se quedan dentro de los margenes del layout y las areas seguras (`env(safe-area-inset-*)`). El chrome pegajoso flota sobre la capa de contenido en lugar de bloquearla.

## Sostiene la estructura hasta que rompa

Los breakpoints salen del contenido, no de presets de dispositivo. Manten el layout expandido mientras quepa de verdad y colapsa tarde. Prefiere container queries para adaptacion a nivel de componente, y prueba primero los tamanos mas pequeno y mas grande.

## Preve el crecimiento y el recorte

Las cadenas traducidas crecen, y las cortas crecen proporcionalmente mas: la etiqueta de boton de una sola palabra es lo mas arriesgado de la pantalla. No pongas ancho ni alto fijo a un contenedor de texto, y deja que las filas hagan wrap. Prueba con pseudo-localizacion y un idioma representativo en vez de presupuestar un porcentaje.

Nunca aparques una accion critica donde redimensionar o hacer scroll la recorte. Dejala en el flujo normal, o en chrome estable adecuado al producto.

## Antes de terminar

| Error | Arreglo |
| --- | --- |
| `margin-left` / `padding-right` en un layout localizable | `margin-inline-start` / `padding-inline-end` |
| Boton de layout de contenido tocando el borde del viewport | Sangralo dentro de los margenes; conserva el chrome de plataforma intencionado |
| Breakpoints en 768/1024 porque son los de por defecto | Rompe donde el contenido deja de caber de verdad |
| Contenedor de texto de ancho fijo dimensionado para un idioma | `max-width` y wrap; prueba pseudo-localizacion |
| Accion principal al fondo recortable de un panel | Posicion sticky o chrome estable con padding de area segura |

## Como reportar

**Severidad.** `ALTA` bloquea contenido o una accion en un viewport soportado. `MEDIA` dana la jerarquia, el orden de lectura o la adaptabilidad. `BAJA` es pulido aislado de alineacion o espaciado.

**Verificacion.** Sin navegador: propiedades logicas en lugar de fisicas, container y media queries contra la lista de viewports soportados, y orden del DOM contra el orden de lectura pretendido. Con navegador: cada ancho soportado, zoom al 200% y el espejo RTL. Reporta como `No verificado` toda comprobacion que no pudieras ejecutar.

**Formato.** Agrupa los hallazgos bajo el principio que incumplen, ordenados por severidad, una fila por causa raiz listando todas las ubicaciones donde aparece:

| Severidad | Ubicacion | Antes | Despues | Por que |
| --- | --- | --- | --- | --- |

`Ubicacion` es `ruta/al/fichero:linea`. `Por que` nombra el principio y el impacto en el usuario.

Termina con `Bloquear` si queda alguna `ALTA`, y con `Aprobar` en caso contrario, dejando el resto en la tabla como trabajo pendiente. Nunca `Aprobar` cobertura que no inspeccionaste. Si no hay nada que reportar, di "Sin hallazgos accionables de layout" y reporta la verificacion.
