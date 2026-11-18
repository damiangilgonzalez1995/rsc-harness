# Banco de preguntas

Lo que hay que resolver antes de construir, agrupado por zona y en el orden en que suele hacer falta. Recórrelo entero en el paso 4 de [`start.md`](start.md), sin esperar a que el usuario lo pregunte. Adapta cada pregunta al proyecto; la que no aplique se marca «no aplica» con el motivo.

Cada pregunta lleva un `id` estable: es el `id` de su entrada en `questions[]` de `overview.json`, y el encabezado del grupo es su `zone`. Las preguntas propias del proyecto se añaden con un `id` nuevo en el grupo que toque.

Cada una indica cómo se resuelve:

- **[comprobar]:** lo ejecutas tú, siguiendo el paso 2 de [`start.md`](start.md).
- **[fuentes]:** se busca en los documentos, citando dónde lo dice.
- **[usuario]:** es una decisión suya; llévala con tu recomendación.
- **[tercero]:** va al mensaje único para el interlocutor del proyecto.
- **[defecto]:** lo decides tú, y lo dejas anotado.

Lo marcado con **«Bloquea»** se avisa en la primera entrega, aunque nadie haya preguntado.

## `problem` — Entender el problema

Antes de hablar de tecnología, el usuario tiene que poder explicarlo con sus palabras.

- `who-is-who` ¿Quién es quién? Empresas, personas, sistemas y siglas, con una línea para cada uno. Ningún nombre propio queda sin explicar. [fuentes]
- `which-project` ¿Cuántos proyectos hay aquí y a cuál nos referimos? ¿Cómo lo llamamos? [fuentes, usuario]
- `today` ¿Cómo se hace hoy, sin nosotros, y qué parte duele? Con cifras de tiempo y coste si constan. [fuentes]
- `what-changes` ¿Qué cambia para quien lo usa? Cuéntalo con pantallas de ejemplo, no con piezas técnicas. [fuentes]
- `deliverable` **Bloquea: ¿qué espera recibir exactamente el cliente?** Aplicación, web, informe o carga en su sistema. ¿Dónde consta? [fuentes, tercero]
- `sources-agree` ¿Dicen todos los documentos lo mismo sobre lo que se entrega? Cada discrepancia se anota con las dos fuentes. [fuentes]
- `phase` ¿Qué fase es: prototipo, piloto o producción? ¿Qué fecha es inamovible? ¿Las fechas del cliente condicionan el trabajo? [fuentes, usuario]
- `scope` ¿Qué entra ahora y qué queda como ampliación? [usuario]
- `acceptance` ¿Quién da el trabajo por bueno, y con qué criterio? [fuentes, tercero]

**Hecho cuando:** el usuario confirma el flujo con sus palabras.

## `data-access` — Datos y accesos

Se resuelve **antes** de preguntar nada más. El usuario no quiere pelearse con esto. Por cada fuente de datos:

- `data-exists` **Bloquea: ¿existe y dónde está?** ¿Quién es su dueño? [fuentes, comprobar]
- `data-access-path` **Bloquea: ¿cómo se accede?** API, base de datos, túnel, VPN, fichero. ¿Por qué canal y quién da el acceso? [fuentes, comprobar]
- `data-credentials` **Bloquea: ¿tenemos ya las credenciales?** Si no, ¿quién las da? [comprobar, tercero]
- `data-access-today` **Bloquea: ¿entramos de verdad hoy?** Conexión y consulta mínima, en solo lectura. [comprobar]
- `data-permissions` ¿Hay permiso de lectura y de escritura? ¿Se puede escribir en el sistema del cliente o solo leer? ¿Se puede entrar desde cualquier IP? [comprobar, fuentes]
- `data-schema-docs` ¿Hay documentación del esquema o de la API? ¿Es accesible, y explica qué significa cada campo? [comprobar]
- `data-test-env` ¿Hay entorno de pruebas, o solo producción? [comprobar, tercero]
- `data-matches-docs` ¿Coinciden los datos con lo que dicen los documentos? Repite un par de cifras. [comprobar]
- `data-quality` ¿Volumen y calidad? Filas, campos vacíos, duplicados, formatos raros. [comprobar]
- `data-units` ¿En qué unidades vienen las cantidades, y coinciden con las del sistema de origen? ¿Hay que convertir? [comprobar, tercero]
- `data-exclusions` ¿Qué datos no se deben contar o mostrar? [fuentes, tercero]
- `data-personal` ¿Hay datos personales o confidenciales? Quedan fuera de git. [comprobar, fuentes]
- `data-sources-conflict` ¿Las fuentes del cliente se contradicen entre sí? ¿Quién lo resuelve? [fuentes, tercero]
- `credentials-storage` ¿Dónde se guardan las credenciales? En un `.env` ignorado por git, comprobado. [defecto]

