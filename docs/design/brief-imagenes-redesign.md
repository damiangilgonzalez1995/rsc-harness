# Brief de imágenes · `/redesign` en el README

Encargo para Claude Design: seis imágenes nuevas para la sección **4. Interfaz (UX/UI)** del README.
La sección pasa a girar alrededor de una sola orden, `/redesign`: quien la lea tiene que entender
de un vistazo qué hace, en qué orden y dónde decide él.

Cada ficha trae el **nombre exacto del fichero** (va en `docs/img/readme/`), el tamaño, el texto
literal que lleva la imagen y una descripción de la escena. El diseño final es libre.

---

## Dirección de arte

Sigue la de [`brief-imagenes.md`](brief-imagenes.md) (paleta, tipografía, formas, PNG a 2×, nada
por debajo de 18 px a 1×), con tres añadidos para esta serie:

- **Personajes que se repiten en todas las imágenes:**
  - **La persona:** ilustración amable, con portátil. Es quien decide. Su gesto cambia según la
    escena (duda, elige, aprueba).
  - **El agente principal:** un robot pequeño y redondeado, con una pantalla por cara que cambia de
    expresión. Es el director: reparte trabajo y junta resultados.
  - **Los cinco ayudantes:** robots más pequeños, cada uno con su color y su herramienta (ver
    `readme-25`). Aparecen siempre igual para que se reconozcan.
- **La app:** una ventana de navegador con una pantalla de ejemplo. En el «antes» se ve genérica y
  algo desordenada; en el «después», con personalidad y aire.
- **Momentos en que decide la persona:** siempre marcados con una mano y el color `acento-2`. Lo
  automático, con un pequeño rayo y el color `acento`.

---

### `readme-23-redesign-una-orden.png` · 1600 × 800

**Una orden. Todo en cascada.** La imagen de entrada de la sección.

Escena: a la izquierda, la persona escribe en una terminal una sola línea, grande y en mono:
`/redesign`. De esa línea cae una cascada (como fichas de dominó o una cascada de agua) que pasa
por iconos pequeños: un documento, una cámara, cinco robots, una paleta de estilos, un prototipo,
una balanza y un editor de código. Al final de la cascada, a la derecha, la app rediseñada en una
ventana de navegador, brillando.

Texto de la imagen:
- Título: **Una orden. Todo el rediseño.**
- Bajo la terminal: *Tú no eliges skills. Eliges el estilo.*

---

### `readme-24-redesign-flujo.png` · 1600 × 1000

**El flujo, paso a paso.** Camino horizontal (o en zigzag) de siete paradas numeradas. Dos de ellas
son **puertas** donde decide la persona: van en `acento-2`, con una mano y un rombo.

| # | Parada | Icono / escena | Quién |
|---|---|---|---|
| 1 | **Contexto** | Dos documentos, `PRODUCT.md` y `DESIGN.md`; uno con una chispa de «recién creado» | ⚡ automático |
| 2 | **Capturas del antes** | Cámara de fotos sacando una foto a la app actual | ⚡ automático |
| 3 | **Cinco análisis a la vez** | Los cinco ayudantes trabajando en paralelo | ⚡ automático |
| 4 | **Eliges el estilo** | La persona elige una de tres tarjetas de estilo | ✋ decides tú |
| 5 | **Prototipo** | Una ventana de navegador con la app nueva, marcada «borrador» | ⚡ automático |
| 6 | **Antes / después** | Las dos pantallas lado a lado y la persona con el pulgar arriba | ✋ decides tú |
| 7 | **Programar** | El agente escribiendo código; la app real cambia | ⚡ automático |

Entre la parada 6 y la 7, un pequeño candado que se abre: *Sin tu sí, no se toca el código.*

Texto de la imagen:
- Título: **Siete pasos. Dos decisiones tuyas.**

---

### `readme-25-redesign-cinco-agentes.png` · 1600 × 1100

