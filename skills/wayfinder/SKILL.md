---
name: wayfinder
description: "Plans a huge chunk of work — more than fits in a single agent session — as a shared map of decision tickets in the repo's issue tracker, and resolves them one at a time until the path to the destination is clear."
tags: ["planning", "issue-tracker", "large-scale-work"]
disable-model-invocation: true
profiles: [core, ui, full]
---

Ha llegado una idea difusa — demasiado grande para una sola sesión de agente, y envuelta en niebla: todavía no se ve el camino de aquí al **destino**. El wayfinding trata de encontrar ese camino, no de embestir contra el destino. Esta skill traza el camino como un **mapa compartido** en el issue tracker del repo, y luego trabaja sus **tickets de decisión** — preguntas cuya resolución es una decisión, no porciones de una construcción a ejecutar — de uno en uno hasta que la ruta está clara.

El destino varía en cada esfuerzo, y nombrarlo es el primer acto de trazado — le da forma a cada ticket. Puede ser una spec para entregar e iterar, una decisión que cerrar antes de que empiece la planificación, o un cambio hecho en el sitio como una migración de estructura de datos. El mapa es agnóstico al dominio — trabajo de ingeniería, contenido de un curso, lo que encaje con la forma.

## Planifica, no ejecutes

Wayfinder es **planificación** por defecto: cada ticket resuelve una decisión, y el mapa está terminado cuando el camino está claro — no queda nada que decidir antes de que alguien vaya y haga la cosa. La tentación de simplemente ponerse a hacer el trabajo suele ser la señal de que has llegado al borde del mapa y toca hacer el traspaso. Un esfuerzo puede anular esto en sus **Notas** — llevando la ejecución al propio mapa — pero, salvo eso, produce decisiones, no entregables.

## Refiérete por nombre

Todo mapa y todo ticket es un issue, así que tiene un **nombre** — su título. En todo lo que lee la persona — narración, Decisiones-hasta-ahora del mapa — refiérete a él por ese nombre, nunca por un id, número o slug pelado. Un muro de `#42, #43, #44` es ilegible; los nombres se leen de un vistazo. El id y la URL no desaparecen — un nombre envuelve su enlace — pero viajan *dentro* del nombre, nunca lo sustituyen.

## El Mapa

El mapa es un único issue en el issue tracker de este repo, etiquetado `wayfinder:map` — el artefacto canónico. Sus tickets son issues hijos del mapa.

El mapa es un **índice**, no un almacén. Lista las decisiones tomadas y apunta a los tickets que guardan su detalle; una decisión vive en exactamente un sitio — su ticket — así que el mapa nunca la reescribe, solo la resume y enlaza.

**Dónde viven físicamente el mapa, sus tickets hijos, el bloqueo y las consultas de frontera es específico del tracker.** El tracker de este repo es **GitHub Issues** (org `symplia-tech`), accedido con la CLI `gh`. Consulta la sección "Operaciones de wayfinding" más abajo para saber cómo _este_ repo las expresa. Si trabajas sin acceso a GitHub, recurre al tracker de markdown local (fallback, también descrito abajo).

### El cuerpo del mapa

El mapa entero en baja resolución, cargado una vez por sesión. Los tickets abiertos **no** se listan — son issues hijos abiertos, encontrados por consulta.

```markdown
## Destino

<cómo se ve llegar al final de este mapa — la spec, decisión o cambio hacia el que este esfuerzo encuentra su camino. Una o dos líneas; cada sesión se orienta hacia esto antes de elegir un ticket.>

## Notas

<dominio; skills que cada sesión debería consultar; preferencias permanentes de este esfuerzo>

## Decisiones hasta ahora

<!-- el índice — una línea por ticket cerrado: lo justo para juzgar relevancia, luego se hace zoom al enlace para el detalle que el ticket guarda -->

- [<título del ticket cerrado>](enlace) — <resumen de una línea de la respuesta>

## Aún sin especificar

<!-- ver "Niebla de guerra": niebla dentro del alcance que aún no puedes convertir en ticket; gradúa a medida que la frontera avanza -->

## Fuera de alcance

<!-- ver "Fuera de alcance": trabajo descartado más allá del destino; cerrado, nunca gradúa -->
```

### Tickets

Cada ticket es un **issue hijo** del mapa; el id del issue en el tracker es su identidad. Su cuerpo es la pregunta, dimensionada a una sesión de agente de 100K tokens:

```markdown
## Pregunta

<la decisión o investigación que este ticket resuelve>
```