**Entrega:** la tabla de accesos del paso 2 de [`start.md`](start.md), con lo que falta como pregunta.

## `accounts` — Cuentas y servicios

Por cada pieza (base de datos, autenticación, modelos, servidor, dominio): ¿existe ya?, ¿quién la crea?, ¿a nombre de quién?, ¿quién la paga?

- `accounts-exist` ¿Hay ya cuentas y claves? Compruébalo; una ausencia también es un resultado. [comprobar]
- `accounts-owner` **Bloquea, si impide trabajar en local:** ¿quién crea lo que falta, a nombre de quién y quién lo paga? [tercero]
- `local-first` ¿Se puede arrancar todo en local sin esperar a nadie? [defecto]

## `users` — Usuarios, login y sesiones

- `profiles` **Bloquea: ¿qué perfiles hay y qué hace cada uno?** ¿En qué momento se cruzan? [fuentes, tercero]
- `multitenant` **¿Es multitenant?** ¿Lo usarán varias empresas a la vez, cada una con sus datos aislados, o es para una sola? Si lo es: cómo se separa cada empresa (columna en cada tabla, esquema o base distinta), quién da de alta una empresa nueva y qué se comparte entre todas. Decidirlo tarde obliga a rehacer tablas, permisos y login. [usuario]
- `devices` ¿Qué dispositivo usa cada perfil? ¿Un usuario por móvil o móviles compartidos? [fuentes, usuario]
- `visibility` ¿Qué ve y qué no ve cada perfil? [fuentes, usuario]
- `auth-owner` **¿Quién se ocupa de la autenticación?** ¿Quién da de alta y de baja? ¿Registro abierto o lista cerrada? [usuario]
- `login-method` ¿Cómo entra cada perfil: correo y contraseña, PIN, enlace, SSO? [usuario, tercero]
- `session` ¿Dónde se guarda la sesión, qué la protege y cuándo caduca? ¿Cómo sale uno de la sesión? [usuario, defecto]
- `edit-others` ¿Puede un usuario cambiar lo de otro? ¿Quién puede sustituir qué? [usuario]
- `own-history` ¿Qué consulta cada uno de lo que ya ha hecho? Historial y listados propios. [usuario]
- `usage-limits` ¿Cuánto puede gastar o usar una persona? Límites por minuto y por mes. [usuario]

## `flow` — Flujo completo

Dibújalo por perfil y de principio a fin antes de pedir decisiones (el mapa opcional de [`map.md`](map.md)).

