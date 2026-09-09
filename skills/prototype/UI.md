# Prototipo de UI

Genera **varias variaciones de UI radicalmente distintas** en una sola ruta, conmutables desde una barra flotante inferior. El usuario alterna entre variantes en el navegador, elige una (o roba trozos de cada una) y tira el resto.

Si la pregunta es sobre lógica/estado en lugar de qué aspecto tiene algo — rama equivocada. Usa [LOGIC.md](LOGIC.md).

## Cuándo esta es la forma correcta

- "¿Qué aspecto debería tener esta página?"
- "Quiero ver unas cuantas opciones para este dashboard antes de comprometerme."
- "Prueba una disposición distinta para la pantalla de ajustes."
- Cualquier momento en que el usuario, si no, se pasaría un día eligiendo entre tres mockups vagos que tiene en la cabeza.

## Dos sub-formas — prefiere claramente la sub-forma A

Una UI se juzga mucho mejor cuando está **pegada al resto de la app** — header real, sidebar real, datos reales, densidad real. Una ruta desechable por sí sola es un vacío: toda variante se ve bien aislada. Elige por defecto la sub-forma A siempre que haya una página existente plausible que aloje las variantes. Recurre a la sub-forma B solo si el prototipo genuinamente no tiene un hogar cercano.

### Sub-forma A — ajuste sobre una página existente (preferida)

La ruta ya existe. Las variantes se renderizan **en la misma ruta**, condicionadas por un parámetro de búsqueda `?variant=` en la URL. La obtención de datos, los parámetros y la autenticación existentes se mantienen — solo cambia el renderizado. Esta es la opción por defecto; elígela salvo que haya una razón específica para no hacerlo.

Si el prototipo es para algo que aún no tiene página pero *viviría de forma natural dentro de una* (una sección nueva del dashboard, una tarjeta nueva en la pantalla de ajustes, un paso nuevo en un flujo existente) — eso sigue siendo sub-forma A. Monta las variantes dentro de la página anfitriona.

### Sub-forma B — una página nueva (último recurso)

Úsala solo cuando lo que se está prototipando genuinamente no tiene página existente donde vivir — p. ej. una superficie de nivel superior completamente nueva, o un flujo que no puede incrustarse en ningún sitio con sentido.

Crea una **ruta desechable** siguiendo la convención de rutas que el proyecto ya use — no inventes una estructura nueva de nivel superior. Nómbrala de forma que sea obvio que es un prototipo (p. ej. incluye la palabra `prototype` en la ruta o el nombre de archivo). Mismo patrón `?variant=`.

Antes de comprometerte con la sub-forma B, comprueba: ¿de verdad no hay ninguna página existente donde esto pudiera incrustarse? Una ruta vacía esconde problemas de diseño que una poblada sí expondría.

En ambas sub-formas la barra flotante inferior es idéntica.

## Proceso

### 1. Enuncia la pregunta y elige N

Por defecto, **3 variantes**. Más de 5 deja de ser radicalmente distinto y empieza a ser ruido — pon el tope ahí.

Anota el plan en una línea, en la ubicación del prototipo o en un comentario al principio del archivo:

> "Tres variantes de la página de ajustes, conmutables vía `?variant=`, en la ruta existente `/settings`."

Esto funciona tanto si el usuario está aquí para rebatir como si no.

### 2. Genera variantes radicalmente distintas

Redacta cada variante. Somete cada una a:

- El propósito de la página y los datos a los que tiene acceso.
- La librería de componentes / sistema de estilos del proyecto (TailwindCSS, shadcn, MUI, CSS plano, lo que sea).
- Un nombre de componente exportado claro, p. ej. `VariantA`, `VariantB`, `VariantC`.

Las variantes deben ser **estructuralmente distintas** — distinta disposición, distinta jerarquía de información, distinta acción principal, no solo distintos colores. Tres rejillas de tarjetas ligeramente ajustadas no es un prototipo de UI, es papel pintado. Si dos borradores salen demasiado parecidos, rehaz uno con la indicación explícita de "no uses una rejilla de tarjetas".

