---
name: mejor-tipografia
description: "Use when building or reviewing typography — size scale, spacing, line height, variable fonts, OpenType features, wrapping, truncation, tabular numbers, punctuation, and all the details that make text read well across a product."
tags: ["typography", "design-system", "readability"]
profiles: [ui, full]
---

# Tipografia

La tipografia es sobre todo contencion: una escala sensata, espaciado comodo, contraste suficiente. Una etiqueta, una celda de tabla, un titular de marketing y un parrafo de articulo no comparten un mismo juego de reglas.

Al revisar, lee la pagina renderizada en vez de escanear el codigo. El wrapping malo, las viudas y el truncado solo aparecen con longitudes de contenido reales.

Escribe cada arreglo en el sistema de estilos del proyecto, y usa los valores exactos de abajo en vez de equivalentes que se les parezcan. La [chuleta](css-cheat-sheet.md) mapea cada declaracion a su equivalente en Tailwind.

Las palabras en si son de `mejor-redaccion`. La estructura semantica de encabezados es de `mejor-accesibilidad`. El layout espacial RTL y las propiedades logicas son de `mejor-layout`. La medicion de contraste es de `mejor-colores`. Esta skill posee como se renderiza el texto, como hace wrap y como se comporta en contenido de direccion mixta.

## Sirve el formato correcto

Usa `.woff2` en web, por la compresion Brotli y el soporte amplio. `.woff` es el respaldo para navegadores muy viejos. `.ttf` y `.otf` son formatos de escritorio sin compresion web. Como se cargan los ficheros es asunto del proyecto.

## Propiedades antes que etiquetas crudas

Cuando exista una propiedad CSS, usala. `font-weight: 650` en vez de `font-variation-settings: "wght" 650`. `font-optical-sizing: auto` en vez de `"opsz"`. `font-variant-numeric: tabular-nums` en vez de `font-feature-settings: "tnum" 1`.

Las propiedades siguen funcionando cuando se renderiza un respaldo no variable. Reserva las etiquetas crudas para ejes propios (`"GRAD" 80`) y caracteristicas de nicho (`"ss01" 1`) que no tienen propiedad. Los ejes y las etiquetas de caracteristica estan en [variable-fonts-and-opentype.md](variable-fonts-and-opentype.md).

## Carga los pesos y estilos que usas

Los navegadores sintetizan un peso o un estilo que la familia activa no aporta, distorsionando la tipografia real. Carga las variantes que usa el diseno.

`font-synthesis: none` apaga la sintesis, pero borra el enfasis en vez de reportarlo. Ponlo solo tras comprobar que cada negrita, cursiva, versalita, superindice y subindice necesarios siguen distinguiendose en toda la pila de respaldo.

## Menos fuentes, tamanos y pesos

Rara vez uses mas de tres fuentes. El peso y el tamano definen la jerarquia; abusar de ellos dana la legibilidad rapido. Empareja por contraste, no por similitud: un titular serif sobre un cuerpo sans se lee como deliberado; dos sans casi identicas se leen como un error.

Por debajo de `18px`, quedate en peso `400` o mas. Los pesos por debajo de `300` son solo para display a `28px`+; a tamano de texto desaparecen. La guia de emparejado esta en [choosing-fonts.md](choosing-fonts.md).

## Usa una escala de tamanos con nombres semanticos

Define un conjunto pequeno de tamanos y desviate de el lo menos posible. Los tamanos a fuego sin sistema detras se rompen al escalar.

En solitario, nombres por defecto como `text-sm` valen si las reglas de uso estan claras. En equipo, nombra los tamanos por uso (`text-body-sm`) para que las reglas sobrevivan a otras personas. La construccion de la escala esta en [spacing-and-sizing.md](spacing-and-sizing.md).

## Los tamanos de encabezado descienden con el nivel

Mapea los niveles de encabezado a pasos descendentes de la escala, para que un encabezado visualmente subordinado nunca aplaste a su padre. Niveles adyacentes pueden compartir tamano hacia el extremo pequeno de la escala, siempre que el peso o el espaciado los mantenga distintos. El elemento semantico es de `mejor-accesibilidad`; esta skill fija solo el tratamiento visual.