- `flow-steps` ¿Qué pasos hay, y cómo pasa el trabajo de un perfil a otro? [fuentes]
- `flow-real-world` **Bloquea: en cada paso, ¿qué tiene que existir ya en el mundo real?** Etiquetas, QR, dispositivos, ficheros, personas. ¿Existe hoy, quién lo pone y para cuándo? Si un documento lo da por hecho, no lo des por confirmado. [tercero]
- `flow-fallback` ¿Qué se hace si eso no llega a tiempo? [defecto]
- `flow-screens` ¿Qué ve el usuario en cada paso, incluido cuando algo falla? [usuario]
- `flow-corrections` ¿Qué puede corregir o deshacer el usuario, y hasta cuándo? ¿Lo que escribió, lo que le propuso el sistema, lo ya confirmado? [usuario]
- `flow-reopen` ¿Un cambio sobre algo ya hecho reabre el trabajo o crea otro? [usuario]
- `flow-duplicates` ¿Qué pasa si registra dos veces lo mismo, o si dos personas hacen lo mismo a la vez? ¿Quién decide y qué se avisa? [usuario]
- `flow-lookalikes` ¿Cómo se distinguen en la realidad dos elementos casi iguales? ¿Lo reflejan los datos? [comprobar, tercero]
- `flow-later` ¿Hay algo que el sistema deba poder hacer pero solo más adelante? Queda anotado como ampliación. [usuario]
- `domain-terms` ¿Qué palabras usa la gente del oficio? ¿Se llaman igual en pantalla y en código? [fuentes, usuario]

## `jobs` — Trabajos y seguimiento

- `async` ¿Qué tarda lo bastante para ser asíncrono? ¿Cómo ve el avance el usuario? [usuario]
- `job-states` ¿Qué estados tiene cada trabajo? ¿Se puede avanzar, retroceder o reintentar? [usuario]
- `audit-trail` ¿Qué se registra de cada trabajo? Quién, cuándo, cada cambio de estado y resultado. Por defecto, todo. [defecto]
- `soft-delete` ¿Se borra algo, o se marca como anulado? Por defecto, no se borra. [defecto]
- `interruptions` ¿Qué pasa si se corta la conexión, se reinicia el servidor o el usuario sale a mitad y vuelve? [defecto]
- `interaction` ¿Es una conversación, un formulario o un panel? ¿Por qué? [usuario]

## `conversation` — Conversación e historial

Solo si hay chat o un asistente.

- `history-load` ¿Cómo se carga una conversación previa: todas o por partes, cuáles, y qué pasa al volver a una a medias? [usuario]
- `history-storage` ¿La conversación se guarda entera? ¿Dónde y en cuántas tablas? [usuario]
- `context-window` ¿Qué ve la IA en cada vuelta: todo el historial o una ventana? [usuario]
- `mixed-message` ¿Un mensaje con dos cosas a la vez se acepta o se pide por separado? [usuario]
- `dictation` ¿Se puede escribir lo que se dicta? [usuario]

## `output` — Salida

- `output-recipient` **¿Qué sale del sistema, y quién lo recibe?** ¿Qué hace esa persona con ello? [fuentes, tercero]
- `output-channel` ¿El resultado se carga a mano o se escribe en otro sistema? ¿Por qué vía y quién lo carga? [fuentes, comprobar]
- `output-format` ¿Las columnas o el formato lo imponen otros? Si no, lo decidimos nosotros. [defecto]

## `stack` — Tecnología

Solo cuando lo anterior está claro.

- `parts` ¿Qué partes hay? Frontend, backend, base de datos, trabajos en segundo plano. ¿Hace falta cada una? [usuario]
- `stack-version` ¿Qué stack se usa y qué versión? Una estable y probada, nunca la recién salida. [usuario]
- `queue` ¿Hace falta cola? ¿Basta con la base de datos? [usuario]
- `reuse` ¿Qué se reutiliza de lo que ya existe? [comprobar]
- `deploy` Se empieza en local. El despliegue solo se trata si el usuario lo pide o si hay una restricción que condicione el diseño. [usuario]

## `frontend` — Interfaz

