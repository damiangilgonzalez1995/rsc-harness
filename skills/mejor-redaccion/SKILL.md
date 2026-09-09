---
name: mejor-redaccion
description: "Use when writing or reviewing a product's copy — voice and tone, button labels, a flow's vocabulary, link text, capitalization, settings, error messages, empty states, and placeholders."
tags: ["ux-writing", "microcopy", "content-design"]
---

# Redaccion de interfaz

Claro y breve gana a ingenioso; consistente gana a variado. El mejor mensaje de error es la interaccion redisenada para que el error no pueda ocurrir.

Como se renderiza el texto (capitalizacion via `text-transform`, truncado, puntuacion tipografica) es de `mejor-tipografia`. El marcado y el anuncio de errores (`aria-invalid`, regiones vivas) es de `mejor-accesibilidad`. El espacio para cadenas traducidas es de `mejor-layout`.

## Reconoce la voz existente

Antes de escribir o revisar, lee los textos de alrededor. Anota la terminologia del producto, sus convenciones de localizacion y cualquier guia de voz o de contenido.

Una voz de marca deliberada no es un defecto. Senala una desviacion del lenguaje llano solo cuando cree inconsistencia, ambiguedad, riesgo de traduccion o un tono que las circunstancias no soportan.

## Una voz, tono flexible

El producto tiene una voz y sus textos existentes la establecen. Una edicion local no puede inventarse otra. Manten los terminos consistentes: si en el menu es "Archivar", en el toast no es "Mover al almacen". El tono flexiona con lo que hay en juego:

| Contexto | Tono |
| --- | --- |
| Exito, onboarding, estados vacios | Calido, puede ser ligero |
| Acciones rutinarias, ajustes | Neutro, minimo |
| Errores, confirmaciones destructivas | Tranquilo, llano, cero picardia |
| Perdida de datos, seguridad | Serio, explicito |

## Dirigete al lector directamente

En textos instructivos escribe "tu", no "el usuario". En errores, "estamos" invita a la ambiguedad y se lee como escurrir el bulto: prefiere "No se ha podido cargar el contenido" a "Estamos teniendo problemas para cargar esto". Una voz en primera persona ya establecida puede quedarse en textos de bajo riesgo donde siga leyendose claro.

Usa posesivos con moderacion: "Favoritos" gana a "Tus favoritos". Manten una unica perspectiva a lo largo de un flujo.

## Palabras llanas antes que ingeniosas

Elige palabras que un lector cansado pille a la primera, y borra cada palabra que no haga trabajo. Sin modismos, sin coloquialismos, sin humor que no vaya a traducirse.

Evita el genero innecesario. Ajustate al dispositivo de entrada: "toca" en tactil, "haz clic" con puntero, "selecciona" cuando caben ambos.

Nunca montes una frase a partir de fragmentos alrededor de una variable (`"Tienes " + n + " mensajes nuevos"`), porque el orden de las palabras cambia por idioma. Usa una cadena plantilla completa con pluralizacion correcta.

## Botones que empiezan por verbo

La etiqueta de un boton empieza por un verbo que nombra la accion: "Enviar", "Guardar borrador", "Eliminar proyecto". Nunca "Vale!", "Vamos alla!" ni un "Si" y "No" pelados en una accion con consecuencias.

Un boton de confirmacion repite la consecuencia, para que el dialogo se pueda responder sin leer el cuerpo. "Eliminar este proyecto?" ofrece `Eliminar proyecto` y `Cancelar`.

## Vocabulario consistente en un flujo

Un flujo de varios pasos usa un unico vocabulario de principio a fin: "Empezar" para entrar, "Continuar" o "Siguiente" (elige uno) para avanzar, "Hecho" para terminar. Alternar sinonimos hace que el usuario se pregunte si los botones hacen cosas distintas.

## Los enlaces describen su destino