## Interlineado por rol

Encabezados mas apretados, alrededor de `1.1`. Texto de cuerpo de `1.5` a `1.6`. Prefiere valores sin unidad, para que el interlineado escale con el tamano de fuente; un `24px` fijo no lo hace.

El interlineado apretado es para texto corto. Cualquier cosa que haga wrap a tres lineas o mas necesita al menos `1.4`, aunque sea una fila con altura limitada.

## Letter-spacing por tamano

Los titulares grandes suelen quedar mejor con letter-spacing ligeramente negativo. Las etiquetas pequenas en mayusculas necesitan un poco de positivo, o las letras se sienten apretadas. El cuerpo a tamanos de lectura no necesita ninguno.

## Limita la medida

Las lineas largas hacen dificil encontrar la siguiente. Limita el texto largo a 60-75 caracteres por linea. Vale cualquier unidad, siempre que exista un tope y la longitud de linea caiga en ese rango. Ver [eleccion de unidades y equivalencias en pixeles](wrapping-and-punctuation.md#measure-line-length).

## Haz wrap a proposito

Cuatro declaraciones, cuatro trabajos:

- `text-wrap: balance` reparte el texto uniformemente entre lineas. Usalo en encabezados.
- `text-wrap: pretty` evita que una sola palabra corta caiga en la ultima linea. Usalo en descripciones.
- `overflow-wrap: break-word` donde una palabra larga, un enlace o un ID puedan escaparse del contenedor.
- `white-space: nowrap` en etiquetas y badges donde un salto de linea parece roto.

Salta `balance` y `pretty` en texto largo.

## Numeros tabulares en valores que cambian

Los digitos tienen anchos distintos por defecto, asi que temporizadores, contadores y precios desplazan el layout al actualizarse. Aplica `font-variant-numeric: tabular-nums` a cualquier valor que cambie.

## Trunca sin perder contenido

Para una sola linea, `text-overflow: ellipsis` con `overflow: hidden` y `white-space: nowrap`. Para varias, `line-clamp`. El truncado oculta contenido: cuando el texto que falta importa, deja el valor completo alcanzable en un tooltip o en una vista expandida.

## Escribe el texto en natural, aplica estilo con CSS

Guarda el texto en su capitalizacion natural y controla la presentacion con `text-transform`, para que un rediseno no signifique reescribir textos.

Usa puntuacion tipografica en el texto renderizado:

- Comillas tipograficas en prosa, rectas en codigo.
- Raya para rangos: `2010-2020`.
- El caracter de puntos suspensivos, no tres puntos.
- `&nbsp;` para mantener juntos `16 px` en un salto de linea.
- `&shy;` para decir donde puede partirse una palabra larga.

## Subrayados desde la fuente

Los subrayados por defecto caen donde decide el navegador. Saca posicion y grosor de las metricas de la propia fuente con `text-underline-position: from-font` y `text-decoration-thickness: from-font`. Ajusta a mano con `text-decoration-thickness`, `text-underline-offset` y `text-decoration-skip-ink`.

`text-decoration-style` dibuja la linea punteada, discontinua u ondulada. Un subrayado punteado es una pista habitual de que una palabra lleva informacion extra, como una abreviatura o un termino definido.

El color es la unica parte de un subrayado real que anima de forma fiable. Asi que, salvo que lo unico que anime sea el color, construye el subrayado como un elemento aparte en vez de usar `text-decoration`.

## Inputs a 16px en movil

Safari de iOS hace zoom a toda la pagina cuando el texto de un input es menor de `16px`. Dos arreglos mantienen el tamano en `16px` y se ven distintos, asi que pregunta cual quiere el diseno:

- Subir el tamano del input en movil (`text-base sm:text-sm`). Cambia como se ve en pantallas pequenas.
- Mantener `font-size: 16px` y renderizar el tamano pretendido con `transform: scale()`, compensando ancho e interlineado. Identico en todos los viewports, mas codigo que mantener.

Las dos recetas estan en [details-and-accessibility.md](details-and-accessibility.md).

## Suelos de tamano y contraste

Empieza el texto largo de cuerpo en `16px`, el defecto del navegador. Baja de ahi solo por un motivo que sepas nombrar: la tipografia va pequena, la medida es estrecha, o el producto es una herramienta profesional densa.

El texto de UI puede ir mas pequeno. `14px` es un buen punto de partida para inputs y menus, `13px` para pies de foto, y rara vez por debajo de `12px`. Los inputs siguen necesitando `16px` en movil.

Cuando el texto parezca de bajo contraste, usa `mejor-colores` para medir el par renderizado y `mejor-accesibilidad` para clasificar el requisito. No toques los colores salvo que te lo pidan.

## Suavizado de fuentes en la raiz

En macOS el texto se renderiza mas pesado de lo pretendido. Aplica `-webkit-font-smoothing: antialiased` y `-moz-osx-font-smoothing: grayscale` una vez en el layout raiz, nunca por componente. El `antialiased` de Tailwind cubre ambos.

## Idioma y comportamiento bidi

Pon `lang` para que navegadores y tecnologia asistiva elijan la pronunciacion, las comillas y la division silabica correctas. Pon `dir` en el documento o en el limite de contenido donde cambia la direccion. Preserva el orden de los digitos, y usa `<bdi>` para aislar un valor de direccion mixta. El reflejo espacial y las propiedades logicas de CSS son de `mejor-layout`.

## Manten seleccionable el texto util

Deja el texto seleccionable por defecto. `::selection` puede llevar la marca a la experiencia de lectura, siempre que la combinacion seleccionada siga siendo legible.

`user-select: none` va en una superficie arrastrable o dirigida por gestos donde la seleccion accidental estorbe. Nunca en toda la interfaz, y nunca porque se pueda resaltar la etiqueta de un boton.

## Antes de terminar

| Error | Arreglo |
| --- | --- |
| La variante sintetizada difiere del diseno | Carga la variante real; desactiva solo el modo de sintesis verificado |
| Un encabezado hijo aplasta visualmente a su padre | Mapea la jerarquia de esa seccion a pasos descendentes de la escala |
| Elemento de encabezado elegido por su tamano por defecto | Elige primero la semantica y luego fija el tamano en CSS |
| Huerfana en la ultima linea de un parrafo | `text-wrap: pretty` |
| Encabezado de dos lineas descompensado | `text-wrap: balance` |
| Texto justificado en una interfaz | `text-align: start`; reserva justify para maquetas editoriales concretas |
| El subrayado corta los descendentes | `text-decoration-skip-ink: auto`, metricas `from-font` |
| Valor de direccion mixta en orden incorrecto | Corrige `lang`/`dir`; aisla el valor con `<bdi>` |
| Seleccion desactivada en el chrome de la aplicacion | Restaurala; suprimela solo donde choque con un arrastre o un gesto |
| Pista de informacion extra sin senal visual | Subrayado punteado con `text-decoration-style: dotted` |
| Peso Thin/Light en texto de UI de `14px` | Peso `400`+ por debajo de `18px`; los pesos finos son solo para display |
| `leading-none` en la descripcion de tres lineas de una tarjeta | Al menos `1.4` en cualquier texto que haga wrap a 3+ lineas |

## Como reportar

**Severidad.** `ALTA` hace el texto ilegible o trunca contenido sin forma de recuperarlo. `MEDIA` rompe el sistema tipografico o la jerarquia de encabezados. `BAJA` es pulido aislado.

**Verificacion.** Sin navegador: tamano y peso computados de cada nivel de encabezado, comprobados en descenso; interlineado y medida declarados; reglas de truncado contra longitudes de cadena realistas. Con navegador: redimensiona el viewport para cazar wrapping, viudas y truncado con contenido real. Reporta como `No verificado` toda comprobacion que no pudieras ejecutar.

**Formato.** Agrupa los hallazgos bajo el principio que incumplen, ordenados por severidad, una fila por causa raiz listando todas sus ubicaciones:

| Severidad | Ubicacion | Antes | Despues | Por que |
| --- | --- | --- | --- | --- |

Termina con `Bloquear` si queda alguna `ALTA`, y `Aprobar` en caso contrario. Nunca `Aprobar` cobertura que no inspeccionaste. Si no hay nada, di "Sin hallazgos accionables de tipografia" y reporta la verificacion.
