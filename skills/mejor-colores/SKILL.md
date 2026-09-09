---
name: mejor-colores
description: "Use to build a color system or answer anything about color in the project — generating palettes, using semantic tokens, converting between formats, measuring contrast, choosing a gradient's interpolation space, and setting up dark mode."
tags: ["color", "design-tokens", "contrast", "dark-mode"]
---

# Colores

Un sistema de color es un conjunto pequeno de rampas, nombradas por rol y verificadas contra los fondos sobre los que se renderizan de verdad. La mayoria de los fallos de color son fallos de sistema: un valor elegido aislado, un token tomado prestado porque quedaba bien, un par que nadie midio.

Nunca reportes un valor de contraste que no mediste, y nunca estimes un color que puedes calcular. El color es una de las pocas cuestiones de interfaz con respuesta exacta, asi que produce la respuesta exacta.

Los requisitos de contraste son de `mejor-accesibilidad`. Superficies, sombras y color de iconos son de `mejor-ui`.

## Adáptate al sistema de color del proyecto

Reutiliza los tokens y la notacion del proyecto. Una segunda representacion anadida para arreglar un valor hace la paleta mas dificil de razonar. Un sistema consistente en hex vale mas que hex con `oklch()` desperdigado.

Para un sistema nuevo, `oklch()` es el mejor defecto, porque sus numeros se comportan como describen las reglas de rampa de abajo. En cualquier otro caso, una libreria de color produce la misma rampa en la notacion del propio proyecto ([color-formats.md](color-formats.md)).

## Un sistema son rampas, no colores

Una rampa neutra, una rampa de acento y solo las rampas de estado que el producto renderiza de verdad. Una rampa `warning` que nadie importa es mantenimiento por cero pixeles. Un segundo tono de acento se gana su sitio solo cuando dos cosas deben distinguirse de un vistazo.

## Cada paso tiene un trabajo

Una rampa no es un degradado del que elegir a ojo. Cada paso existe porque un rol lo necesita: fondo de pagina, hover de componente, borde, relleno solido, texto de cuerpo. No generes un paso que ningun rol consume. Tanto la convencion `50`-`950` de Tailwind como la `1`-`12` de Radix mapean a esos roles ([palette-structure.md](palette-structure.md)).

## Nombra las primitivas por tono y las semanticas por rol

Las primitivas nombran un valor (`--blue-500`) y nunca se aplican en un componente. Los tokens semanticos nombran un trabajo (`--color-text-secondary`), apuntan a una primitiva y son la unica capa que referencian los componentes.

Esa costura es lo que hace posible el theming. Sin ella, el modo oscuro significa auditar cada uso para deducir cual queria decir "el acento" y cual solo queria azul ([token-naming.md](token-naming.md)).

## Usa un token solo en su rol

Nunca tomes prestado un token porque su valor sea el correcto hoy. Un separador usado como color de texto funciona hasta que los bordes se aclaran, y entonces el texto se va con ellos. Si un rol no tiene token, anade el token.

## Manten el tono a lo largo de la rampa

Cuatro propiedades definen una rampa bien formada:

- Los pasos avanzan de forma pareja en luminosidad *percibida*, no en lo que el formato llame luminosidad.
- El tono se mantiene constante de punta a punta.
- La viveza tiene su pico a mitad de rampa y cae en los dos extremos.
- Los pasos van mas densos en el extremo claro que en el oscuro.

Ambos extremos se quedan cortos del negro y el blanco puros, que no pueden llevar tono. Usa una libreria de color en vez de hacerlo a ojo ([palette-generation.md](palette-generation.md)).

## Un color, un significado

Usa un color para un unico proposito en toda la interfaz, tratando como el mismo color cualquier cosa dentro de `15°` de tono. Si el acento significa "interactivo", ese tono sobre texto estatico le dice al usuario que pulse algo que no es pulsable, y un elemento interactivo renderizado en neutro engana igual de mal. El color nunca es el unico portador de significado, cosa que posee `mejor-accesibilidad`.

## Rellena exactamente una accion por vista

Cuando el color de relleno codifica el enfasis principal, una sola accion primaria lo recibe y sus pares se quedan neutras. Pon el color en el fondo, no en la etiqueta. Un boton relleno se lee como primario desde el otro lado de la sala; texto en color de acento sobre un boton neutro se lee como un enlace.