El texto de un enlace tiene que tener sentido fuera de contexto, porque los usuarios de lector de pantalla navegan por una lista de los enlaces de la pagina. Escribe "Leer la documentacion de facturacion". "Haz clic aqui" incumple esto y la regla del verbo del dispositivo a la vez.

Un "Saber mas" pelado se rompe en cuanto aparecen dos en una pagina. Ponle sufijo a cada uno: "Saber mas sobre exportaciones".

## Una unica politica de capitalizacion

Elige mayusculas de titulo o de frase por tipo de elemento, y aplicalo a todas las instancias de ese tipo. Mayuscula de frase es el defecto mas seguro: es mas tranquila, no tiene reglas por palabra que recordar y se localiza limpiamente. "Guardar Cambios" junto a "Descartar cambios" se lee como descuido.

## Los ajustes describen el estado ENCENDIDO

Etiqueta un interruptor por lo que pasa cuando esta encendido. "Enviar confirmaciones de lectura" deja inferir el estado apagado; el negativo ("No enviar confirmaciones de lectura") convierte el interruptor en una doble negacion.

Enlaza directamente al ajuste referenciado en vez de describir la ruta hasta el: un enlace "Ajustes de notificaciones", no "Ve a Ajustes > Notificaciones > Correo".

## Los errores dicen como arreglarlo, junto a donde se rompio

Un error es una instruccion, y va al lado del campo que fallo:

| Mal | Bien |
| --- | --- |
| Esa contrasena es demasiado corta | Elige una contrasena de al menos 8 caracteres |
| Nombre invalido | Usa solo letras en tu nombre |
| Ups! Algo ha ido mal. | No se ha podido guardar. Comprueba tu conexion e intentalo de nuevo. |

Sin culpar, sin "ups", sin exclamaciones. Formula las pistas en positivo ("Usa solo letras", no "No uses numeros ni simbolos") y muestralas antes del error, no despues. Cuando el mismo error salta una y otra vez, redisena la interaccion en vez de reescribir el texto.

## Los estados vacios apuntan hacia delante

Un estado vacio dice que es este sitio, como llenarlo y ofrece una accion siguiente clara:

```html
<!-- Mal: un encogimiento de hombros -->
<p>Sin resultados.</p>

<!-- Bien: orientacion mas siguiente paso -->
<p class="font-medium">Aun no hay proyectos</p>
<p class="text-sm text-zinc-500">Los proyectos mantienen juntas tus tareas y ficheros.</p>
<button class="mt-4">Crear un proyecto</button>
```

Un estado vacio de busqueda o filtro nombra la consulta y ofrece una salida: "Sin resultados para 'trimestral'. Quitar filtros". Nunca aparques informacion permanente en un estado vacio: desaparece en cuanto hay contenido.

## Los placeholders son ejemplos, no etiquetas

Un placeholder muestra el formato esperado: `nombre@ejemplo.com`, `DD/MM/AAAA`. Desaparece al escribir, asi que nunca es la unica etiqueta. Cada campo conserva una visible.

## Como reportar

**Severidad.** `ALTA` engana al usuario u oculta como recuperarse de un error. `MEDIA` rompe la consistencia de voz, terminologia o capitalizacion. `BAJA` es pulido aislado de redaccion.

**Verificacion.** Aqui basta con el codigo fuente. Comprueba cada etiqueta contra la accion que invoca, cada error contra el arreglo que declara, y la terminologia contra los textos de alrededor. No hace falta comprobacion en navegador.

**Formato.** Agrupa los hallazgos bajo el principio que incumplen, ordenados por severidad, una fila por causa raiz listando todas sus ubicaciones:

| Severidad | Ubicacion | Antes | Despues | Por que |
| --- | --- | --- | --- | --- |

Termina con `Bloquear` si queda alguna `ALTA`, y `Aprobar` en caso contrario. Nunca `Aprobar` cobertura que no inspeccionaste. Si no hay nada, di "Sin hallazgos accionables de redaccion" y reporta la verificacion.
