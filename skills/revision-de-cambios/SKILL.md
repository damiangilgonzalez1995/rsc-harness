---
name: revision-de-cambios
description: "Reviews a CHANGE (uncommitted work, a branch, a commit range, or a pull request) rather than a screen. Resolves the scope, expands the touched files to the surfaces they affect, reads both sides of the diff, and classifies each finding as introduced, a regression, or pre-existing."
tags: ["code-review", "diff-review", "regression"]
disable-model-invocation: true
---

# Revision de cambios

Esta skill revisa un cambio, no una pantalla. Resuelve el alcance, expande los ficheros modificados a las superficies que afectan, lee los dos lados del diff y clasifica cada hallazgo.

El alcance es lo unico que le pertenece. Las reglas de dominio son de las skills `mejor-*`. La severidad, la consolidacion, la cobertura, el tope y el veredicto son de `revision-interfaz`, a quien esta skill entrega la revision.

La correccion funcional, los tests, la seguridad y el rendimiento son de la revision de codigo general del proyecto. Nombra la preocupacion una vez y sigue.

## El cambio, no el codebase

El autor esta preguntando "he empeorado esto?". Reporta lo que el cambio provoco y quedate mayormente callado sobre lo que simplemente toco. Tres hallazgos preexistentes son una cortesia; treinta son otra revision distinta que nadie pidio.

Lee el cambio antes de formarte una opinion sobre el. La intencion declarada decide que cuenta como incompleto, y un diff leido por encima produce hallazgos sobre codigo que el siguiente hunk ya arregla.

## Principios centrales

### 1. Resuelve primero el alcance del cambio

Toda la invocacion es el objetivo, asi que `/revision-de-cambios pr 482` revisa el pull request 482.

Sin objetivo indicado, resuelve en este orden y para en la primera coincidencia:

1. `HEAD` va por delante de `git merge-base origin/<rama-por-defecto> HEAD`: ese rango **mas** cualquier cambio sin commitear, indicando por separado el numero de commits y el de ficheros sin commitear.
2. El arbol de trabajo esta sucio: los cambios sin commitear.
3. Ninguno de los dos: no hay cambio que revisar. Para y pregunta.

El orden importa. Si compruebas primero el arbol de trabajo, una edicion suelta de formato eclipsa una rama de doce commits, y el informe seguira afirmando cobertura completa.

Excluye lockfiles, snapshots, salida generada, codigo vendorizado y binarios, y di que excluiste. Un alcance vacio tras las exclusiones llega al mismo sitio por otro camino.

### 2. Sin cambio, pregunta en vez de inventarte uno

Un arbol limpio y sin nada por delante del merge-base significa que el usuario pidio revisar un cambio que no existe. Nunca caigas por tu cuenta en `HEAD~1..HEAD`. El ultimo commit es lo que haya aterrizado, a menudo un merge, a menudo trabajo de otro, y un informe sobre el es indistinguible de un informe sobre lo que el usuario queria decir.

Expon los hechos del repositorio que encontraste y ofrece las rutas, y espera:

- **El ultimo commit**, `HEAD~1..HEAD`, nombrado por SHA corto y asunto, para que el usuario vea que obtendria antes de elegirlo.
- **Un objetivo que el nombre**: `pr <n>`, una rama, una ref o un rango.
- **Una auditoria de interfaz de todo el repositorio**, que no es una revision de cambio. Entregala a `revision-interfaz` como revision de alcance de repositorio, sin el bloque de alcance de esta skill, sin estados y sin seccion de preexistentes. Sin cambio, todo hallazgo es preexistente y la clasificacion no dice nada.

Comprueba si hay un pull request abierto en la rama actual antes de preguntar, y ofrecelo el primero. Una rama cuyos commits ya aterrizaron resuelve a "sin cambio", pero su pull request sigue siendo exactamente lo que el usuario queria decir.

Cuando el alcance se quede vacio tras las exclusiones, di que ficheros excluiste y pregunta igual. Nunca reportes como `Aprobar` una revision de nada.

