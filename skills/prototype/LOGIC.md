# Prototipo de Lógica

Una mini-app de terminal interactiva que deja al usuario manejar un modelo de estados a mano. Úsala cuando la pregunta es sobre **lógica de negocio, transiciones de estado o forma de los datos** — ese tipo de cosa que parece razonable sobre el papel pero solo se siente mal cuando la empujas por casos reales.

## Cuándo esta es la forma correcta

- "No estoy seguro de si esta máquina de estados maneja el caso límite en que ocurre X y luego Y."
- "¿Este modelo de datos realmente me deja representar el caso en que...?"
- "Quiero tantear qué aspecto debería tener la API antes de escribirla."
- Cualquier cosa donde el usuario quiera **pulsar botones y ver cómo cambia el estado**.

Si la pregunta es "qué aspecto debería tener esto" — rama equivocada. Usa [UI.md](UI.md).

## Proceso

### 1. Enuncia la pregunta

Antes de escribir código, anota qué modelo de estados y qué pregunta estás prototipando. Un párrafo, en el README del prototipo o en un comentario al principio del archivo. Un prototipo de lógica que responde a la pregunta equivocada es puro desperdicio — haz la pregunta explícita para poder comprobarla más tarde, tanto si el usuario está mirando ahora como si vuelve a ello después.

### 2. Elige el lenguaje

Usa el que use el proyecto anfitrión. Si el proyecto no tiene un runtime obvio (p. ej. un repo de documentación), pregunta.

Sigue las convenciones de herramientas del proyecto — no añadas un gestor de paquetes o un runtime nuevo solo para el prototipo.

### 3. Aísla la lógica en un módulo portable

Pon la lógica de verdad — la parte que responde a la pregunta — detrás de una interfaz pequeña y pura que pueda extraerse y colocarse en el código real más tarde. La TUI que la rodea es desechable; el módulo de lógica no debería serlo.

La forma correcta depende de la pregunta:

- **Un reducer puro** — `(estado, acción) => estado`. Bueno cuando las acciones son eventos discretos y el estado es un único valor.
- **Una máquina de estados** — estados y transiciones explícitos. Bueno cuando "qué acciones son siquiera legales ahora mismo" forma parte de la pregunta.
- **Un pequeño conjunto de funciones puras** sobre un tipo de dato plano. Bueno cuando no hay un estado actual implícito — solo transformaciones.
- **Una clase o módulo con una superficie de métodos clara** cuando la lógica realmente es dueña de un estado interno continuo.

Elige la forma que mejor encaje con la pregunta que se hace, y *no* la que sea más fácil de conectar a una TUI. Mantenla pura: sin I/O, sin código de terminal, sin `console.log` para el flujo de control. La TUI la importa y la invoca; nada fluye en el otro sentido.

Esto es lo que hace útil al prototipo más allá de su propia vida: cuando la pregunta ha sido respondida, el reducer / máquina / conjunto de funciones validado puede extraerse al módulo real por sí solo.

### 4. Construye la TUI más pequeña que exponga el estado

Constrúyela como una **TUI ligera** — en cada tick, limpia la pantalla (`console.clear()` / `print("\033[2J\033[H")` / equivalente) y vuelve a renderizar el frame entero. El usuario debe ver siempre una vista estable, no un scrollback que crece sin parar.

Cada frame tiene dos partes, en este orden:

1. **Estado actual**, impreso de forma bonita y fácil de comparar (un campo por línea, o JSON formateado). Usa **negrita** para nombres de campo o encabezados de sección y **atenuado** para el contexto menos importante (timestamps, IDs, valores derivados). Los códigos de escape ANSI nativos valen — `\x1b[1m` negrita, `\x1b[2m` atenuado, `\x1b[0m` reset. No hace falta traer una librería de estilos salvo que ya haya una en el proyecto.
2. **Atajos de teclado**, listados abajo: `[a] añadir usuario  [d] borrar usuario  [t] avanzar reloj  [q] salir`. Pon la tecla en negrita y la descripción atenuada, o al revés — lo que se lea limpio.

Comportamiento:

1. **Inicializa el estado** — un único objeto/struct en memoria. Renderiza el primer frame al arrancar.
2. **Lee una pulsación (o una línea)** cada vez, despáchala a un handler que muta el estado.
3. **Vuelve a renderizar** el frame completo tras cada acción — no añadas, reemplaza.
4. **Bucle hasta salir.**

El frame entero debería caber en una pantalla.

### 5. Hazlo ejecutable con un solo comando

Añade un script al gestor de tareas existente del proyecto (`scripts` de `package.json`, `Makefile`, `justfile`, `pyproject.toml`). El usuario debería ejecutar `pnpm run <nombre-prototipo>` o equivalente — nunca tener que recordar una ruta.

Si el proyecto anfitrión no tiene gestor de tareas, pon el comando al principio del README del prototipo.

### 6. Entrégalo

Dale al usuario el comando para ejecutarlo. Él lo manejará; los momentos interesantes son cuando dice "espera, eso no debería ser posible" o "anda, yo asumía que X sería distinto" — esos son los bugs de la _idea_, que es de lo que va todo esto. Si quiere que se añadan acciones nuevas, añádelas. Los prototipos evolucionan.

### 7. Captura la respuesta y el prototipo

Una vez el prototipo ha respondido a su pregunta, captura la respuesta y luego captura el prototipo como describe la [SKILL](SKILL.md). El mapeo específico de lógica: el reducer / máquina / conjunto de funciones validado se extrae al módulo real (la decisión, absorbida); la carcasa de la TUI acompaña a la rama desechable que conserva el prototipo como fuente primaria.

## Antipatrones

- **No añadas tests.** Un prototipo que necesita tests ya no es un prototipo.
- **No lo conectes a la base de datos real.** Usa un almacén en memoria salvo que la pregunta sea específicamente sobre persistencia.
- **No generalices.** Nada de "¿y si más adelante quisiéramos soportar X?". El prototipo responde a una pregunta.
- **No mezcles la lógica y la TUI.** Si el reducer / máquina de estados referencia `console.log`, prompts o códigos de escape de terminal, ya no es portable. Mantén la TUI como una carcasa fina sobre un módulo puro.
- **No lleves la carcasa de la TUI a producción.** La carcasa está optimizada para manejarse a mano desde una terminal. El módulo de lógica que hay detrás es lo que vale la pena conservar.
