---
name: revision-interfaz
description: "Combines all the `mejor-*` skills into a single interface review covering accessibility, layout, copy, typography, color, and visual polish, and consolidates a verdict ordered by impact."
tags: ["ui-review", "accessibility", "design-audit"]
profiles: [ui, full]
---

# Revision de interfaz

Esta skill ejecuta una revision multidisciplinar. Enruta la interfaz a cada skill `mejor-*`, recoge sus evidencias y consolida un unico veredicto ordenado.

Lo unico que le pertenece es la orquestacion. Las reglas de accesibilidad son de `mejor-accesibilidad`, la estructura de `mejor-layout`, el texto de `mejor-redaccion`, la tipografia de `mejor-tipografia`, el color de `mejor-colores`, y el acabado visual y el movimiento de `mejor-ui`. Nunca dupliques ni sobreescribas sus reglas aqui.

La revision acotada a un cambio (trabajo sin commitear, ramas, pull requests) es de `revision-de-cambios`, que resuelve el alcance y clasifica los hallazgos antes de devolver la revision aqui.

## Evidencia, no gusto

Aprieta fuerte con los disparadores de escalado y deja en paz las decisiones deliberadas del proyecto. Ambas cosas tiran en la misma direccion. Un disparador es un fallo diga lo que diga la guia de estilo; una densidad, un radio o un tono de voz con el que simplemente no estas de acuerdo no es un hallazgo.

El liston para reportar es la evidencia, no el gusto. El liston para `Aprobar` es que inspeccionaste lo que dices haber inspeccionado. Un informe corto de una inspeccion real vale mas que uno largo inflado para parecer exhaustivo.

## Principios centrales

### 1. Resuelve primero el alcance

Deduce la pantalla, el flujo, la funcionalidad o el alcance de repositorio a partir de la peticion y del espacio de trabajo actual. Indica el alcance resuelto en la salida.

Cubrelo entero en todas las skills de dominio listadas abajo, incluidos los estados vacio, de carga, de error y de anchura estrecha donde existan. Reporta como maximo 15 hallazgos.

Cuando el alcance sea demasiado grande para inspeccionarlo con credibilidad, redúcelo a un flujo completo: aquel sobre el que gira la peticion o, en su defecto, el camino de entrada por el que pasa todo usuario. Indica el limite y que dejaste fuera. Nunca des a entender que revisaste superficies sin inspeccionar.

### 2. Manda los cambios a `revision-de-cambios`

Una peticion que nombra una rama, un pull request, un rango de commits o cambios sin commitear es una revision de cambio, no de pantalla. Dilo y pide al usuario que ejecute `revision-de-cambios`.

Nunca resuelvas aqui el alcance de un cambio. Leer un diff, clasificar hallazgos y expandir los ficheros tocados a las superficies afectadas es de `revision-de-cambios`. Si lo adivinas, el informe tendra un alcance que nadie puede comprobar.

Cuando `revision-de-cambios` devuelva una revision, aporta el alcance del cambio, un estado por hallazgo y el formato de informe acotado al cambio. La severidad, el orden, el tope y el veredicto se quedan aqui, y los tres cubren solo `Introducido` y `Regresion`.

### 3. Reconocimiento antes que juicio

Identifica el framework, el sistema de estilos, la libreria de componentes, los tokens de diseno, los viewports soportados y cualquier comando de vista previa o de test. Escribe cada arreglo en el idioma del propio proyecto, para que ningun hallazgo llegue como una peticion de cambiar de stack. Eso gobierna la FORMA del arreglo, no si el codigo es lo bastante bueno.

Luego lee lo que el proyecto ha escrito sobre su propia interfaz: `CONTRIBUTING.md`, `CODING_STANDARDS.md`, `AGENTS.md`, `CLAUDE.md`, un documento de design system, docs de Storybook, ADRs de interfaz. Nombra cuales encontraste, o di que no hay ninguno.

Léelos para saber DONDE va un hallazgo, no para tener permiso de descartarlo. Una convencion documentada no es prueba de que la convencion sea buena, y "esta en la guia de estilo" no retira un hallazgo. Lo que cambian es **donde** reportas. Cuando la causa es una directriz o un token compartido, reportalo una vez contra esa fuente, con los componentes como sus ubicaciones.

### 4. Usa las skills de dominio como fuentes de verdad

Antes de revisar, confirma que cada skill propietaria esta disponible. Carga y aplica todas las disponibles, y completa cada revision de dominio antes de consolidar.

Revisa en este orden, para que los fallos de cimientos no queden tapados por el acabado:

1. `mejor-accesibilidad`
2. `mejor-layout`
3. `mejor-redaccion`
4. `mejor-tipografia`
5. `mejor-colores`
6. `mejor-ui`

De cada skill de dominio cargada aqui, coge sus principios, sus referencias y sus comprobaciones de verificacion. Su escala de severidad y su formato son para uso independiente; el formato consolidado, la severidad compartida y el tope de hallazgos de este fichero los sustituyen.

Si una skill propietaria no esta disponible, marca ese dominio como `No revisado`, nombralo y sigue con el resto. No recrees sus reglas de memoria, ni sustituyas por una vecina, ni afirmes cobertura completa.

Cuando dos skills parezcan cubrir un mismo problema, asignalo al propietario de la regla subyacente y anota los efectos secundarios en la celda **Por que**. Reportalo una sola vez.

### 5. Exige evidencia

Cada hallazgo cita `ruta/al/fichero:linea` y muestra la implementacion actual. No reportes un hallazgo de codigo solo por la apariencia visual, ni un hallazgo visual solo por el codigo fuente cuando el resultado lo determina el comportamiento en ejecucion.

### 6. Ordena por impacto en el usuario

