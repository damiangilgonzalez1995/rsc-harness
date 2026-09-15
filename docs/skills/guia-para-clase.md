# Guía de las skills de Claude — material para clase

> Documento base para preparar unas diapositivas.
> Público: personas NO técnicas. Objetivo: explicar para qué sirve cada skill y cómo se usan
> juntas, con palabras sencillas y muchos ejemplos.
>
> Cada apartado `##` está pensado como "una diapositiva o grupo de diapositivas".

---

## 1. Antes de empezar: ¿qué es una "skill"?

Una **skill** es una **receta de trabajo** que le damos a la inteligencia artificial (Claude). En
lugar de improvisar, Claude sigue unos pasos probados, igual que un cocinero sigue una receta o un
mecánico un manual.

- Sin skill: le pides algo y hace lo que buenamente entiende.
- Con skill: sigue un método ordenado, pensado por expertos, que da mejores resultados y más
  predecibles.

**En una frase:** una skill convierte a la IA de "ayudante que improvisa" en "profesional que
sigue un método".

---

## 2. La idea más importante: primero DECIDIR, luego CONSTRUIR

El error más común al hacer algo grande es ponerse a construir antes de tener claro **qué** se
quiere y **cómo** se va a hacer. Estas skills separan esas dos fases a propósito:

1. **Decidir**: despejar todas las dudas (qué queremos, cómo se llama cada cosa, qué herramienta
   usar, qué aspecto tendrá...).
2. **Construir**: solo cuando ya no queda nada que decidir, se pone uno a trabajar.

**Analogía:** construir una casa. Primero el arquitecto y los planos (decidir); solo después
llegan los albañiles (construir). Nadie levanta paredes sin planos.

---

## 3. Mapa rápido de las skills principales

| Skill | En una frase (sencilla) | Analogía cotidiana |
|---|---|---|
| **`/grill-with-docs`** | Te hace preguntas difíciles hasta que la idea está clara, y apunta cómo se llama cada cosa. | Un entrevistador exigente que toma notas. |
| **`/wayfinder`** | Planifica algo muy grande dividiéndolo en decisiones que se resuelven de una en una. | Organizar una boda: mil decisiones, se toman poco a poco. |
| **`/research`** | Busca información fiable sobre un tema mientras tú sigues con otra cosa. | Mandar a alguien a la biblioteca a buscar datos. |
| **`/to-spec`** | Coge todo lo hablado y lo pasa a limpio en un documento oficial. | El acta de una reunión. |
| **`/write-adr`** | Deja por escrito cada decisión importante y por qué se tomó. | El libro de actas de la comunidad de vecinos. |
| **`writing-plans`** | Convierte el documento en un plan de pasos pequeños, cada uno con su comprobación. | El plano de obra con el orden de los trabajos. |
| **`executing-plans`** | Construye el plan paso a paso, comprobando que cada paso funciona. | El obrero que ejecuta el plano. |
| **`/code-review`** | Revisa el trabajo terminado: ¿está bien hecho? ¿hace lo que se pedía? | Un corrector de exámenes. |

---

## 4. Las skills, una a una

### 4.1 `/grill-with-docs` — que la idea toque tierra

**En una frase:** antes de construir nada, te hace todas las preguntas incómodas hasta que tú y
Claude entendéis lo mismo, y va apuntando el vocabulario del proyecto.

**Analogía:** un entrevistador exigente. No te deja salir con "ya veremos": cada respuesta abre
la siguiente pregunta, y al final todo está claro.

**Cuándo se usa:** casi siempre, como primer paso. Es la opción por defecto.

**Ejemplo:** "Quiero añadir avisos a mi aplicación." → ¿Qué es un aviso: un email, un mensaje en
el móvil? ¿Quién los recibe? ¿Se pueden desactivar? Al terminar, está claro.

---

### 4.2 `/wayfinder` — planificar algo enorme (con niebla)

**En una frase:** cuando el trabajo es tan grande que no cabe en una sola sesión y encima no ves
el camino, wayfinder dibuja un **mapa** y va resolviendo las dudas una a una hasta que el camino
queda claro.

**La clave:** wayfinder **decide, no construye**. Su trabajo es despejar la niebla.

**Analogía:** un explorador que avanza por un bosque con niebla. No ve el final, pero cada paso
que da despeja un poco más el camino y le deja ver el siguiente.

