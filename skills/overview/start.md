# Modo `start`

Cierra la distancia entre lo que dicen los documentos y lo que hace falta para construir. Tú haces el trabajo de leer, comprobar y preguntar; el usuario solo toma las decisiones. Todo queda en `docs/overview/overview.json`, con el esquema de [`zones.md`](zones.md); es la única fuente de verdad de lo que se sabe y lo que falta.

## Estados

Cada pregunta de `questions[]` tiene uno, y solo uno:

| `state` | Estado | Significa |
|---|---|---|
| `verified` | **Comprobado** | Lo has ejecutado y tienes la evidencia |
| `documented` | **Documentado** | Una fuente lo afirma; cítala |
| `contradiction` | **Contradicción** | Dos fuentes discrepan; cita ambas |
| `proposal` | **Propuesta** | Tu recomendación, o una elección técnica escrita en un documento |
| `external` | **Externo** | Lo tiene que responder un tercero; nombra a quién |
| `open` | **Abierto** | Lo tiene que decidir el usuario |
| `decided` | **Decidido** | El usuario lo ha dicho en esta conversación, o quien tiene autoridad sobre ello lo ha dejado por escrito |

La elección de tecnología de una especificación es **Propuesta** hasta que el usuario la confirme. Tu propia recomendación también. Lo que afirma alguien sobre un hecho es **Documentado**, no **Decidido**. Una **Contradicción** sigue siéndolo hasta resolverse, y `who` indica quién la resuelve.

Reglas de cada entrada:

- `source` cita de dónde sale la respuesta: documento y apartado, comprobación, o «usuario, <fecha>».
- `who` nombra a quien responde o decide.
- Al cambiar una respuesta, actualiza la entrada y `updated`, y refleja el cambio en los documentos del proyecto (último apartado).

## Pasos

### 1. Leer las fuentes

Lee entero cada documento relevante. Si uno es largo y solo importa una parte, lee el índice, busca los términos del proyecto y anota qué partes has leído. Anota versión, fecha, autor y si es borrador.

Si el proyecto tiene un registro antiguo de `bajar-a-tierra` (normalmente `docs/registro.md`), es una fuente más: sus preguntas, respuestas y estados pasan a `questions[]` citando ese fichero como `source`. Los estados se traducen uno a uno con la tabla de arriba.

*Hecho cuando:* cada fuente tiene su entrada en `sources[]`, y las que no se han podido leer constan como tales.

### 2. Comprobar antes de preguntar

Averigua qué existe de verdad. Un documento que dice «tenemos acceso» es **Documentado**; solo una prueba ejecutada es **Comprobado**.

| Qué | Cómo | Evidencia |
|---|---|---|
| Repositorio y stack | Ficheros, manifiestos de dependencias, commits, ramas, CI | Listado |
| Herramientas locales | `which` o `Get-Command`, versión | Salida |
| Credenciales disponibles | `.env*`, variables de entorno, configuración SSH, gestor de secretos | **Solo nombres**, nunca valores |
| Base de datos | Conexión y una consulta mínima en sesión de solo lectura | Versión y recuentos |
| Datos frente a documentos | Repetir las cifras que citan los documentos | Valor esperado y obtenido |
| API externas | Llamada de lectura mínima | Código de estado |
| Claves de modelos | Listar modelos disponibles o llamada mínima | Modelos a los que hay acceso |
| Cuentas e infraestructura | CLI del proveedor, en lectura | Proyectos y regiones |
| Dominios | DNS público | Registros |
| Documentación técnica enlazada | Abrirla y buscar interfaces, códigos y reglas | Lo encontrado, con la página |
| Lo que las fuentes dan por sabido | Contrastarlo con los datos reales: códigos, signos, cálculos | Consulta y resultado |

Reglas:

- Solo lectura. Abre las sesiones de base de datos en modo solo lectura, con consultas acotadas.
- Muestra nombres de variables, nunca valores. Mantén los secretos fuera del repo y de `overview.json`.
- Si hay que crear algo, gastar dinero o escribir en un sistema, pide permiso primero.
- Pide permiso antes de conectar por primera vez a producción. Si el usuario te entrega las credenciales para que compruebes, ya lo tienes. Si te las pega en el chat, guárdalas en un `.env` ignorado por git, compruébalo y avísale de que han quedado en la conversación.
- Si una cifra no cuadra con los documentos, busca la causa antes de informar.
- Ten en cuenta el coste: una llamada de pago la justifica el dato que aporta.

