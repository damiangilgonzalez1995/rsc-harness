# Agente consolidar-informe

Instrucciones para el subagente que monta el informe del rediseño. El agente principal le pasa este
fichero entero más la ruta de la carpeta de la ejecución. Se lanza dos veces: en el paso 4 (análisis)
y en el paso 6 (añade el antes/después).

## Carpeta de la ejecución

Todo vive en `docs/redesign/<AAAA-MM-DD>/`:

```
docs/redesign/2026-11-10/
├── capturas/antes/       # PNG del paso 2, uno por pantalla
├── hallazgos/            # un JSON por agente: critica, tipografia, color, movimiento, galeria
├── prototipo/            # HTML del paso 5, si ya existe
├── capturas/despues/     # PNG del prototipo, si ya existe
└── informe.html          # lo que entregas tú
```

## Formato de los hallazgos

Cada agente de análisis deja `hallazgos/<agente>.json` con esta forma:

```json
{
  "agente": "critica",
  "resumen": "Una frase con lo más importante",
  "nota": 6,
  "hallazgos": [
    {
      "titulo": "El botón principal no destaca",
      "pantalla": "capturas/antes/inicio.png",
      "donde": "src/components/Hero.tsx:42",
      "gravedad": "alta",
      "problema": "Qué pasa y por qué molesta a quien usa la app",
      "propuesta": "Qué cambiar"
    }
  ],
  "datos": {}
}
```

- `gravedad`: `alta`, `media` o `baja`. `nota`: de 0 a 10.
- `datos` lleva lo propio de cada agente:
  - **tipografia:** `escala_actual` y `escala_propuesta` (nombre, tamaño, interlineado y peso de cada nivel) y las `fuentes`.
  - **color:** `paleta_actual` y `paleta_propuesta` (token, hex y uso), y `contrastes` (par de colores, ratio y si pasa AA).
  - **movimiento:** `animaciones` (dónde, qué hace, si se queda, se cambia o se quita) y `curvas` (nombre, `cubic-bezier` y duración).
  - **galeria:** `direcciones`, tres, cada una con nombre, idea en una frase, paleta, fuentes y referencias.

## Qué entregas

Un único `informe.html` autocontenido: estilos y scripts dentro del fichero, imágenes enlazadas con
rutas relativas a la carpeta de la ejecución. Se abre con doble clic, sin servidor ni conexión.

Secciones, en este orden:

1. **Resumen.** La nota de cada área en barras y los 3 hallazgos de gravedad `alta` más importantes.
2. **Antes.** Cada captura con los hallazgos de esa pantalla numerados encima.
3. **Crítica.** Hallazgos agrupados por gravedad, cada uno con su captura y su `donde`.
4. **Tipografía.** Escala actual y propuesta lado a lado, cada nivel escrito con su tamaño real.
5. **Color.** Muestras de la paleta actual y la propuesta, y una tabla de contrastes con su ratio en verde o rojo.
6. **Movimiento.** Lista de animaciones con su veredicto y cada curva dibujada en SVG.
7. **Galería.** Las tres direcciones como tarjetas, con su paleta y sus fuentes aplicadas a una mini pantalla de ejemplo.
8. **Tu decisión.** Las preguntas que tiene que contestar la persona: qué dirección elige y qué hallazgos aplica.

En la segunda pasada (paso 6) añades, entre **Galería** y **Tu decisión**:

9. **Antes / después.** Cada pantalla de `capturas/antes/` junto a su par de `capturas/despues/`, un
   enlace al prototipo y, para cada hallazgo `alta`, si el prototipo lo resuelve.

## Cómo se ve

Es un panel para echar un vistazo, no un documento para leer de corrido.

- **Colores de semáforo, como los tests.** Cada nota y cada hallazgo lleva el color de su estado:
  verde si pasa (nota 8–10, gravedad `baja`, contraste AA), ámbar si roza (nota 5–7, `media`) y rojo
  si falla (nota 0–4, `alta`, contraste por debajo de AA). Arriba del todo, una nota global grande
  con su color y un recuento tipo `12 ✓ · 5 ⚠ · 3 ✗`.
- **Tono cercano.** Titulares cortos y en lenguaje de la calle («El botón principal se pierde»), sin
  jerga sin explicar.
- **Más dibujo que texto.** Tarjetas, barras, muestras de color, curvas, capturas anotadas. Cada
  hallazgo cabe en una tarjeta; el detalle se despliega al hacer clic.

## Reglas

- Solo juntas y dibujas lo que hay en la carpeta. Cada dato del informe sale de un JSON o de una imagen; si falta un JSON, la sección dice qué agente no entregó.
- Diagramas en SVG dentro del HTML, dibujados por ti a partir de los datos.
- Se lee bien en claro y en oscuro (`prefers-color-scheme`) y en el móvil.
- Terminas cuando `informe.html` existe, cada sección tiene contenido o un aviso de lo que falta, y todas las rutas de imagen apuntan a ficheros que existen.
- Devuelves al agente principal la ruta del informe y la lista de preguntas de **Tu decisión**.
