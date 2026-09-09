---
name: writing-for-agents
description: "Write documents that an agent will consume. Use when creating or editing skills, or when modifying AGENTS.md or CLAUDE.md."
tags: ["writing", "documentation", "agents"]
profiles: [core, ui, full]
---

Referencia para escribir cualquier documento que consume un agente: una skill, un `AGENTS.md` / `CLAUDE.md`, un documento al que se llega por un puntero. El empaquetado cambia; la escritura no: las mismas palancas hacen predecible cada uno, porque el agente sigue el mismo *proceso* en cada ejecución en lugar de producir el mismo resultado.

Cuando el documento que escribes es una skill, lee [`SKILL-MECHANICS.md`](SKILL-MECHANICS.md) para frontmatter, elección de invocación y skills router.

## Punteros de contexto

Un **puntero de contexto** es una referencia que vive en el contexto del agente, que nombra cierto material fuera de contexto y codifica la condición para llegar a él. La `description` de una skill es uno; una línea en `AGENTS.md` que nombra un documento es el mismo objeto. La *redacción* del puntero, no su destino, decide cuándo el agente llega al material, y con qué fiabilidad. Un objetivo imprescindible detrás de un puntero mal redactado es un bug de varianza: afila primero la redacción, y solo pon el material en línea si afilarla falla.

Un puntero hace dos trabajos: decir qué es el material, y listar las **ramas** que deberían disparar llegar a él (una rama es un caso distinto que cubre el documento, de modo que ejecuciones distintas toman caminos distintos por él). Cada palabra de un puntero siempre cargado cuesta en cada turno, así que merece una poda aún más dura que el cuerpo:

- **Antepón la palabra clave**: el puntero es donde hace su trabajo de disparo.
- **Un disparador por rama.** Sinónimos que renombran una sola rama son una rama escrita dos veces; colápsalos y conserva solo las ramas genuinamente distintas.
- **Recorta la identidad que el cuerpo ya lleva.**

## Las dos cargas

Cada documento y puntero que añades gasta uno de dos presupuestos:

- La **carga de contexto** es el coste del material siempre cargado en la ventana del agente: una línea de `AGENTS.md`, la `description` de una skill, cualquier cosa que está en contexto cada turno, gastando tokens y atención se dispare o no.
- La **carga cognitiva** es el coste sobre el humano: qué documentos existen y cuándo recurrir a cada uno. El humano es el índice. No es un coste a minimizar: es el precio de la autonomía humana; gástalo donde el juicio humano importa, quítalo donde no.

El material al que solo se llega por un puntero escapa de la carga de contexto al precio de la línea del propio puntero; el material sin ningún puntero recae por completo en la carga cognitiva.

## Jerarquía de la información

Un documento se construye con dos tipos de contenido: **pasos** (las acciones ordenadas que ejecuta el agente) y **referencia** (definiciones, reglas, hechos consultados bajo demanda). Los dos se mezclan libremente: todo pasos (una receta), toda referencia (las reglas de una revisión, esta skill), o ambos. La decisión central es dónde se sitúa cada pieza en la **jerarquía de la información**, una escalera ordenada por cuán inmediatamente necesita el agente el material:

1. **Paso en el fichero** es el nivel primario: lo que hace el agente, en orden.
2. **Referencia en el fichero** se consulta bajo demanda. A menudo un conjunto plano legítimo (cada regla de una revisión en el mismo peldaño), lo cual es un arreglo válido, no un olor.
3. **Referencia divulgada** se empuja a un fichero aparte, al que se llega por un puntero de contexto, cargado solo cuando el puntero se dispara. Va desde un fichero hermano en la misma carpeta hasta referencia totalmente externa que vive en cualquier sitio y a la que cualquier documento puede apuntar.

Empujar demasiado poco hincha la parte de arriba; empujar demasiado esconde material que el agente realmente necesita. Esa tensión es toda la decisión.