Varios fondos de color estan bien cuando codifican estados o categorias distintas en vez de competir como iguales.

## Mide el par renderizado y luego reporta

Mide un primer plano contra el fondo sobre el que se renderiza de verdad, no contra el fondo de la pagina. Cuando un par falla, reporta el par, su valor medido y el umbral que no alcanza, y luego deja los colores en paz. Son una decision de diseno. Cambialos solo cuando te lo pidan, y vuelve a medir despues ([contrast.md](contrast.md)).

## Elige el espacio de interpolacion de un degradado

El espacio es un look, no un ajuste de correccion.

- **`in oklab`** es el mejor defecto: brillo parejo, sin sorpresas de tono.
- **`in oklch`** viaja por la rueda de tonos en vez de por el centro, manteniendose vivo y barriendo todos los tonos entre las paradas. Cógelo cuando un degradado de dos tonos se vuelve gris por el medio.
- **El sRGB por defecto** oscurece y apaga el punto medio. Es lo que ya tienen casi todas las interfaces, porque es lo que sale sin pedir nada.

Ver [color-usage.md](color-usage.md).

## Antes de terminar

| Error | Arreglo |
| --- | --- |
| Un valor crudo donde el proyecto tiene un token | Reutiliza o anade el token de rol, en la notacion del proyecto |
| Un `oklch()` suelto metido en un codebase de hex | Manten la notacion establecida salvo que la migracion este en el alcance |
| Una primitiva como `--blue-500` usada directamente en un componente | Apunta un token semantico a ella |
| Token nombrado por su apariencia (`--color-blue-button`) o por su primer uso (`--color-sidebar-gray`) | Nombralo por su rol: `--color-accent-solid`, `--color-bg-surface` |
| `--color-primary` significando la marca y `--color-text-primary` significando texto de cuerpo | Reserva `accent` para la marca; deja que `primary` signifique "el mas prominente de su grupo" |
| Token semantico usado fuera de su rol (separador como texto) | Anade un token para el rol que falta; nunca tomes prestado por valor |
| Rampa construida variando la luminosidad HSL | Reconstruyela contra luminosidad percibida con tono constante |
| Rampa espaciada uniformemente en todo el rango | Aprieta el extremo claro hasta que `50` y `100` se lean como dos superficies |
| El mismo numero de saturacion reutilizado entre tonos | Iguala la proporcion del maximo de cada tono, no el valor crudo |
| Tono de estado que choca con el tono de acento | Muevelo hasta que destructivo y primario se lean distintos uno al lado del otro |
| Modo oscuro hecho invirtiendo mecanicamente la paleta clara | Invierte como punto de partida, luego reduce viveza, ensancha el extremo oscuro y revisa cada par |
| `prefers-color-scheme` fijando unos tokens y una clase `.dark` fijando otros | Elige un unico mecanismo de conmutacion y usalo en todo |
| Contraste arreglado cambiando el tono | Cambia la luminosidad, que es el canal al que responde el contraste |
| Color P3 sin respaldo sRGB | Declara el valor sRGB primero y sobreescríbelo dentro de `@media (color-gamut: p3)` |

## Como reportar

**Severidad.** `ALTA` hace el contenido ilegible o asigna un color semantico enganoso. `MEDIA` es un fallo apreciable de tema, token o gama. `BAJA` es pulido aislado.

**Verificacion.** Sin navegador: valores de token, gama de cada color declarado, presencia de ambos bloques de tema y contraste calculado desde el par de tokens declarado. Con navegador: el fondo realmente renderizado tras el texto, incluida la opacidad y cualquier imagen debajo, medido en claro y en oscuro. Un par que falla se reporta, no se repinta. Reporta como `No verificado` toda comprobacion que no pudieras ejecutar.

**Formato.** Agrupa los hallazgos bajo el principio que incumplen, ordenados por severidad, una fila por causa raiz listando todas sus ubicaciones:

| Severidad | Ubicacion | Antes | Despues | Por que |
| --- | --- | --- | --- | --- |

Termina con `Bloquear` si queda alguna `ALTA`, y `Aprobar` en caso contrario. Nunca `Aprobar` cobertura que no inspeccionaste. Si no hay nada, di "Sin hallazgos accionables de color" y reporta la verificacion.