Usa una unica escala de severidad compartida:

- `ALTA`: bloquea una tarea, engana al usuario, oculta contenido o controles, arriesga perdida de datos, o crea un fallo sistemico repetido.
- `MEDIA`: dana de forma apreciable la comprension, la eficiencia, la adaptabilidad o la consistencia.
- `BAJA`: pulido aislado con impacto limitado en la tarea.

Dentro de una severidad, ordena por a cuantos sitios llega el hallazgo y cuanto compra un solo arreglo. Arreglar un token o un componente compartido va por delante del mismo sintoma en una hoja suelta.

**Disparadores de escalado.** En cuanto la skill propietaria confirma uno de estos, es `ALTA` a la vista, y nunca se promedia a la baja porque la superficie sea menor:

- Un control interactivo sin nombre accesible.
- Un control alcanzable por teclado sin indicador de foco visible.
- Un control o camino alcanzable con el puntero pero no con el teclado.
- Movimiento o contenido con reproduccion automatica que ignora `prefers-reduced-motion`.
- Contenido o control recortado, solapado o inalcanzable a 320px de ancho o al 200% de zoom.
- Texto de cuerpo o de control cuyo par de contraste renderizado no llega a su ratio exigido.
- Estado o significado transmitido solo por color.
- Una accion destructiva sin confirmacion, sin deshacer y sin tratamiento distintivo.
- Contenido truncado sin forma de alcanzar el valor completo.
- Contenido o control alcanzable solo pasando un borde de scroll o tras un desplegable sin pista visible.
- Un error que no nombra ninguna forma de recuperarse.
- Un color semantico usado contra su significado, como el tono de peligro en una accion no destructiva.
- Un cambio de estado transmitido solo por movimiento, sin color, icono ni etiqueta que quede cuando la animacion no se reproduce.

Los disparadores van por delante de cualquier otro hallazgo. Cuando se disparen mas de los que permite el tope, listalos primero y di cuantos excluyo el tope. Un tope puede acortar un informe; nunca puede ser la razon de que un bloqueante quede sin reportar.

Estos fijan la severidad, no reglas nuevas. La skill propietaria decide si el sintoma esta presente; esta lista decide cuanto cuesta. En una revision de cambio, una `Regresion` confirmada contra un disparador es `ALTA` aunque el mismo sintoma fuera `MEDIA` como preexistente.

### 7. Prefiere el arreglo mas barato

La severidad dice como de grave es un hallazgo; esto dice que arreglo proponer. Cuando funcionen varios, coge el primero que sirva:

1. **Borrar.** Un separador que el espacio ya sostiene, una animacion en una interaccion de alta frecuencia, un atributo ARIA que un elemento nativo hace redundante, una rampa de color que nadie importa.
2. **Usar la plataforma.** El elemento nativo, el control nativo, el anillo de foco del navegador, en vez de una reconstruccion propia.
3. **Reutilizar lo que el proyecto ya tiene.** Un token existente, un paso de espaciado, una curva de movimiento, antes que cualquier valor nuevo.
4. **Corregir el valor.** El easing, el radio, el hueco o el par de contraste equivocado, con el valor exacto que da la skill propietaria.
5. **Anadir.** Un token nuevo, un envoltorio, una media query, un atributo ARIA que la plataforma no puede aportar.

Un arreglo escrito en el paso 5 donde el paso 1 estaba disponible es un hallazgo en si mismo. Reporta el borrado en su lugar.

### 8. Consolida los hallazgos sistemicos

Una causa raiz es un hallazgo. Lista todas las ubicaciones confirmadas en la misma fila, en vez de una fila por aparicion. Nunca rellenes para llegar al tope; una revision corta o sin hallazgos es un resultado valido.

### 9. Verifica lo verificable

Ejecuta las comprobaciones seguras y relevantes que ofrezca el proyecto. Inspecciona la interfaz renderizada cuando importe el comportamiento en ejecucion o el juicio visual, y reporta el comando o la interaccion exacta y su resultado. Una comprobacion que no puedes ejecutar es **No verificado**, nunca un hallazgo.

### 10. Revisa sin mutar, por defecto

Trata una peticion de revision como de solo lectura. No edites codigo salvo que el usuario tambien te pida implementar los hallazgos. Cuando lo haga, conserva el informe consolidado como alcance del cambio y vuelve a ejecutar la verificacion relevante despues.

## Antes de terminar

| Error | Arreglo |
| --- | --- |
| Seis informes de dominio inconexos | Una unica tabla de hallazgos ordenada |
| Afirmacion visual deducida solo del codigo | Inspecciona el estado renderizado, o marcalo como no verificado |
| Huecos silenciosos de cobertura | Muestra que dominios y estados se inspeccionaron de verdad |
| Skill propietaria ausente tratada como cubierta | Marca el dominio `No revisado` y nombra la skill |
| Reportar todo problema heredado de un fichero tocado | Tres hallazgos preexistentes, en su propia seccion |
| Un problema preexistente bloqueando una revision de cambio | Deja los preexistentes fuera del tope y fuera del veredicto |
| Dominio marcado `Limpio` cuando el cambio no lo toco | Marcalo `No revisado: sin evidencia en el alcance del cambio` |

## Formato de salida

Abre con el alcance resuelto y una tabla de cobertura por dominio (`Revisado` / `No revisado` con el motivo). Sigue la tabla de hallazgos:

| Severidad | Dominio | Ubicacion | Antes | Despues | Por que |
| --- | --- | --- | --- | --- | --- |

Cierra con la verificacion ejecutada y el veredicto: `Bloquear` si queda alguna `ALTA`, `Aprobar` en caso contrario, dejando el resto en la tabla como trabajo pendiente.
