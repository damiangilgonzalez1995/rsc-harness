# 9 · Otras

Cuatro skills que no encajan en el flujo porque resuelven otra cosa.

---

## `teach`

Explicación didáctica de un concepto, una parte del código o una decisión. Para cuando quieres
entender algo, no cambiarlo. Puede seguir un tema a lo largo de varias sesiones.

---

## `muscle-memory`

Gimnasio de katas de Python. Genera ejercicios cortos a partir de tu código reciente, lleva la
cuenta del progreso y te revisa las soluciones.

```
/muscle-memory   ponme ejercicios
/muscle-memory   revisa mi solución
/muscle-memory   cómo voy
```

**Gotcha conocido:** el validador es CPython, no Pyodide. `async` y `asyncio.run` rompen en el
navegador.

---

## `wait-what`

**Cuándo.** El último mensaje no ha calado. Te has perdido, o la respuesta va por un sitio que no
reconoces.

**Qué hace.** Para y pide que se replantee: con contexto, en frases cortas de una idea cada una, y
con el vocabulario del proyecto.

Es un freno de mano. No lleva argumentos.

```
/wait-what
```

**Por qué existe.** Es más barato cortar en cuanto se pierde el hilo que dejar que la conversación
siga tres mensajes construyendo sobre un malentendido.

---

## `writing-for-agents`

Cómo escribir documentos que va a consumir un agente. Se usa al crear o editar una skill, o al
modificar `CLAUDE.md` o `AGENTS.md`.

Es la meta-skill: la que se usa para escribir las demás.

---

## `retro`

**Cuándo.** Después de una sesión larga o que se torció.

**Qué hace.** Lee la sesión (por defecto, la actual) y busca qué cambiar en el **entorno** del
agente para que la próxima salga mejor: punteros de navegación, comprobaciones automáticas que
faltan, reglas para el revisor, instrucciones que sobran en `CLAUDE.md`, herramientas que gastan
demasiados tokens. Te lo presenta ordenado por gravedad.

No aplica nada: tú decides qué se cambia. Así no entra en bucles de corregirse a sí misma.

```
/retro
```

---

## `sweep`

**Cuándo.** Cada pocas semanas, antes de una feature grande, o cuando el agente se pone a hacer
cosas que nadie le ha pedido. Suele ser porque está leyendo notas que ya no son verdad.

**Qué hace.** Lee los TODO y FIXME, los tickets de `.scratch/*/issues`, la wiki, las lecciones y
`CLAUDE.md`. Comprueba cada afirmación contra git (`git log`, `git blame`) y se la pasa a un
verificador con contexto limpio, que solo ve la afirmación y sus pruebas. Te entrega tres cajas:

| Caja | Qué pasa con ella |
|---|---|
| **Obsoleto** | Git demuestra que ya no es verdad. Se archiva si dices que sí. |
| **Conflicto** | Dos fuentes se contradicen. Tú decides cuál gana. |
| **Sin pruebas** | No hay nada concluyente, así que no se toca. |

Archivar es mover a `docs/archive/`, nunca borrar. Desde ese momento el hook `archive-guard`
impide que el agente lea esa carpeta, para que no vuelva a obedecer lo archivado. Tú puedes abrirla
cuando quieras. Si un proyecto no lo quiere, `.rsc/.no-archive-guard` lo apaga.

```
/sweep
```

**Quién manda, la spec o el código.** Los tickets de `to-tickets` llevan `status:`. Mientras están
`not_started` o `in_progress`, manda la spec; cuando pasan a `completed`, manda el código. Ante un
solapamiento o un conflicto, el agente para y pregunta.

**Volver al índice:** [README](README.md)