Cada comprobación va a `verifications[]` con uno de tres resultados: `verified` (qué se ejecutó y qué devolvió, con fecha), `failed` (el error exacto) o `untested` (qué falta para probarlo y quién lo tiene). Una ausencia también es un resultado: «no hay credenciales de X en este equipo», con lo que se ha buscado y dónde.

Lo primero que recibe el usuario, antes de cualquier otra cosa, es esta tabla, por cada sistema con datos:

| Sistema | ¿Dónde están los datos? | ¿Hay API o conexión? | ¿Cómo se autentica? | ¿Lo dicen los documentos? | ¿Tengo acceso hoy? |
|---|---|---|---|---|---|

Lo que falte va directo a `questions[]`.

*Hecho cuando:* la tabla está entregada, y cada acceso, clave, herramienta y sistema tiene su entrada en `verifications[]`, con evidencia o con el motivo por el que no se ha podido probar.

### 3. Sembrar las zonas

Sigue [`zones.md`](zones.md) con el stack comprobado en el paso 2: escribe `zones[]` con sus globs, `reviewSkills`, `cadenceDays` y las comprobaciones de [`checks.md`](checks.md), y lleva a `hiddenZones[]` las que no aplican, con el motivo.

*Hecho cuando:* `docs/overview/overview.json` existe, cada zona por defecto está en `zones` o en `hiddenZones`, y `node scripts/overview.mjs scan` corre sin error y lista las zonas visibles.

### 4. Cruzar el banco de preguntas

Recorre todo [`questions.md`](questions.md) contra las fuentes y las comprobaciones. Adapta o marca «no aplica» (`notApplicable: true`) lo que no encaje, con el motivo. Agrupa lo que tenga la misma respuesta. Añade las preguntas propias del proyecto. Lo que dependa de un tercero va a `pendingMessage`, con las reglas del mensaje de [`questions.md`](questions.md).

*Hecho cuando:* cada pregunta del banco tiene su entrada en `questions[]` con estado, y cada contradicción está anotada con sus dos fuentes.

### 5. Enseñar el mapa (opcional)

Si el proyecto tiene varios perfiles, terceros o sistemas, publica el mapa de [`map.md`](map.md) y explica el flujo antes de pedir decisiones. Si no, explícalo en el chat.

*Hecho cuando:* el usuario tiene el enlace, o la explicación, y en ella se ve lo que está en el aire.

### 6. Preguntar por rondas

Sigue el método de rondas de la skill `grilling`, con preguntas numeradas y tu recomendación en cada una. Cada ronda lleva la frontera, hasta 7 preguntas: las decisiones cuyos prerrequisitos ya están resueltos. Empieza por alcance, responsabilidades y perfiles (incluido `multitenant`), porque de ahí cuelga lo demás.

Pregunta solo lo que sea una decisión. Los hechos los averiguas tú, y lo que depende de un tercero va al mensaje único para el interlocutor del proyecto. Si no consta quién es el interlocutor, esa es tu primera pregunta.

Tras cada ronda, actualiza `overview.json` y, si lo hay, el mapa.

*Hecho cuando:* no queda nada en **Abierto** ni **Propuesta** que bloquee la puerta de abajo.

### 7. Puerta de construcción

Se puede empezar a construir una parte cuando:

- Los accesos que esa parte necesita, de lectura o de escritura, están **Comprobados**.
- Su alcance, perfiles, flujo, responsables y stack están **Decididos**.
- Sus bloqueos **Externos** tienen responsable, fecha y plan alternativo.

Si no se cumple, dilo y enumera lo que falta. La decisión de empezar igualmente es del usuario.

## Documentos del proyecto

Mantén la wiki o los documentos del proyecto como resultado de `overview.json`. Cada apartado lleva su estado, y presenta como cerrado solo lo que está **Decidido**.