**Divulgación progresiva** es el movimiento escalera abajo (fuera del fichero principal y detrás de un puntero) para que la cima siga siendo legible. No es principalmente una optimización de tokens: es cómo se protege la jerarquía. Ramificar es la prueba de divulgación más limpia: pon en línea lo que toda rama necesita, y empuja detrás de un puntero lo que solo alcanzan algunas ramas. Cuando un documento tiene pasos, la referencia en el fichero que debería divulgarse los entierra y convierte el atenderlos en una moneda al aire: una palanca de varianza, no solo de legibilidad.

**Colocación conjunta** es la compañera dentro del fichero: donde la escalera decide *cuán abajo* se sitúa una pieza, la colocación conjunta decide *qué va junto a ella* una vez allí. Mantén la definición, las reglas y las salvedades de un concepto bajo un mismo encabezado en lugar de dispersas, para que leer una parte traiga consigo a sus vecinas. La prueba: el documento debería leerse como documentación escrita para el agente. El material agrupado se lee así; el disperso no. (Distinto de la duplicación: esa repite un mismo significado en dos sitios; la dispersión fragmenta un significado en muchos.)

**Desbordamiento** es el modo de fallo aquí: un documento sencillamente demasiado largo, incluso cuando cada línea está viva y es única. La atención se diluye a través del exceso, y cada línea de más es una más que mantener relevante. La cura es la escalera: divulga la referencia detrás de punteros, y divide por rama o secuencia para que cada camino cargue solo con lo que necesita.

## Pasos y criterios de finalización

Cada paso termina en un **criterio de finalización**, la condición que le dice al agente que el trabajo está hecho. Dos propiedades lo convierten en palanca:

- **Claridad**: ¿puede el agente distinguir hecho de no-hecho? Un límite vago ("comprensión alcanzada") invita a la **finalización prematura**: terminar el paso antes de que esté genuinamente hecho, la atención resbalando hacia *estar terminado*. Los pasos posteriores visibles todavía por delante (los **pasos post-finalización**) aportan el tirón; la claridad del criterio es la resistencia. Defiéndete en orden: **afila primero el límite** (local y barato); solo si es irreduciblemente difuso *y* observas la prisa, oculta los pasos posteriores partiendo la secuencia. Ocultar solo funciona a través de una frontera de contexto real (un traspaso o el despacho a un subagente; una llamada en línea deja los pasos posteriores en contexto y no despeja nada).
- **Exigencia**: cuánto requiere. "Cada modelo modificado tenido en cuenta" fuerza un trabajo minucioso donde "produce una lista de cambios" no lo hace. La exigencia impulsa el **trabajo de fondo** (la indagación que hace el agente dentro del trabajo, latente en la redacción en lugar de escrita como paso propio), y no está atada a los pasos: "cada regla aplicada" ata un cuerpo de referencia plana igual que "cada paso hecho" ata una secuencia, que es cómo un documento todo-referencia igualmente lleva una barra de exhaustividad.

Los criterios más fuertes son a la vez comprobables y exhaustivos.

## Cuándo dividir

Dividir un documento en dos gasta una de las dos cargas, así que divide solo cuando el corte lo merezca:

- **Por secuencia**: divide una tirada de pasos donde los pasos post-finalización tientan al agente a apresurar el que tiene delante. Mantenerlos fuera de la vista impulsa más trabajo de fondo en la tarea actual. Cuidado con lo contrario: fusionar secuencias expone los pasos posteriores de cada paso a lo que sigue, invitando a la finalización prematura.
- **Por invocación**, específico de skills: ver [`SKILL-MECHANICS.md`](SKILL-MECHANICS.md).

## Palabras clave

Una **palabra clave** es un concepto compacto que ya vive en el preentrenamiento del modelo, con el que el agente piensa mientras ejecuta el documento (*lección*, *niebla de guerra*, *balas trazadoras*). Repetida como token, nunca como frase, acumula una definición distribuida y ancla toda una región de comportamiento en el mínimo de tokens, al reclutar prioris que el modelo ya tiene. Acuñar una propia funciona si la defines con claridad, pero una palabra inventada no recluta ningún prior: pagas en tokens de definición lo que una palabra preentrenada da gratis; recurre primero a una palabra ya existente.

