---
name: leyes-de-retencion
description: "Use when diagnosing why people abandon a flow halfway through, or when designing decisions, forms, steps, response times, and closing moments — Hick's law, Fitts's law, Miller's law, Jakob's law, the Doherty threshold, the Zeigarnik effect, the serial position effect, the peak-end rule, and Tesler's law."
tags: ["retention", "ux-laws", "behavioral-design"]
profiles: [ui, full]
---

# Leyes de retencion

Por que la gente se va a mitad de camino. Estas nueve leyes vienen de investigacion en psicologia cognitiva y de UX, y cada una explica una clase distinta de abandono. Usalas para diagnosticar un flujo que pierde gente, y para disenar uno que no la pierda.

**Diagnostico rapido**: emparéjá el sintoma con la ley.

| Sintoma | Ley |
|---|---|
| El usuario se queda parado ante la pantalla sin elegir | Hick |
| Falla el objetivo, sobre todo en movil | Fitts |
| Rellena mal el formulario o se pierde a mitad | Miller |
| No encuentra algo que esta a la vista | Jakob |
| Da varias veces al mismo boton, o se va durante la espera | Doherty |
| Empieza el flujo y no vuelve | Zeigarnik |
| Se salta lo del medio de una lista o un menu | Posicion serial |
| Completa el flujo pero lo recuerda mal | Pico-final |
| Todo parece simple y aun asi el usuario sufre | Tesler |

---

## 1. Ley de Hick — el tiempo de decision crece con el numero de opciones

El tiempo para tomar una decision crece de forma logaritmica con el numero de opciones simultaneas. Duplicar las opciones no duplica el tiempo, pero cada opcion anadida cuesta algo.

- Menos opciones a la vez acelera la decision.
- Agrupar y revelar progresivamente reduce la complejidad aparente sin esconder funcionalidad.
- **La claridad de las opciones importa tanto como el numero**: opciones ambiguas o solapadas son mas dificiles de elegir que un conjunto mayor de opciones bien distintas.

Donde aplicarla: menus de navegacion (limita el primer nivel), barras de acciones (saca las comunes, mete el resto en un desbordamiento), onboarding (una decision por paso), formularios (menos campos opcionales, obligatorios primero), tablas de precios (tres planes es el punto dulce convencional), listados (paginacion y carga progresiva).

## 2. Ley de Fitts — el tiempo de alcance depende del tamano y la distancia

El tiempo para alcanzar un objetivo es funcion de la distancia y del tamano. En llano: los objetivos grandes y cercanos se pulsan rapido; los pequenos y lejanos son lentos y propensos a error. Las dos dimensiones cuentan por separado.

**Tamano**
- Objetivo tactil minimo: 44x44pt (Apple) / 48x48dp (Material).
- Con puntero puede ser menor, pero generoso igualmente: 24x24px minimo.
- El objetivo es el area interactiva, no el icono: un icono de 16px puede tener 44px de area de pulsacion.
- Agranda los objetivos de las acciones frecuentes o de mucha consecuencia.

**Distancia**
- Coloca las acciones cerca del contenido sobre el que actuan: la accion de una tarjeta vive en la tarjeta, no al otro lado de la pantalla.
- Los bordes y las esquinas de la pantalla son objetivos de tamano infinito con puntero (no te puedes pasar). Usalos para navegacion persistente.
- En movil, la zona alcanzable con el pulgar es la mitad inferior. Las acciones principales van ahi, no arriba del todo.

## 3. Ley de Miller — agrupa en trozos de unos cuatro

El articulo de 1956 propuso 7 +/- 2 elementos en memoria de trabajo, y se ha citado tanto como se ha malaplicado. La investigacion posterior (Cowan, 2001) situa el limite realista de **trozos con significado en torno a 4 +/- 1**. El matiz que el propio Miller senalo: el 7 aplica a **trozos**, no a elementos crudos.

Lo que significa para el diseno: **agrupar en trozos con significado reduce la carga sea cual sea el numero exacto**. No cites "7 elementos" como regla; cita el agrupamiento como estrategia.

Donde aplica: navegacion (agrupa por categoria; una lista plana de 10+ se barre peor que 3 grupos de 3-4), formularios (parte los largos en secciones con cabecera, cada una completable como unidad), numeros y codigos (formateados en trozos), tablas (agrupacion visual para partir listas largas), onboarding (3-5 fases con nombre en vez de 12 pasos numerados), listas de funcionalidades y precios (3-5 vinetas por plan; a partir de ahi se deja de leer).

## 4. Ley de Jakob — el usuario espera que funcione como lo demas que usa

El usuario pasa casi todo su tiempo en OTROS productos. Llega al tuyo con expectativas ya construidas sobre donde vive la navegacion, que significa un icono de carrito, como se comporta un interruptor y donde se buscan los ajustes.

No es un argumento para copiar a la competencia. Es un argumento para **entender que convenciones cargan una expectativa lo bastante fuerte como para que apartarse de ellas imponga un coste real de aprendizaje**, y ser deliberado cuando lo hagas.

Las convenciones mas fuertes: el logo arriba a la izquierda vuelve al inicio; la navegacion principal arriba o en lateral; la busqueda con lupa; el carrito arriba a la derecha; el formulario se envia con un boton al final; el enlace subrayado o de otro color; el gesto de volver atras; el cierre arriba del todo del modal.

Rompe un patron familiar solo si puedes demostrar que es mejor, y entonces pruébalo, no lo supongas.

## 5. Umbral de Doherty — por debajo de 400ms se conserva el flujo

Doherty y Thadani (IBM, 1982) establecieron que cuando el sistema responde a una accion en **menos de 400ms**, la productividad sube de forma sustancial: el usuario se queda en flujo en vez de perder el hilo.

