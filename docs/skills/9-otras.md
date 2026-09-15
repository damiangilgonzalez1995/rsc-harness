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

**Volver al índice:** [README](README.md)
