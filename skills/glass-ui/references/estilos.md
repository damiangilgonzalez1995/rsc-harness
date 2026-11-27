# Los cuatro estilos

Base de color común (marca de la demo, cámbiala por la del proyecto): tinta `#0B2540`, secundario `#2C4A66`, turquesa `#0FB5BA`, océano `#0A7EA4`, azul `#1B4F8C`, dorado `#C9A24A → #E9CF86`.

| | Suave | Formal | Bruma | Nocturna |
|---|---|---|---|---|
| Para | Producto de consumo, demo vistosa | Herramienta profesional, B2B, datos densos | App clara, editorial, bienestar | App oscura, contenido, multimedia |
| Fondo | MeshGradient vivo turquesa/azul/blanco, velo claro | MeshGradient tenue (speed .04) fundido a blanco, grano 6 % | Gris niebla frío + silueta grande muy desenfocada | Casi negro azulado + un solo brillo difuso |
| Radios | Paneles 28–30 px, controles y chips píldora | Paneles 8, tarjetas/controles 6, chips 4, barras 2 | Generosos, píldora | Generosos, botones circulares |
| Material | Cristal blanco 40–60 % + blur 20 px + borde blanco 85 % | Mica (88 %, blur 48) en navegación; paneles 86 % con hairline `rgb(11 37 64/.08)`; Acrylic (74 %, blur 30) solo en el panel transitorio | Tarjeta héroe esmerilada grande; KPIs en píldora con degradado vivo y borde interior discontinuo | Cristal oscuro; portadas con desenfoque direccional + grano |
| Cifras (por defecto; la letra la decide el proyecto, ver tipografia.md) | Puntos | Tabular de la letra de texto, peso 500 | Puntos en píldoras, chip "↑ 1 %" | Tabular o puntos en blanco |
| Acento | Dorado en segmentado activo y FAB lente | Dorado solo en 2 px: indicador de navegación, línea del botón primario, anillo de progreso | Degradados rosa/naranja/violeta solo en métricas; "+" como esfera de lente | Píldora activa y botón circular de fila con degradado |
| Muelles | snappy 400/30, soft 200/18, heavy 80/20 | 400/40 y 300/36 (sin rebote) | Como suave | Como suave, entradas más lentas |
| Gestos | Inclinación 3D al pasar, rotación al arrastrar | Elevación 1 px, escala 1.02 al arrastrar, sin rotación | Selector de días con círculo blanco que se desliza (`layoutId`) | Detalle tipo reproductor: portada difuminada de fondo, botones de cristal redondos |
| Composición propia | Rejilla de tarjetas | Tabla real en escritorio, segmentados rectangulares, barra lateral anclada | Titular editorial con píldoras de color dentro de la frase | Filas tipo lista de pistas, barra inferior flotante de 4 iconos |

Detalles que funcionaron en la demo:

- **Bruma:** la tarjeta héroe es cristal esmerilado *oscuro* sobre la niebla clara (contrasta y ancla la pantalla); curva de área con punto activo, guía discontinua y etiqueta; el círculo blanco del día se desliza con `layoutId` y mueve el punto. KPIs: turquesa, rosa, violeta y naranja con Doto blanco. Fondo: silueta SVG de cabeza y hombros desenfocada con halo, sin WebGL.
- **Nocturna:** píldora activa (filtros y navegación) en degradado dorado→ámbar con texto oscuro; botones de fila turquesa→azul. Portadas: blur pequeño estirado en horizontal (`scaleX`) + grano. La carátula viaja de la tarjeta al detalle con `layoutId`. Progreso como onda de barras. Texto secundario `#A3B2C6` (~7:1). La cabecera móvil va sin cristal y la hoja de detalle opaca para no pasar de 3 `backdrop-filter`.
- Contenedores con `position: absolute` en animaciones de salida (kanban): el padre necesita `position: relative` o la pieza escapa y crea scroll horizontal en móvil.
- Reglas que deben ganar a utilidades de Tailwind (texto oscuro sobre píldora dorada) van fuera de `@layer`.

Bruma y Nocturna derivan de dos referencias del usuario (app de hidratación clara y app de meditación oscura). Si el proyecto no pide su paleta, conserva la de marca y deja los degradados vivos solo en métricas.

Cada estilo cambia **tokens** (radios, densidad, material) y, donde la estructura difiere de verdad, ramas de JSX por estilo. Un estilo que solo cambia colores no es un estilo.