**Cuándo se usa:** proyectos grandes y confusos, donde ni siquiera tienes claro por dónde empezar.
En lugar de `grill-with-docs`.

**Ejemplo:** "Quiero rehacer todo el sistema de avisos." Esconde muchas decisiones: ¿avisos por
email, por móvil, o los dos? ¿el usuario puede elegir cuáles recibir? ¿qué aspecto tiene la
pantalla de avisos? Wayfinder pone cada duda como una "tarjeta de decisión" y las va resolviendo
de una en una.

---

### 4.3 `/research` — investigar con fuentes fiables

**En una frase:** manda a un ayudante a investigar un tema en **fuentes de confianza**
(documentación oficial, no rumores) mientras tú sigues trabajando, y te trae un resumen con las
fuentes citadas.

**Analogía:** pedirle a un bibliotecario que te busque datos serios mientras tú avanzas con otra
cosa; luego vuelve con la ficha y te dice de dónde sacó cada dato.

**Cuándo se usa:** cuando una decisión depende de un dato que no sabes y hay que buscarlo bien
(no vale "me suena que...").

**Ejemplo:** antes de decidir "¿qué servicio usamos para enviar los avisos al móvil?", research
compara las opciones oficiales, mira precios y limitaciones, y te trae un resumen para que decidas
con datos en la mano.

---

### 4.4 `/to-spec` — pasar a limpio en un documento

**En una frase:** coge **todo lo que ya se ha hablado** y lo convierte en un documento claro que
explica qué se va a hacer y por qué. **No te vuelve a preguntar nada**: solo ordena y resume lo
decidido.

("Spec" es simplemente ese documento: el "documento oficial" de la tarea. Otra forma de escribirlo
es `brainstorming`, que lo va construyendo contigo sección a sección.)

**Analogía:** el **acta de una reunión**. Todos hablaron; alguien pone por escrito lo acordado
para que quede claro y nadie lo interprete a su manera.

**Ejemplo:** después de decidir cómo serán los avisos, to-spec escribe el documento: "el usuario
podrá activar o desactivar cada tipo de aviso desde su perfil", con la lista completa de lo que
debe hacer y lo que queda fuera.

---

### 4.5 `/write-adr` — apuntar las decisiones importantes

**En una frase:** cada vez que se toma una decisión que costaría mucho deshacer, la deja por
escrito con sus motivos y con las alternativas que se descartaron.

**Analogía:** el libro de actas de una comunidad de vecinos. Dentro de dos años alguien preguntará
"¿por qué pintamos la fachada de este color?", y la respuesta estará escrita.

**Ejemplo:** "Los avisos al móvil se envían con el servicio X y no con Y, porque Y no funciona en
iPhone antiguos."

---

### 4.6 `writing-plans` y `executing-plans` — construir con un plan

**En una frase:** `writing-plans` convierte el documento en **pasos pequeños**, cada uno con su
comprobación; `executing-plans` los construye de uno en uno, comprobando que cada paso funciona
antes de pasar al siguiente.

**Idea importante:** primero se escribe la **prueba** ("el aviso tiene que llegar") y después se
construye lo que la hace pasar. Así nunca se da por hecho algo que no funciona.

**Analogía:** el plano de obra con el orden de los trabajos. 1) cimientos, 2) paredes (necesita
el paso 1), 3) tejado (necesita el paso 2). Y el aparejador comprueba cada fase.

**La otra vía, para lo enorme:** si el trabajo vino de `wayfinder`, se trocea en tickets con
`/to-tickets` y se construye ticket a ticket con `/implement`.

---

### 4.7 `/code-review` — revisar antes de dar por terminado

**En una frase:** revisa el trabajo terminado con dos preguntas: **¿está bien hecho?** y **¿hace
lo que pedía el documento?**

**Analogía:** un corrector de exámenes que mira la letra y la ortografía, pero sobre todo si has
contestado a lo que se preguntaba.

**Ejemplo:** el código de los avisos está limpio, pero no deja desactivarlos desde el perfil. La
revisión lo caza, porque el documento lo pedía.

---

## 5. Cómo se encadenan: el pipeline

La gracia es que **se usan en cadena**, cada una recoge el trabajo de la anterior:

```
   idea que cabe en una sesión            idea ENORME y confusa
            |                                     |
            v                                     v
     /grill-with-docs                        /wayfinder
   (preguntas hasta                     (mapa de decisiones)
    que está clara)                               |
            |                                     |
            v                                     |
   /to-spec  o  brainstorming                     |
   (el documento + /write-adr)                    |
            |                                     v
            v                                /to-tickets
      writing-plans                          (tareas ordenadas)
            |                                     |
            v                                     v
     executing-plans                         /implement
            |                                     |
            +------------------+------------------+
                               v
                         /code-review      (¿bien hecho? ¿lo pedido?)
```

**Regla de oro que comparten todas:** trabajar **de una en una**. Una decisión cada vez, una tarea
cada vez. Nada de hacerlo todo a la vez y liarse.

---

## 6. Ejemplo completo, de principio a fin

Idea inicial: **"Quiero añadir avisos a mi aplicación."**

1. **`/grill-with-docs`** — Preguntas hasta que está claro:
   - ¿Qué servicio usamos para enviar avisos? → lo mira **`/research`**.
   - ¿El usuario podrá elegir qué avisos recibir? → se decide preguntando.
   - ¿Qué aspecto tiene la pantalla de avisos? → se hace una maqueta rápida con **`/prototype`**.
2. **`/to-spec`** — Con las dudas resueltas, se escribe el documento oficial: qué avisos habrá,
   quién los recibe, qué puede configurar el usuario. La elección del servicio queda en un
   **`/write-adr`**.
3. **`writing-plans`** — El documento se convierte en pasos pequeños (guardar preferencias →
   enviar email → pantalla de configuración), cada uno con su prueba.
4. **`executing-plans`** — Se construye paso a paso, comprobando que cada uno funciona.
5. **`/code-review`** — Se revisa que esté bien hecho y que haga lo que decía el documento.

Resultado: se pasó de una frase difusa a algo construido y comprobado, **sin atascos**, porque
cada paso preparó el terreno al siguiente.

---

## 7. Otras skills de apoyo (más breve)

| Skill | Para qué sirve (sencillo) | Analogía |
|---|---|---|
| **`/prototype`** | Hace una maqueta rápida y tosca para ver si la idea "se siente bien". | Una maqueta de cartón. |
| **`/to-questionnaire`** | Prepara las preguntas para quien sí sabe la respuesta. | El formulario que mandas al cliente. |
| **`/handoff`** | Resume todo para que otra persona (u otra sesión) continúe el trabajo. Opcional. | Pasar el testigo en una carrera de relevos. |
| **`/teach`** | Explica un tema de forma didáctica, paso a paso. | Un profesor particular. |
| **`/muscle-memory`** | Gimnasio de ejercicios de práctica para no perder la forma. | Ir al gimnasio a entrenar. |
| **`/wait-what`** | Para y pide que te lo vuelvan a explicar más claro. | Levantar la mano en clase. |

---

## 8. Resumen: una frase por skill (para una diapositiva final)

- **`/grill-with-docs`**: pregunta hasta que la idea está clara.
- **`/wayfinder`**: planifica lo enorme resolviendo dudas una a una.
- **`/research`**: busca datos fiables mientras tú sigues.
- **`/to-spec`**: pasa a limpio lo hablado en un documento.
- **`/write-adr`**: apunta cada decisión importante y su porqué.
- **`writing-plans` → `executing-plans`**: planifica en pasos pequeños y los construye.
- **`/code-review`**: revisa que esté bien hecho y que sea lo pedido.
- Apoyo: **prototype** (maqueta), **to-questionnaire** (preguntar a quien sabe), **handoff**
  (pasa el testigo).

---

## 9. Ideas para montar las diapositivas (opcional)

Un posible guion de slides, una idea por diapositiva:

1. Portada: "Cómo trabaja la IA con un método: las skills".
2. ¿Qué es una skill? (la receta).
3. La idea grande: primero decidir, luego construir (la casa y los planos).
4. Las protagonistas (la tabla del apartado 3).
5–11. Una diapositiva por skill (frase + analogía + ejemplo).
12. El pipeline (el dibujo del apartado 5).
13. Ejemplo completo de los avisos (apartado 6).
14. Skills de apoyo (tabla del apartado 7).
15. Cierre: una frase por skill (apartado 8).

**Consejo para clase:** en cada skill, cuenta primero la analogía cotidiana y solo después el
ejemplo. La analogía "engancha" y el ejemplo "aterriza".