**Los cinco ayudantes.** En el centro, el agente principal reparte cinco sobres. Alrededor, en
círculo o en abanico, los cinco ayudantes, cada uno en su tarjeta con su herramienta, lo que lee y
lo que entrega.

| Ayudante | Herramienta en la mano | Lee | Entrega |
|---|---|---|---|
| **Crítica** | Lupa | Capítulos de crítica y auditoría de `impeccable` | Problemas de UX, ordenados por importancia |
| **Tipografía** | Una «Aa» grande | Capítulos de tipografía y jerarquía | Fuentes y escala de tamaños |
| **Color** | Paleta de pintor | Capítulos de color y modo oscuro | Paleta nueva y sus tokens |
| **Movimiento** | Una curva de animación (ease) | `animar`, `choreograph`, `animation-performance` | Qué animar, qué quitar y con qué curvas |
| **Galería** | Tres marcos de cuadro | `tastemaker` y referencias de estilo | Tres direcciones de estilo con ejemplos |

Abajo, las cinco entregas confluyen en un único informe que llega a la persona.

Texto de la imagen:
- Título: **Cinco miradas a la vez**
- Pie: *Analizan, no tocan nada. Tú decides qué se aplica.*

---

### `readme-26-redesign-elige-estilo.png` · 1600 × 900

**Tres direcciones, una elección.** La persona delante de tres tarjetas grandes, como cartas de un
juego, cada una con una miniatura de la misma pantalla en un estilo distinto:

1. **Sobrio:** mucho aire, blanco y negro, una tipografía seria.
2. **Cálido:** colores tierra, esquinas redondeadas, ilustraciones.
3. **Atrevido:** un color de acento fuerte, tipografía grande, contraste alto.

La persona señala una con la mano (en `acento-2`). El agente, al lado, sostiene un cartel con lo
que ya trae resuelto de los otros análisis: *problemas de UX · fuentes · paleta · movimiento*.

Texto de la imagen:
- Título: **Tú eliges el estilo. El resto ya viene hecho.**

---

### `readme-27-redesign-antes-despues.png` · 1600 × 900

**El antes y el prototipo, lado a lado.** Dos ventanas de navegador con la misma pantalla:

- **Antes** (izquierda): genérica. Degradado azul-morado, botones iguales, todo apretado, textos
  pequeños. Unas etiquetas rojas suaves señalan tres problemas: *jerarquía confusa*, *contraste
  bajo*, *animaciones que estorban*.
- **Prototipo** (derecha): con el estilo elegido. Las mismas tres zonas, ahora en verde: *se ve qué
  es lo importante*, *se lee bien*, *se mueve lo justo*.

Entre las dos, una flecha grande. Debajo, la persona con el pulgar arriba y un candado abierto que
lleva al editor de código: *Ahora sí, a programar.*

Texto de la imagen:
- Título: **Lo ves antes de tocar el código**

---

### `readme-28-redesign-o-una-skill.png` · 1600 × 900

**¿Todo o una cosa?** Un cruce de caminos con una señal y una pregunta: *¿Qué quieres cambiar?*

- **Camino izquierdo, ancho, en `acento`:** *Toda la interfaz* → un único botón grande `/redesign`.
  Al fondo, la app entera transformada.
- **Camino derecho, estrecho, en `texto-suave`:** *Una cosa concreta* → una fila de señales
  pequeñas, cada una con su problema y su skill en mono:
  - *Quiero animar algo* → `animar`
  - *Va a trompicones* → `animation-performance`
  - *Parece hecho por IA* → `tastemaker`
  - *Pulir antes de publicar* → `revision-interfaz`
  - *Datos raros lo rompen* → `break-ui`
  - *Parece una web en el móvil* → `mobile-native`

La persona está en el cruce, mirando el camino ancho.

Texto de la imagen:
- Título: **¿Toda la interfaz o una sola cosa?**