| Tiempo de respuesta | Percepcion |
|---|---|
| 0-100ms | Instantaneo: el sistema se siente como extension directa de la accion |
| 100-300ms | Rapido: perceptible pero no molesto |
| 300-400ms | En el limite: algunos usuarios lo notan |
| 400ms-1s | Lento: el usuario sabe que espera; hace falta un indicador |
| 1s+ | Claramente lento: hace falta feedback de progreso; el flujo se rompe |
| 10s+ | Interrupcion de tarea: el usuario cambia de contexto |

Donde mas importa por debajo de 400ms: transiciones entre vistas, respuesta al pulsar un boton, filtrado y busqueda incremental, apertura de menus y desplegables.

**Y cuando no puedes bajar de ahi**: la percepcion tambien se disena. Una respuesta optimista (actualizar la UI antes de que confirme el servidor), un esqueleto con la forma del contenido real y una animacion mas rapida hacen que lo mismo se sienta mas rapido.

## 6. Efecto Zeigarnik — lo incompleto sigue activo en la mente

La gente recuerda mejor las tareas interrumpidas o sin terminar que las completadas. Lo inacabado ocupa bucles abiertos en la memoria de trabajo. **La incompletitud es un estado motivacional**: algo empezado y sin terminar tira hacia su finalizacion.

Aplicaciones honestas:
- Indicadores de progreso en flujos de varios pasos: ver "paso 2 de 4" tira hacia el 4.
- Un perfil al 60% con lo que falta enumerado.
- Borradores guardados que sobreviven a la interrupcion: el usuario vuelve porque puede volver.
- Un primer paso ya marcado al empezar (progreso dotado), que convierte "no he empezado" en "voy por la mitad".

**Donde se vuelve abuso**: bucles abiertos que no puedes cerrar, contadores de notificaciones que nunca llegan a cero, o interrumpir a proposito una tarea para forzar el retorno. Eso no retiene: quema.

## 7. Efecto de posicion serial — se recuerdan el principio y el final

En una secuencia, se recuerdan los elementos del principio (primacia) y los del final (recencia). Los del medio se recuerdan menos: la atencion y la codificacion caen ahi. Ese hueco es el "valle de posicion serial".

- Coloca los elementos criticos de un menu o una lista al principio o al final.
- Si algo importante tiene que ir en el medio por logica, **compénsalo con distincion visual** (ahi es donde entra Von Restorff).
- En una tabla de precios, el plan que quieres que se elija va en un extremo o marcado; en el medio y sin marcar es el que menos se recuerda.
- En una barra de navegacion, el ultimo elemento tiene mas peso del que la gente cree: ahi suele ir el CTA.

## 8. Regla del pico-final — un flujo se recuerda por su momento mas intenso y por el final

La investigacion de Kahneman encontro que la gente no evalua una experiencia como la media de sus momentos. El juicio retrospectivo lo dominan dos:

1. **El pico**: el momento emocionalmente mas intenso, positivo o negativo.
2. **El final**: como concluyo.

La duracion y la calidad media de todo lo demas aportan mucho menos. Es la "negligencia de la duracion": la gente juzga mal cuanto duro algo, pero bien como se sintio en los extremos.

Implicaciones:
- **Disena el final a proposito.** Una pantalla de exito, una confirmacion que dice exactamente que ha pasado y que viene despues, un momento de celebracion proporcionado. Un flujo que termina en una pagina en blanco se recuerda como peor de lo que fue.
- **Busca los picos negativos y arreglalos primero.** Un unico error humillante a mitad del formulario pesa mas en el recuerdo que veinte campos que fueron bien.
- **La cancelacion y la baja tambien tienen final.** Un flujo de baja digno es lo que hace que alguien vuelva; uno que pone trabas es el pico negativo que se cuenta a otros.

## 9. Ley de Tesler — la complejidad no se elimina, se mueve

Toda aplicacion tiene una cantidad irreducible de complejidad. No se puede eliminar: solo se puede mover. La decision de diseno es: **la absorbe el usuario o la absorbe el producto?**

Simplificar la interfaz no quita complejidad. La reubica.

- **Complejidad inherente**: viene de la naturaleza de la tarea. Reservar un vuelo con varios pasajeros, asientos concretos y una escala es genuinamente complejo. Quitar esa complejidad es quitar capacidad.
- **Complejidad accidental**: la que anade la implementacion y no la tarea. Esa si se borra.

El fallo tipico: una interfaz que parece limpia porque ha empujado la complejidad al usuario, que ahora tiene que saber cosas, recordar formatos, o hacer el trabajo en otra herramienta y pegarlo. **Todo parece simple y aun asi el usuario sufre**: eso es Tesler.

Preguntas para aplicarla:
- Que esta teniendo que saber el usuario que el producto podria deducir?
- Que esta teniendo que recordar que el producto podria guardar?
- Que paso esta haciendo a mano que el producto podria hacer por defecto?
- Y al reves: que hemos escondido tanto que ahora el usuario no puede hacer su trabajo?

---

## Como usar este paquete en un diagnostico de abandono

1. **Mide donde se cae la gente**, no donde crees que se cae.
2. En ese punto, pasa las leyes en este orden: **Doherty** (esta esperando?), **Hick** (hay demasiado que decidir?), **Miller** (hay demasiado que retener?), **Fitts** (el objetivo es alcanzable?), **Jakob** (esperaba otra cosa?), **Tesler** (le hemos pasado el trabajo a el?).
3. Para la retencion a medio plazo, mira **Zeigarnik** (hay un bucle abierto al que volver, y puede volver de verdad?).
4. Para la valoracion y la recomendacion, mira **pico-final** (cual es el pico negativo, y como termina esto?).
5. Para lo que la gente recuerda de un menu o un listado, mira **posicion serial**.