### 3. Conéctalas

Crea un único componente conmutador en la ruta:

```tsx
// pseudocódigo — adáptalo al framework del proyecto
const variant = searchParams.get('variant') ?? 'A';
return (
  <>
    {variant === 'A' && <VariantA {...data} />}
    {variant === 'B' && <VariantB {...data} />}
    {variant === 'C' && <VariantC {...data} />}
    <PrototypeSwitcher variants={['A','B','C']} current={variant} />
  </>
);
```

Para la sub-forma A (página existente): mantén toda la obtención de datos existente por encima del conmutador; solo cambia el subárbol renderizado por variante.

Para la sub-forma B (página nueva): la ruta desechable bajo `/prototype/<nombre>` monta el mismo conmutador.

### 4. Construye el conmutador flotante

Una pequeña barra de posición fija en el centro-inferior de la pantalla con tres piezas:

- **Flecha izquierda** — pasa a la variante anterior (da la vuelta al llegar al final).
- **Etiqueta de variante** — muestra la clave de la variante actual y, si la variante exporta un nombre, también ese nombre. P. ej. `B — Disposición con sidebar`.
- **Flecha derecha** — avanza (da la vuelta).

Comportamiento:

- Al pulsar una flecha se actualiza el parámetro de búsqueda de la URL (usa el router del framework — `router.replace` en Next, `navigate` en React Router, etc.) para que la variante sea compartible y estable al recargar.
- Teclado: las teclas `←` y `→` también rotan. No interceptes las flechas cuando un `<input>`, `<textarea>` o `[contenteditable]` tenga el foco.
- Visualmente distinta de la página (p. ej. una pastilla de alto contraste, sombra sutil) para que sea obvio que no forma parte del diseño que se está evaluando.
- Oculta en builds de producción — condiciónala con `process.env.NODE_ENV !== 'production'` o una comprobación equivalente, para que un merge despistado del prototipo no pueda enviar la barra a los usuarios.

Pon el conmutador en un único componente compartido para que ambas sub-formas puedan reutilizarlo. Ubícalo donde vivan los componentes de UI compartidos en el proyecto.

### 5. Entrégalo

Muestra la URL (y las claves `?variant=`). El usuario irá alternando cuando pueda. El feedback interesante suele ser **"quiero el header de B con el sidebar de C"** — ese es el diseño real que quiere.

### 6. Captura la respuesta y limpia

Una vez una variante ha ganado, captura la respuesta — qué variante y por qué — y luego captura el prototipo como describe la [SKILL](SKILL.md). Integra la ganadora en el código real y mueve el resto a la rama desechable, no a main:

- **Sub-forma A** — integra la ganadora en la página existente; quita de main las variantes perdedoras y el conmutador.
- **Sub-forma B** — promociona la variante ganadora a una ruta real; quita de main la ruta desechable y el conmutador.

El conjunto completo de variantes es la fuente primaria, así que aterriza en la rama desechable, no en la papelera — los componentes de variantes y el conmutador que se quedan en main se pudren rápido y confunden al siguiente lector.

## Antipatrones

- **Variantes que solo difieren en color o texto.** Eso es un ajuste, no un prototipo. Las variantes reales discrepan sobre la estructura.
- **Compartir demasiado código entre variantes.** Un `<Header>` compartido está bien; un `<Layout>` compartido arruina el propósito. Cada variante debe ser libre de tirar la disposición.
- **Conectar las variantes a mutaciones reales.** Los prototipos de solo lectura están bien. Si una variante necesita mutar, apúntala a un stub — la pregunta es "qué aspecto debería tener esto", no "funciona el backend".
- **Promocionar el prototipo directamente a producción.** El código de la variante se escribió bajo restricciones de prototipo (sin tests, manejo de errores mínimo). Reescríbelo bien cuando lo integres.