### 3. Un diff no es una superficie

Un fichero modificado es evidencia, no el sujeto de la revision. Su **radio de impacto** es el conjunto de superficies en las que se renderiza; revisa esas.

Expande el radio un salto por defecto: los importadores y llamantes directos. Expande un segundo salto solo para tokens de diseno, valores de tema y primitivas compartidas, donde una linea llega a todo el producto.

Revisa como maximo cinco consumidores y luego di cuantos no expandiste. Un barrido sin limite no puede sostener la cobertura que afirma, y un corte no declarado se lee como completitud.

### 4. Lee las lineas eliminadas

Las regresiones son invisibles en el estado posterior al cambio. Lee el lado `-` de cada hunk buscando senales eliminadas: nombres accesibles, indicadores de foco, gating de `prefers-reduced-motion`, roles ARIA, etiquetas, textos alternativos, gestion de estados.

Una senal es una pista, no un hallazgo. Una eliminacion solo es regresion cuando nada en el cambio la sustituye, y ese juicio es de la skill de dominio. Enruta cada eliminacion sin equivalente a su propietaria, reporta solo lo que esa skill confirme y marcalo con estado `Regresion`. Eso le dice al autor que rompio algo que funcionaba, en vez de que cometio un error nuevo.

### 5. Clasifica cada hallazgo

Da a cada hallazgo un estado:

- `Introducido`: el cambio lo creo.
- `Regresion`: el cambio debilito algo que antes era correcto.
- `Preexistente`: estaba en el codigo tocado pero no lo causo este cambio.

El estado va por lo que el diff toco, no por el fichero en el que vive: una linea que el cambio nunca toco es `Preexistente` aunque este a tres lineas de un hunk. Confirmalo contra la ref base cuando importe:

```bash
git blame -L <linea>,<linea> "$BASE" -- ruta/al/fichero
```

Entrega cada hallazgo con su estado adjunto y deja que `revision-interfaz` aplique su tope y sus reglas de veredicto.

### 6. Somete el cambio a su intencion declarada

Lee el titulo y el cuerpo del pull request, la issue enlazada y los mensajes de commit, y revisa si la interfaz entrega lo que afirman.

Esto es lo que saca a la luz el cambio **incompleto**. Una revision de superficie no puede verlo, porque inspecciona los estados presentes, y aqui el asunto son los ausentes:

- Una variante, tamano o tema nuevo aplicado a algunos estados pero no a todos: hover, foco, activo, deshabilitado, cargando, seleccionado.
- Un texto nuevo de cara al usuario sin entrada en el catalogo de traducciones que mantiene el proyecto.
- Un componente nuevo sin estado vacio, de carga, de error, deshabilitado o de anchura estrecha.
- Un control anadido a una superficie pero no a las hermanas que ya llevan sus pares.

No reportes ampliacion de alcance. Si un cambio hace demasiado es una cuestion de proceso, no de interfaz.

### 7. Entrega la revision a `revision-interfaz`

Entrega a `revision-interfaz` el bloque de alcance, las superficies afectadas y un estado por hallazgo. Ella enruta a las skills de dominio, aplica severidad, consolida, hace cumplir el tope y emite el veredicto.

Si `revision-interfaz` no esta disponible, reporta el alcance resuelto y el inventario de ficheros, nombra la skill que falta y para. No te inventes una escala de severidad, un tope ni un veredicto.

### 8. Nunca mutes el arbol de trabajo

Una revision de cambio es de solo lectura, incluido el checkout. Trae las refs de pull request; nunca hagas checkout de ellas. `git fetch` solo escribe en `.git` y esta permitido. `gh pr checkout`, `git checkout`, `git switch` y `git stash` reescriben los ficheros que el autor tiene abiertos: fallan contra ediciones locales o las descartan, asi que nunca estan permitidos.