- `design-first` ¿Se diseña antes de montar? ¿Con qué herramienta? ¿Hay prototipos desechables antes del diseño final? [usuario]
- `screens-device` ¿Qué pantalla se usa en móvil y cuál en ordenador? [fuentes, usuario]
- `components` ¿Qué componentes se repiten, y de qué librería salen o se hacen a mano? [usuario]
- `state` ¿Dónde vive cada dato de la pantalla: en el servidor, en la URL, en estado global o en estado local del componente? [usuario, defecto]
- `rendering` ¿Qué se renderiza en el servidor y qué en el cliente? Si hay render de servidor, ¿qué puede romper la hidratación (fechas, aleatorios, datos del navegador)? [usuario]
- `routes` ¿Qué rutas hay, cuáles están protegidas y a dónde va quien entra sin sesión? [usuario]
- `api-contract` ¿Cómo habla el front con la API: qué contrato, quién lo escribe y cómo se tipan las respuestas? [usuario, defecto]
- `refresh-mid-flow` ¿Qué pasa si el usuario recarga o pulsa «atrás» a mitad de un flujo? ¿Se pierde lo escrito, se retoma o se avisa? [usuario]
- `empty-error-loading` ¿Qué enseña cada pantalla cuando no hay datos, cuando falla y cuando tarda? [usuario]
- `ai-visibility` ¿Qué se enseña de lo que hace la IA mientras trabaja, y qué solo se guarda? [usuario]
- `bundle-secrets` ¿Qué variables llegan al navegador? Todo lo que va en el bundle es público. [comprobar, defecto]
- `user-settings` ¿Hay modo oscuro u otros ajustes? ¿Cuáles son de cada usuario y cuáles del negocio? ¿Dónde se ven el nombre y el rol de quien está dentro? [usuario]

## `ai` — IA

Solo si alguna parte usa modelos.

- `ai-needed` ¿Hace falta IA en esta parte? ¿Qué diseña el cliente y qué se delega? [usuario]
- `ai-accounts` ¿De quién son las cuentas y dónde se alojan? ¿Hay restricciones de región o de datos? [usuario, tercero]
- `ai-models` ¿Qué modelos se usan, quién los decide y dónde se configuran? La elección es del usuario: recomiéndalo solo si lo pide. [usuario]
- `ai-dataset` ¿Hay dataset de prueba? ¿Quién lo crea, dónde vive si tiene datos del cliente y puede ir a git? [usuario]
- `ai-evals` ¿Cómo se mide si la IA acierta? ¿Con qué casos, de los fáciles a los enrevesados, y con qué umbrales de bueno, dudoso y malo? [usuario]
- `ai-cost-latency` ¿Cuánto cuesta cada llamada y cuánto tarda? ¿Qué tope tiene? [comprobar, usuario]
- `ai-failure` ¿Qué pasa si la IA tarda, falla o se agota? ¿Qué le llega al usuario? [usuario]
- `ai-retrieval` ¿Cuándo se busca por texto, cuándo por significado y cuándo entra un agente? [usuario]
- `ai-data-policy` ¿Se pueden enviar datos reales al proveedor antes del contrato de tratamiento de datos? ¿El proveedor guarda lo que se le envía, y se le pide que no? [fuentes, tercero]
- `ai-tracing` ¿Cómo se traza cada llamada? [usuario]
- `ai-transcription` Si hay voz: ¿qué se transcribe, con qué, en qué idioma y con cuánto ruido? [usuario]

## `mobile` — Móvil real

Solo si se usa en el móvil o en el sitio de trabajo.

- `mobile-hardware` ¿Funcionan el micrófono, la cámara o lo que haga falta en un móvil real, Android e iPhone? [comprobar]
- `mobile-https` ¿Hace falta HTTPS para probar en la wifi o en el móvil? [comprobar]
- `mobile-conditions` ¿Cómo se prueban el ruido y la cobertura reales del sitio de trabajo? ¿Qué pasa con poca cobertura o sin ella? [usuario]
- `mobile-location` ¿Cómo se indica el lugar donde está la persona? [usuario]

## `database` — Base de datos