Ancla dos veces. En el cuerpo, *ejecución*: el agente recurre al mismo comportamiento cada vez que aparece la palabra, y dentro de la referencia plana enfoca la atención en una clase de cosa a buscar. En un puntero, *invocación*: cuando la misma palabra vive en tus prompts, tus documentos y tu código, el agente enlaza ese lenguaje compartido con el material y lo alcanza con más fiabilidad.

Busca oportunidades para refactorizar con palabras clave. Una tríada deletreada en tres sitios, un puntero que gasta una frase en señalar una idea. Cada una es un pasaje que pide colapsar en un solo token:

- "rápido, determinista, con poco overhead" → *ajustado* (un bucle *ajustado*).
- "un bucle en el que confías" → *en verde*, convirtiendo una puerta difusa en un estado observable binario (el bucle se pone *en verde* con el bug, o no).

Ganas dos veces: menos tokens, y un gancho más afilado para que el agente cuelgue su razonamiento. Asume que todo documento lleva reformulaciones que las palabras clave jubilan. Ve a buscarlas.

La **negación** es el modo de fallo junto a esta palanca: dirigir por prohibición arrastra el comportamiento prohibido al contexto y lo hace *más* disponible, no menos. *No pienses en un elefante*, y el elefante es todo lo que hay; la negación es un modificador débil que el concepto fuertemente activado desborda, así que la prohibición casi se lee como una instrucción de hacer la cosa. Enuncia lo **positivo**: declara el comportamiento objetivo ("escribe comentarios de una línea") para que el prohibido nunca se pronuncie. Una prohibición se gana su lugar solo como barrera dura que no puedes expresar en positivo; aun así, empareja con el objetivo positivo para que la atención caiga en qué hacer.

## Poda

- Mantén cada significado en una **única fuente de verdad**: un lugar autoritativo, para que cambiar el comportamiento sea una edición en un solo sitio. La **duplicación** (el mismo significado en más de un lugar) cuesta mantenimiento y tokens, e infla la prominencia de un significado en la escalera por encima de su rango real. (El inverso accidental de una palabra clave, que repite un token a propósito, nunca el significado.)
- El **entorno** también es una fuente de verdad (scripts de `package.json`, ficheros de configuración, la estructura de directorios, la salida de `--help`), y un documento que lo repite es una **caché**: una copia de una consulta, que se gana su carga solo cuando la consulta es cara. Cachea lo que el agente no puede encontrar mirando: la convención no escrita, la razón detrás de una elección, la trampa que ninguna configuración confiesa. Deja las consultas de un fichero y un comando a el entorno, donde no pueden quedarse obsoletas.
- Comprueba cada línea por **relevancia**: ¿sigue teniendo que ver con lo que hace el documento? Una línea pierde relevancia por no incidir nunca en la tarea (mera exposición, o una rama que debería divulgarse) o por quedar obsoleta a medida que cambia el comportamiento o el mundo que describe. Los documentos más cortos son más fáciles de mantener relevantes. Sin una disciplina de poda el destino por defecto es el **sedimento**: capas obsoletas que se asientan porque añadir se siente seguro y quitar se siente arriesgado, hasta que hay que perforar hacia abajo por ellas para encontrar lo que sigue vivo.
- Caza los **no-ops** frase por frase: una instrucción que el modelo ya obedece por defecto paga carga para no decir nada. La prueba (¿cambia el comportamiento frente al defecto?) es relativa al modelo, no al lector: dos personas en desacuerdo sobre si algo es un no-op están en desacuerdo sobre el defecto, y se resuelve ejecutando el documento, no debatiendo. Cuando una frase falla la prueba, borra la frase entera en lugar de recortarle palabras. La prueba también califica a las palabras clave: una palabra demasiado débil para superar el defecto (*sé minucioso* cuando el agente ya es medio minucioso) es un no-op, y el arreglo es una palabra más fuerte (*implacable*), no una técnica distinta.