La verificacion renderizada es opcional y bajo peticion. Marca las afirmaciones visuales y de ejecucion como **No verificado** salvo que el proyecto exponga una vista previa barata o el usuario pida revision renderizada. Cuando lo haga, usa un worktree aislado (`git worktree add /tmp/review-<n> refs/remotes/pr/<n>`) y quitalo al terminar.

## Antes de terminar

| Error | Arreglo |
| --- | --- |
| Revisar una edicion suelta en vez de la rama | Comprueba `merge-base` antes que el arbol de trabajo, y reporta ambos recuentos |
| Revisar el ultimo commit porque no habia cambio | Expon los hechos y ofrece el ultimo commit, un objetivo nombrado o una auditoria de repositorio |
| Revisar hunks sin sus consumidores | Expande un salto, dos para tokens y primitivas, y di que te saltaste |
| Leer solo el lado `+` del diff | Busca en el lado `-` senales eliminadas de accesibilidad, foco, movimiento y texto |
| Reportar como regresion un reemplazo equivalente | Enruta la eliminacion a su propietaria; reporta solo lo que confirme |
| Reportar una eliminacion como error nuevo | Marcala `Regresion`, para que el autor sepa que antes funcionaba |
| Marcar `Introducido` una linea cercana a un hunk | Clasifica por lo que el diff toco, confirmado con `git blame` contra la ref base |
| Hacer checkout de un pull request para revisarlo | Trae la ref y revisala en el sitio |
| Citar numeros de linea que no existen en la ref revisada | Cita contra la ref head nombrada en el bloque de alcance |
| Repetir aqui la escala de severidad o el tope | Delega en `revision-interfaz` |
| Hallazgos de correccion, tests o seguridad en el informe | Nombra la preocupacion una vez, senala la revision de codigo del proyecto y suéltala |

## Formato de salida

Abre con el bloque de alcance:

| Campo | Valor |
| --- | --- |
| Objetivo | `rama`, `trabajo`, `staged`, `pr 482`, o el rango tal cual se introdujo |
| Ref base | `origin/main` en `a1b2c3d` |
| Ref head | `refs/remotes/pr/482` en `e4f5g6h` |
| Commits | 7 commiteados, 2 ficheros sin commitear |
| Ficheros en alcance | 12 tras exclusiones |
| Excluidos | `pnpm-lock.yaml`, `src/__snapshots__/`: lockfile y snapshots |
| Superficies expandidas | `PaginaCheckout`, `PanelAjustes`; 3 consumidores mas de `Button` sin expandir |

Detras va la tabla de cobertura sin cambios. Un dominio sin evidencia en el alcance del cambio es `No revisado: sin evidencia en el alcance del cambio`, que es una declaracion de cobertura, no un hueco.

Luego los hallazgos, con columna `Estado`:

| Severidad | Dominio | Estado | Ubicacion | Antes | Despues | Por que |
| --- | --- | --- | --- | --- | --- | --- |
| ALTA | Accesibilidad | Regresion | `src/Dialog.tsx:42` | `aria-label="Cerrar"` eliminado en este cambio | Restaura `aria-label="Cerrar"` en el control de solo icono | El control de cierre tenia nombre accesible antes de este cambio y ya no lo tiene |

Sin hallazgos `Introducido` ni `Regresion`, omite la tabla y di "Sin hallazgos accionables de interfaz en este cambio."

Luego los `Preexistente`, como maximo tres, de mayor severidad primero, indicados claramente como no responsabilidad de este cambio. Omite la seccion si no hay ninguno.

El tope y el veredicto cubren solo `Introducido` y `Regresion`. Los preexistentes quedan fuera del tope, para que tocar un fichero heredado no se convierta en una auditoria completa del fichero. Tambien quedan fuera del veredicto: un cambio cuyos unicos hallazgos son preexistentes es un `Aprobar`.

Termina con `Bloquear` si queda alguna `ALTA` y `Aprobar` en caso contrario, dejando el resto de hallazgos en la tabla como trabajo pendiente.