- `db-isolation` ¿Cómo se aísla lo de cada usuario o empresa: RLS, filtro en cada consulta o bases separadas? Depende de `multitenant`. [usuario]
- `db-migrations` ¿Cómo se cambian las tablas: migraciones versionadas en git, y quién las aplica en cada entorno? [defecto]
- `db-backups` ¿Hay copias de seguridad? ¿Cada cuánto, dónde y se ha probado a restaurar una? [comprobar, usuario]
- `db-retention` ¿Cuánto tiempo se guardan los datos personales? [fuentes, tercero]

## `tests` — Pruebas y entorno local

- `local-env` ¿Se trabaja en local? ¿Con qué base y qué versiones? [comprobar, defecto]
- `test-dataset` ¿Con qué se prueba? Un dataset con datos reales y un mínimo de casos de principio a fin. ¿Dónde vive, si tiene datos del cliente? [comprobar, defecto, usuario]
- `real-material` ¿Hace falta material real, como audios o documentos? ¿Quién lo consigue, y puede aportarlo el propio usuario? [usuario]
- `shared-db-tests` ¿Qué pruebas tocan una base compartida y la rehacen? ¿Quién lo sabe? [comprobar]
- `e2e` ¿Hay pruebas de punta a punta contra la pila real? ¿Quién las mantiene? [usuario]
- `flaky` ¿Qué pruebas fallan a ratos por tiempos y cómo se evitan? [comprobar]
- `ci-gate` ¿Qué mide la CI y quién puede bloquear una fusión? [usuario]

## `security` — Seguridad y legal

Solo lo que condicione el diseño; lo demás se anota para más adelante. Las comprobaciones concretas están en [`checks.md`](checks.md).

- `security-review` ¿Qué revisión de seguridad se hace y cuándo? Por defecto, los 10 puntos de [`checks.md`](checks.md) cada mes y antes de lanzar. [defecto]
- `contracts` ¿Hay contratos o restricciones que impidan usar un servicio? [fuentes, tercero]
- `public-docs` ¿Dónde se publica la documentación o la wiki, y qué datos de acceso no deben salir? [usuario]

## `organization` — Reparto y organización

- `fronts` ¿Cuántos frentes hay, y puede trabajar cada uno por separado? Normalmente, una terminal por frente. [usuario]
- `fakes` ¿Qué parte es incierta y se sustituye por una versión falsa para montar el esqueleto? [usuario]
- `contracts-between-fronts` ¿Qué fronteras hay entre frentes? Un contrato escrito por cada una. [defecto]
- `handoff-state` ¿Dónde quedan el estado actual y las decisiones, para que otro agente pueda retomarlo, y quién las confirma? [defecto]
- `file-size` ¿Cuál es el tamaño máximo de un fichero? ¿Código en clases o en funciones sueltas? [usuario]
- `tickets` ¿Cómo se parten los tickets: una spec, tickets pequeños y una PR por parte? ¿Se separan las PR de funciones nuevas y de reorganización? [usuario]
- `ask-vs-decide` ¿Qué se pregunta al cliente y qué se decide sin preguntar? [usuario]

## Antes de enviar una pregunta

**Prueba:** si no responden, ¿qué no puedo construir?

| Resultado | Qué haces |
|---|---|
| Algo concreto queda bloqueado | Se pregunta, y dices qué bloquea |
| Nada queda bloqueado | Decides un valor por defecto y lo anotas |
| Es una curiosidad o un dato llamativo | Va a `overview.json`, sin preguntar |
| Depende de las condiciones del lugar de trabajo y se resuelve al probar | Se aparca hasta la prueba |

Reglas del mensaje a un tercero:

- Uno solo, con 6 preguntas o menos, empezando por lo que bloquea.
- Sin discrepancias de cifras que no cambien lo que se construye.
- Lo que sobra se guarda como «aparcadas» y no se envía.

## Cómo explicarlo

- Empieza por lo que ve el usuario, antes de hablar de piezas técnicas.
- Usa solo términos ya explicados, y los nombres que usan las fuentes.
- Di quién ha hecho cada prueba y dónde.
- Distingue lo que has comprobado de lo que has deducido.
- Presenta como decidido solo lo que está **Decidido**.