Cada ticket lleva una etiqueta `wayfinder:<tipo>` — una de `research`, `prototype`, `grilling`, `task` (ver [Tipos de ticket](#tipos-de-ticket)).

Una sesión **reclama** un ticket asignándolo al dev que dirige el mapa, **primero**, antes de cualquier trabajo, para que las sesiones concurrentes lo salten. Ese asignado _es_ la reclamación: un ticket abierto y sin asignar está sin reclamar.

El bloqueo usa la relación de dependencia **nativa** del tracker — esencial porque renderiza la frontera _visualmente_ en la propia UI del tracker, para que la persona vea qué es tomable sin abrir el mapa. Solo un tracker que carezca de bloqueo nativo cae al convenio en el cuerpo. Un ticket está **desbloqueado** cuando todo ticket que lo bloquea está cerrado; la **frontera** son los hijos abiertos, desbloqueados y sin reclamar — el borde de lo conocido.

La respuesta no es parte del cuerpo — se registra al resolver (ver [Trabajar el mapa](#trabajar-el-mapa)). Los activos creados al resolver un ticket se enlazan desde el issue, no se pegan dentro.

## Tipos de ticket

Todo ticket es o bien **HITL** — human in the loop, trabajado *con* una persona que habla por sí misma — o **AFK**, conducido por el agente en solitario. Un ticket HITL solo se resuelve a través de ese intercambio en vivo; el agente nunca sustituye el lado humano (un agente de grilling que responde sus propias preguntas ha roto esto).

- **Research** (AFK): Leer documentación, APIs de terceros, o recursos locales como bases de conocimiento para sacar a la luz un hecho del que depende una decisión. Se resuelve con un **subagente** `/research`. Úsalo cuando se requiere conocimiento fuera del directorio de trabajo actual.
- **Prototype** (HITL): Subir la fidelidad de la discusión creando un artefacto concreto, barato y tosco al que reaccionar — un esquema, un boceto, un stub, o código de UI/lógica vía la skill `/prototype`. Enlaza el prototipo como activo. Úsalo cuando "cómo debería verse" o "cómo debería comportarse" es la pregunta clave.
- **Grilling** (HITL): Conversación vía las skills `/grilling` y `/domain-modeling`, una pregunta cada vez. El caso por defecto.
- **Task** (HITL o AFK): Trabajo manual que debe ocurrir antes de que una *decisión* pueda tomarse — nada que decidir, prototipar ni investigar, pero la discusión está bloqueada hasta que esté hecho. Darse de alta en un servicio para poder juzgar su API, provisionar accesos, mover datos para poder ver su forma. Este es el único tipo que *hace* en vez de decidir — y se gana su sitio por desbloquear una decisión, no por entregar el destino. El agente lo conduce en solitario donde puede (AFK); si no, entrega a la persona un checklist preciso (HITL). Se resuelve cuando el trabajo está hecho; la respuesta registra qué se hizo y cualquier hecho resultante (ubicación de credenciales, nuevas URLs, conteos de filas) del que dependan tickets posteriores.

## Niebla de guerra

El mapa está _deliberadamente_ incompleto: no traces lo que aún no puedes ver. Más allá de los tickets vivos está la **niebla de guerra** — la vista tenue de decisiones e investigaciones que intuyes que vienen pero aún no puedes fijar, porque penden de preguntas todavía abiertas. Resolver un ticket despeja la niebla que tiene delante, graduando lo que ahora es especificable en tickets frescos — de uno en uno, hasta que el camino al destino está claro y no quedan tickets.

La sección **Aún sin especificar** del mapa es donde se escribe esa vista tenue: la pregunta sospechada, el área a revisitar más tarde. Es la frontera aún no descubierta _hacia_ el destino — todo lo de aquí está dentro de alcance, solo que no lo bastante nítido para ticketizar. Escribe tan flojo o tan completo como la vista permita; sirve además de señal para los colaboradores que leen hacia dónde se dirige el esfuerzo.

**¿Niebla o ticket?** La prueba es si puedes enunciar la pregunta con precisión ahora — _no_ si puedes responderla ahora.

- **Ticket cuando** la pregunta ya es nítida — aunque esté bloqueada y aún no puedas actuar sobre ella.
- **Aún sin especificar cuando** todavía no puedes formularla con esa nitidez. No pre-cortes la niebla en piezas del tamaño de un ticket: es más gruesa que un ticket, y un parche puede graduar en varios tickets, o en ninguno, cuando la frontera lo alcance.

**Aún sin especificar** excluye lo ya decidido (Decisiones hasta ahora), lo que ya es un ticket vivo, y lo que está fuera de alcance (la sección siguiente).

## Fuera de alcance

La niebla solo se acumula _hacia_ el destino. El destino fija el alcance, así que el trabajo más allá de él está **fuera de alcance** — no es niebla, y no pertenece a **Aún sin especificar**. Tiene su propia sección **Fuera de alcance** en el mapa: trabajo que has descartado conscientemente de _este_ esfuerzo. El alcance, no la nitidez, lo lleva aquí.

El trabajo fuera de alcance nunca gradúa — la frontera se detiene en el destino — así que solo vuelve si el destino se redibuja, y entonces como un esfuerzo fresco, no una reanudación.

Descartar algo por alcance es un acto de scoping, no un paso en la ruta. Cuando un ticket que ya existe resulta estar más allá del destino — mal encajado al trazar, o expuesto por una resolución — **ciérralo** (un ticket cerrado está inequívocamente fuera de la frontera) y deja una línea en la sección **Fuera de alcance**: el resumen más por qué está fuera de alcance, enlazando el ticket cerrado. Se queda fuera de **Decisiones hasta ahora**, que registra la ruta realmente recorrida — un límite de alcance no es un paso en ella.

## Invocación

Dos modos. En cualquiera de los dos, **nunca resuelvas más de un ticket por sesión** — con la excepción de los tickets de research.

### Trazar el mapa

La persona invoca con una idea difusa.

1. **Nombra el destino.** Corre una sesión de `/grilling` y `/domain-modeling` para fijar hacia qué encuentra su camino este mapa — la spec, decisión o cambio. El destino fija el alcance, así que se establece primero.
2. **Mapea la frontera.** Vuelve a interrogar, esta vez **en anchura**: despliégate por todo el espacio en lugar de profundizar en un solo hilo, sacando a la luz las decisiones abiertas y los primeros pasos tomables ahora. **Si esto no saca niebla** — el camino al destino ya está claro, el viaje entero es lo bastante pequeño para una sesión — no necesitas un mapa. Para y pregunta a la persona cómo quiere proceder.
3. **Crea el mapa** (etiqueta `wayfinder:map`): Destino y Notas rellenos, Decisiones-hasta-ahora vacío, la niebla esbozada en **Aún sin especificar**.
4. **Crea los tickets que puedas especificar ahora** como issues hijos del mapa — luego cablea las aristas de bloqueo en una **segunda pasada** (los issues necesitan ids antes de poder referenciarse). El cableado los ordena en la frontera y en los bloqueados; todo lo que aún no puedes especificar se queda en la niebla — la sección **Aún sin especificar**.
5. **Dispara los subagentes de research.** Por cada ticket `research` que acabas de crear, levanta un subagente `/research` para resolverlo en paralelo, capturando sus hallazgos en una rama desechable `research/<nombre>` con un puntero de contexto desde el ticket.
6. Para — trazar es el trabajo de una sesión; no resuelve ningún ticket a mano.

### Trabajar el mapa

La persona invoca con un mapa (URL o número). Un ticket es **opcional** — sin él, tú eliges la siguiente decisión, no la persona.

1. Carga el **mapa** — la vista de baja resolución, no cada cuerpo de ticket.
2. Elige el ticket. Si la persona nombró uno, úsalo. Si no, toma el primer ticket de la frontera en orden. **Reclámalo**: asígnatelo antes de cualquier trabajo.
3. Resuélvelo — **haz zoom según haga falta**: trae el cuerpo completo de cualquier ticket relacionado o cerrado bajo demanda; invoca las skills que nombra el bloque `## Notas`. En caso de duda, usa `/grilling` y `/domain-modeling`.
4. Registra la resolución: publica la respuesta como un **comentario de resolución**, **cierra** el issue, y **añade un puntero de contexto** a las Decisiones-hasta-ahora del mapa.
5. Añade los tickets recién surgidos (crear-luego-cablear); gradúa cualquier niebla que la respuesta haya hecho especificable, limpiando cada parche graduado de **Aún sin especificar** para que viva solo como su nuevo ticket. Si la respuesta revela que un ticket — este u otro — está más allá del destino, **descártalo por alcance** en vez de resolverlo en la ruta. Si la decisión invalida otras partes del mapa, actualiza o borra esos tickets.

La persona puede correr tickets desbloqueados en paralelo, así que espera que otras sesiones editen el tracker de forma concurrente.

## Operaciones de wayfinding (GitHub Issues vía `gh`)

Mapeo concreto de cada operación abstracta al tracker de este repo. GitHub Issues soporta sub-issues nativos y relaciones de dependencia ("blocked by").

| Operación | Cómo | Comando de referencia |
|---|---|---|
| Crear el mapa | Issue con etiqueta `wayfinder:map` | `gh issue create --title "<nombre>" --label wayfinder:map --body "<cuerpo>"` |
| Crear un ticket | Issue hijo del mapa con `wayfinder:<tipo>` | `gh issue create --title "<pregunta>" --label wayfinder:grilling` y enlazarlo como sub-issue del mapa |
| Etiquetas de tipo | `wayfinder:research` · `wayfinder:prototype` · `wayfinder:grilling` · `wayfinder:task` | Crear las etiquetas una vez con `gh label create` |
| Reclamar un ticket | Autoasignarse el issue | `gh issue edit <n> --add-assignee @me` |
| Bloqueo | Relación nativa "blocked by" entre issues (sub-issues/dependencias); fallback: línea `Blocked by: #<n>` en el cuerpo | UI de GitHub o API GraphQL |
| Consultar frontera | Issues hijos abiertos, sin asignar y desbloqueados | `gh issue list --label wayfinder:grilling --state open --assignee ""` (filtra bloqueados a mano) |
| Registrar resolución | Comentario + cerrar | `gh issue comment <n> --body "<respuesta>"` y `gh issue close <n>` |

Si no hay acceso a GitHub Issues, usa el **fallback de markdown local**: un único fichero `wayfinder-map.md` como mapa, y un fichero por ticket bajo `.wayfinder/tickets/<id>-<slug>.md`; el bloqueo se expresa con una línea `Bloqueado por: <id>` en el cuerpo del ticket, y la frontera se calcula leyendo los tickets abiertos cuyos bloqueadores están todos cerrados.
