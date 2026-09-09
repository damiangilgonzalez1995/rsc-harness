---
name: diseno-apple
description: "Apple's approach to interface design and fluid, physical motion, translated to the web. Use when building or reviewing gesture-driven UI, spring animations, drag/swipe/sheet interactions, inertia and interruptible transitions, translucent materials and depth, typography (optical size, tracking, line height), reduced motion, or the design fundamentals (feedback, spatial consistency, containment) behind Apple-style interfaces."
tags: ["design", "apple", "motion", "interface"]
---

# Diseno Apple

Como construye Apple interfaces que dejan de parecer un ordenador y empiezan a parecer una extension de ti. Este conocimiento viene de las charlas de diseno de la WWDC, principalmente *Designing Fluid Interfaces* (WWDC 2018), destilado y traducido a la plataforma web (CSS, Pointer Events, `requestAnimationFrame`, librerias de muelles como Motion/Framer Motion).

El hilo conductor: **una interfaz se siente viva cuando el movimiento arranca desde el valor actual en pantalla, hereda la velocidad del usuario, proyecta la inercia hacia delante y se puede agarrar e invertir en cualquier instante.** Los muelles son la herramienta que hace todo esto natural, porque son interrumpibles y conscientes de la velocidad por naturaleza.

## La idea central

> "Cuando alineamos la interfaz con la forma en que pensamos y nos movemos, pasa algo magico: deja de parecer un ordenador y empieza a parecer una extension continua de nosotros."

Una interfaz es fluida cuando se comporta como el mundo fisico: las cosas responden al instante, se mueven de forma continua, arrastran inercia, se resisten en los limites y se pueden redirigir en pleno movimiento. Todo lo de abajo es una forma de acercarse a eso.

Apple plantea el diseno como servicio a cuatro necesidades humanas: **seguridad/previsibilidad, comprension, logro y alegria.** Cada regla de aqui sirve a una de ellas.

## 1. Respuesta — mata la latencia

En cuanto aparece retardo, la sensacion de manipulacion directa "se cae por un precipicio". La respuesta es el cimiento sobre el que se construye todo lo demas.

- **Responde al pulsar (pointer-down), no al soltar.** Resalta un boton en el instante en que se pulsa. Esperar al `click`/touch-up para mostrar feedback se siente muerto.
- **Se implacable con cada latencia.** Audita debounces, temporizadores artificiales, esperas de transicion y el retardo de ~300ms del tap. Cualquier cosa en el camino de entrada que no sea imprescindible es una regresion.
- **El feedback debe ser continuo *durante* la interaccion, no solo al final.** En un arrastre, un slider o un drawer, actualiza la UI 1:1 con el puntero todo el recorrido; nunca animes solo cuando el gesto se completa.

```css
/* El feedback vive en la pulsacion, y es instantaneo */
.button:active {
  transform: scale(0.97);
  transition: transform 100ms ease-out;
}
```

## 2. Manipulacion directa — seguimiento 1:1

> "El dedo y el contenido deben moverse juntos."

Cuando el usuario arrastra algo, tiene que quedarse pegado al dedo, y respetar el desplazamiento respecto a *donde lo agarro*. Saltar al centro del elemento al agarrarlo rompe la ilusion al instante.

- Usa Pointer Events con `setPointerCapture` para que el seguimiento continue aunque el puntero salga de los limites del elemento.
- Guarda un **historial corto de velocidad/posicion** (los ultimos `pointermove`), no solo el punto actual: vas a necesitar la velocidad al soltar.

```js
el.addEventListener('pointerdown', (e) => {
  el.setPointerCapture(e.pointerId);
  const grabOffset = e.clientY - el.getBoundingClientRect().top; // respeta donde agarro
  // ...guarda historial de posicion + timestamp para la velocidad
});
```

## 3. Interrumpibilidad — el principio mas importante de todos

> "El pensamiento y el gesto ocurren en paralelo."

Toda animacion debe ser interrumpible y redirigible en cualquier momento. El usuario tiene que poder agarrar un elemento en pleno vuelo e invertirlo sin esperar a que termine la animacion. Un modal que se esta cerrando y el usuario vuelve a agarrar debe seguir al dedo, no terminar de cerrarse y luego reabrirse.

- **Nunca bloquees la entrada durante una transicion.**
- **Anima siempre desde el valor de *presentacion* (el actual), nunca desde el valor destino.** Al interrumpir, lee el transform vivo en pantalla y arranca la nueva animacion desde ahi. Partir del valor logico/destino provoca un salto visible.
- **Evita transiciones CSS y `@keyframes` para cualquier cosa dirigida por gestos**: no se pueden agarrar e invertir suavemente en pleno vuelo. Los muelles animan desde el valor actual por defecto, que es exactamente lo que la interrupcion necesita.
- **Cuando un gesto se invierte, mezcla la velocidad, no la cortes de golpe.** Sustituir una animacion por otra en una inversion crea una discontinuidad de velocidad, un "muro de ladrillo". Las librerias de muelles que arrastran la velocidad al reapuntar lo evitan. (Es lo que hacen las *additive animations* de iOS de forma nativa; en web, elige una libreria de muelles que reapunte desde la velocidad actual.)
- **Descompon el movimiento 2D en muelles independientes de X e Y.** Un unico muelle sobre una distancia 2D se desincroniza cuando X e Y llevan velocidades distintas.

## 4. Comportamiento antes que animacion — usa muelles

> "Piensa en la animacion como una conversacion entre tu y el objeto, no como algo prescrito por la interfaz."

Una animacion guionizada de duracion fija no puede responder a una entrada nueva. Un muelle si: la entrada nueva solo cambia el destino, y el movimiento sigue siendo continuo. Coge muelles para cualquier cosa que el usuario pueda tocar.

Apple sustituyo deliberadamente el trio de fisica (masa/rigidez/amortiguacion) por dos parametros amigables para disenadores. Piensa en estos:

- **Ratio de amortiguacion (damping)** — controla el sobrepaso. `1.0` = criticamente amortiguado, sin rebote, asentamiento suave. `< 1.0` = sobrepasa y oscila. Mas bajo = mas rebote.
- **Respuesta (response)** — con que rapidez alcanza el valor su destino, en segundos. Mas bajo = mas seco. **No es "duracion"**: un muelle no tiene duracion fija; su tiempo de asentamiento emerge de los parametros.

**Valores por defecto:**
- Empieza casi toda la UI con **damping `1.0`** (criticamente amortiguado): elegante y no distrae.
- Anade rebote (**damping ~`0.8`**) **solo cuando el gesto en si arrastraba inercia** (un flick, un lanzamiento, soltar un arrastre). El sobrepaso en un menu que solo se ha fundido esta mal; el sobrepaso en una tarjeta que has lanzado esta bien.

**Valores concretos que usa Apple:**

| Interaccion | Damping | Response |
| --- | --- | --- |
| Mover / reposicionar (p. ej. PiP) | `1.0` | `0.4` |
| Rotacion | `0.8` | `0.4` |
| Drawer / hoja | `0.8` | `0.3` |

**Mapeo web (Motion / Framer Motion):** la API de muelle con `bounce` + `duration` mapea de cerca al damping + response de Apple. Un estilo de casa seguro es usar muelles con `damping: 1.0` por defecto en todas partes, y reservar el rebote para interacciones fisicas dirigidas por inercia.

```js
import { animate } from 'motion';

// Defecto criticamente amortiguado (sin sobrepaso)
animate(el, { y: 0 }, { type: 'spring', bounce: 0, duration: 0.4 });

// Interaccion con inercia: un poco de rebote, solo porque hubo un flick antes
animate(el, { y: target }, { type: 'spring', bounce: 0.2, duration: 0.4 });
```

## 5. Traspaso de velocidad — la costura entre arrastre y animacion

Cuando termina un gesto, la animacion debe **continuar a la velocidad exacta del dedo**, para que no haya costura visible entre arrastrar y animar. Este es el detalle que mas separa lo "fluido" de lo "correcto".

Pasa la velocidad de soltado del puntero como velocidad inicial del muelle. Algunas APIs de muelle quieren velocidad **relativa**: normalizala por la distancia que queda hasta el destino.

```
velocidadRelativa = velocidadDelGesto / (valorDestino - valorActual)
```

Ejemplo: elemento en `y=50`, destino `y=150` (quedan 100px), dedo a 50px/s → velocidad inicial del muelle = `50 / 100 = 0.5`. Framer Motion / Motion aceptan velocidad absoluta en px/s directamente (opcion `velocity`), asi que normalmente le pasas el valor crudo.

## 6. Proyeccion de inercia — anima hacia donde *va* el gesto

> "Coge una entrada pequena y produce una salida grande."

No saltes al limite mas cercano al *punto de soltado*. Usa la velocidad para **proyectar la posicion de reposo**, exactamente como la deceleracion del scroll, y luego encaja en el destino mas cercano a ese punto proyectado. Esto es lo que hace que un flick se sienta como si lanzara el elemento.

La funcion de proyeccion exacta de Apple (del codigo de ejemplo de *Designing Fluid Interfaces*):

```js
// decelerationRate ~ 0.998 para sensacion de scroll normal; 0.99 para algo mas seco
function project(initialVelocity /* px/s */, decelerationRate = 0.998) {
  return (initialVelocity / 1000) * decelerationRate / (1 - decelerationRate);
}

const projectedEndpoint = currentPosition + project(releaseVelocity);
const target = nearestSnapPoint(projectedEndpoint);   // elige destino desde la proyeccion
animateSpringTo(target, { velocity: releaseVelocity }); // y luego traspasa la velocidad (§5)
```

Ojo: el `v²/(2·decel)` del libro de fisica *no* es lo que usa Apple; usa la forma de decaimiento exponencial de arriba. Es el comportamiento estandar de las buenas bottom-sheets y carruseles (Vaul, Embla).

## 7. Consistencia espacial — caminos simetricos, origenes anclados

> "Si algo desaparece por un lado, esperamos que vuelva a emerger por donde se fue."

- **Entra y sal por el mismo camino.** Un panel que entra desde la derecha debe descartarse hacia la derecha. Entrar por la derecha y salir por abajo se siente desconectado y confuso.
- **Ancla las interacciones a su origen.** Un menu, un popover o una hoja deben nacer del elemento que los disparo: pon `transform-origin` en el disparador, para que la relacion espacial entre boton y contenido sea obvia.
- **Refleja el easing en las transiciones reversibles** para que el camino de ida coincida con el de vuelta (usa puntos de control cubic-bezier inversos para cada direccion).

## 8. Insinua en la direccion del gesto

Las personas predicen el estado final a partir de una trayectoria. El movimiento intermedio debe telegrafiar hacia donde van las cosas: los modulos del Centro de Control "crecen hacia arriba y hacia fuera, hacia tu dedo". Haz que los fotogramas intermedios apunten al resultado, no que interpolen a ciegas hacia el.

## 9. Rubber-banding — limites blandos

En un borde, resiste progresivamente en vez de parar en seco. Un parón duro se lee como "congelado"; una resistencia continua se lee como "responde, pero aqui no hay mas". Aplica una amortiguacion que crece cuanto mas alla del limite arrastra el usuario.

```js
// Cuanto mas alla del limite, menos sigue el elemento: las cosas reales frenan antes de parar
function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
```

## 10. Detalles de diseno de gestos (la lista de "sensacion")

- **Tap:** resalta al *pulsar* (instantaneo), confirma al *soltar*. Anade ~10px de histeresis/relleno alrededor del objetivo, y permite cancelar arrastrando fuera y volver.
- **Arrastre/deslizamiento:** exige un umbral pequeno de movimiento (histeresis, ~10px) antes de comprometerte con una direccion, y luego sigue 1:1.
- **Detecta todos los gestos plausibles en paralelo desde el primer movimiento**, y cancela con seguridad a los perdedores cuando la intencion este clara. Evita reconocedores que solo reportan un estado *final* (eventos tipo `swipeleft`): tiran el seguimiento continuo que necesitas para el feedback.
- **Minimiza los retardos de desambiguacion.** Detectar el doble tap retrasa inevitablemente el tap simple; paga ese coste solo donde el doble tap exista de verdad.

## 11. Fluidez a nivel de fotograma

La fluidez va de *que hay en los fotogramas*, no solo de la tasa de fotogramas.

- Manten el cambio de posicion por fotograma por debajo del umbral de percepcion para evitar el efecto estroboscopico.
- Para movimiento muy rapido, un **desenfoque de movimiento o estiramiento** sutil codifica la velocidad y se lee mejor que un trazo duro y nitido.
- `requestAnimationFrame` es el reloj sincronizado con la pantalla en web (Apple usa `CADisplayLink`). Anima solo propiedades amigables para el compositor — `transform` y `opacity` — y avisa con `will-change` donde el movimiento sea inminente.

## 12. Materiales y profundidad — la translucidez transmite jerarquia

Apple usa materiales translucidos como una capa funcional flotante que aporta estructura sin robar el foco. En web se aproxima con `backdrop-filter`.

- **Construye navs/toolbars/hojas como capas translucidas** (`backdrop-filter: blur()` + fondo semitransparente) con el contenido pasando por debajo, no como barras opacas que se comen una franja fija.
- **El peso del material codifica jerarquia:** los materiales mas oscuros/pesados separan regiones estructurales (barras laterales); los mas ligeros llaman la atencion sobre elementos interactivos (botones). **Nunca apiles una superficie translucida clara sobre otra**: la legibilidad se hunde.
- **Las superficies mas grandes deben leerse como mas gruesas:** mas desenfoque y una sombra mas profunda que un chip pequeno. Considera una sombra consciente del contexto: mas pesada sobre contenido cargado o texto para separar, mas ligera sobre fondos planos.
- **Atenua para enfocar, separa para no cortar el flujo.** Una tarea modal empareja la superficie con un velo de oscurecimiento y empuja el fondo hacia atras/abajo. Un panel paralelo y no bloqueante usa translucidez y desplazamiento *sin* velo, para no romper el flujo. En hojas apiladas, atenua y empuja hacia atras progresivamente cada capa padre.
- **La vibrancy mantiene el texto legible sobre fondos cambiantes.** Sobre superficies desenfocadas o translucidas, no uses gris plano: usa mas contraste, un peso ligeramente mayor y un pequeno aumento de letter-spacing. Pon el color en una capa solida, no en el primer plano translucido.
- **Efectos de borde de scroll, no divisores duros.** En lugar de un borde de 1px bajo una cabecera pegajosa, funde una pequena mascara de desenfoque/degradado donde el contenido se encuentra con el chrome flotante, y solo donde la UI flotante solape contenido de verdad.
- **Materializa, no solo fundas.** En superficies de cristal/desenfoque, anima el radio de desenfoque y la escala juntos al entrar y salir, para que la superficie se lea como un material real que llega y no como un fundido de opacidad plano.

```css
.toolbar {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  border-top: 1px solid rgba(255, 255, 255, 0.4); /* borde superior brillante = luz sobre el material */
}
```

## 13. Feedback multimodal — movimiento + sonido + haptica

Tres reglas para combinar sentidos (de *Designing Audio-Haptic Experiences*):

1. **Causalidad** — tiene que ser obvio que ha causado el feedback. Dispáralo en el evento causal real (el toggle girando, el elemento encajando), y ajusta su caracter a la fisicalidad de la accion.
2. **Armonia** — lo visual, el sonido y lo haptico deben dispararse en el **mismo fotograma**. La latencia entre ellos destruye la ilusion. No dejes que una transicion CSS vaya por detras del audio o de la Vibration API.
3. **Utilidad** — anade feedback solo donde se lo gane. Reserva haptica y sonido para momentos con significado (exito, error, confirmacion, encaje). El exceso de feedback entrena al usuario para ignorarlo todo.

## 14. Movimiento reducido y accesibilidad

Movimiento reducido no significa *nada* de feedback: significa un equivalente mas suave y no vestibular. Responde a tres senales independientes y horneálas en tus componentes:

- **`prefers-reduced-motion: reduce`** — sustituye deslizamientos/muelles/parallax por **fundidos cruzados** cortos de opacidad o transiciones estaticas. Quita elasticidad y sobrepaso. Conserva los cambios de opacidad/color que ayudan a comprender.
- **`prefers-reduced-transparency: reduce`** — vuelve solidas las superficies translucidas: sube la opacidad del fondo, quita el desenfoque.
- **`prefers-contrast: more`** — fondos casi solidos con un borde definido y contrastado.

Ademas: evita fondos en movimiento a pantalla completa, oscilaciones lentas en bucle (cerca de 0.2 Hz, un ciclo cada 5s) y saltos bruscos de brillo (suaviza los cambios de tema claro/oscuro). Haz semitransparentes los objetos grandes mientras viajan, y funde a la salida las superficies grandes durante un reposicionamiento amplio, volviendolas a mostrar al asentarse.

```css
@media (prefers-reduced-motion: reduce) {
  .sheet { transition: opacity 200ms ease; transform: none !important; }
}
@media (prefers-reduced-transparency: reduce) {
  .toolbar { background: white; backdrop-filter: none; }
}
```

## 15. Tipografia — tamano optico, tracking, interlineado

Apple disena la tipografia para que cambie de forma con el tamano; la misma disciplina aplica en web. (De *The Details of UI Typography*, WWDC 2020.)

- **El tracking (letter-spacing) es especifico del tamano; nunca un valor unico para todos.** El texto grande de display quiere tracking *negativo* (las letras se leen demasiado separadas al crecer); el texto pequeno quiere un poco *positivo* por legibilidad. Un `letter-spacing` fijo esta mal en algun sitio. Aprieta los titulares, deja el cuerpo cerca de `0`.
- **El interlineado va inverso al tamano.** Apretado en titulares grandes, mas suelto en el cuerpo. Aumentalo para escrituras con ascendentes/descendentes altas; aprietalo en UI densa de mucha informacion.
- **Construye la jerarquia con peso + tamano + interlineado como conjunto,** no solo con el tamano. Enfatiza con el peso: anade presencia sin ocupar mas espacio.
- **Respeta el ajuste de tamano de texto del usuario** (Dynamic Type). Escala el layout *con* el texto: espaciados en `rem`/`em`, no en px fijos, para que una fuente mayor no rompa la maqueta.
- **Por defecto, la fuente del sistema** antes que una tipografia propia; ya trae tamano optico, tablas de tracking y ajuste de legibilidad. Sobreescríbela solo con un motivo.

```css
:root { font: 100%/1.5 system-ui, sans-serif; } /* cuerpo: fuente del sistema, interlineado comodo */

.display {
  font-size: clamp(2rem, 5vw, 4rem);
  line-height: 1.05;        /* interlineado apretado para texto grande */
  letter-spacing: -0.02em;  /* tracking negativo al crecer */
  font-optical-sizing: auto;
}
```

## 16. Fundamentos de diseno — los ocho principios

El movimiento y el oficio de arriba sirven a los ocho principios de diseno de Apple (*Principles of Great Design*, WWDC 2026). Usalos como los nombres con los que razonas:

1. **Proposito.** Construye con intencion; decide que *no* construir. Cada funcionalidad pide tiempo, atencion y confianza del usuario: gasta ese presupuesto solo donde compense.
2. **Agencia.** Manten a la gente al mando: ofrece opciones, no fuerces un unico camino. Respáldalo con indulgencia: deshacer facil para los resbalones, y dialogo de confirmacion solo para lo genuinamente destructivo e irreversible (con moderacion; abusar entrena a la gente a hacer clic sin leer).
3. **Responsabilidad.** Actua en interes del usuario. Privacidad: pide en el momento adecuado, solo lo necesario, con transparencia. Seguridad: anticipa el mal uso y el dano, sobre todo con IA (una app de recetas consciente de alergias no debe sugerir un ingrediente peligroso). Anade vistas previas, confirmaciones y avisos; elimina una funcionalidad cuyo riesgo supere su valor.
4. **Familiaridad.** Construye sobre lo que la gente ya sabe. Usa metaforas que no sean ni demasiado literales ni demasiado abstractas (una papelera significa borrar), y respeta su fisica. Se consistente: lo que se ve igual debe comportarse igual y vivir en el mismo sitio (cerrar siempre arriba a la izquierda en macOS) para que la gente pueda predecir lo que pasa. Rompe un patron familiar solo si puedes demostrar que es mejor, y entonces pruebalo, no lo supongas.
5. **Flexibilidad.** Disena para contextos, dispositivos y todo el rango de capacidades. Adaptate a la plataforma (iPhone = tacto rapido; escritorio = flujos profundos con puntero preciso) y a la situacion. Disena de forma inclusiva (edad, idioma, experiencia, accesibilidad). Cuando ningun layout unico sirva para todos, deja personalizar: reordenar controles, ocultar lo que no se usa.
6. **Simplicidad, que no minimalismo.** Quita lo innecesario para que brille el proposito central; enterrarlo todo en un sitio parece minimal pero no es simple. Se conciso (lenguaje llano, sin jerga, menos pasos) y claro (usa jerarquia — orden, espaciado, contraste — para que lo mas importante sea lo mas obvio). Cada elemento se gana su sitio; a veces *anadir* contexto simplifica (una barra de video que muestra el tiempo restante). Ensena primero el camino comun, y las opciones avanzadas un nivel mas abajo.
7. **Oficio.** La atencion al detalle sin concesiones genera confianza. Tipografia bonita, colores que se adaptan a claro/oscuro, iconografia clara y animaciones responsivas que dan feedback inmediato y natural. Nada es aleatorio: cada valor de espaciado, tiempo y alineacion es una decision deliberada que puedes defender. Un scroll con tirones, iconos desalineados y maquetas que rompen al rotar se leen como descuido. El oficio necesita iteracion y longevidad: sigue evolucionando el diseno segun cambian funcionalidades y hardware.
8. **Deleite.** El resultado de acertar en los otros siete, no confeti pegado encima. Decide que emocion quieres que sienta la gente (calma, confianza, emocion) y refuerzala en cada decision.

Reglas tacticas que sirven a estos principios:

- **El feedback viene en cuatro tipos:** estado, finalizacion, aviso y error. Confirma las acciones con significado, expon el estado en curso, avisa antes de los problemas, valida en linea (no al enviar).
- **Orientacion.** Cada pantalla debe responder: donde estoy? adonde puedo ir? que hay alli? como salgo? Nunca atrapes al usuario.
- **Agrupacion y mapeo.** La proximidad implica relacion; coloca un control cerca de lo que afecta y ordena los controles reflejando lo que cambian. Si necesitas una etiqueta para explicar un control, el mapeo es debil.
- **Etiquetas directas y especificas antes que genericas y seguras.** Nombra los elementos de navegacion por su contenido ("Progreso", "Biblioteca"), no con paraguas vagos ("Inicio"). La especificidad crea previsibilidad.

## 17. Proceso

- **Prototipa de forma interactiva: una demo interactiva vale "un millon de disenos estaticos".** Descubres la interfaz construyendola y jugando con ella; un prototipo que funciona ademas fija un liston concreto que evita una implementacion final mediocre.
- **Disena la interaccion y lo visual a la vez.** "No deberia poder distinguirse donde acaba una y empieza lo otro." El movimiento no es una capa que se anade despues de los pixeles.
- **Prueba con personas reales en contexto real**, y revisa el movimiento con ojos frescos: reproducelo a camara lenta o fotograma a fotograma para cazar lo que es invisible a velocidad normal.

## Referencia rapida

| Necesidad | Tecnica | Valor concreto |
| --- | --- | --- |
| Muelle de UI por defecto | Criticamente amortiguado, sin sobrepaso | `damping 1.0`, `response 0.3-0.4` |
| Muelle de inercia / flick | Subamortiguado, rebote leve | `damping ~0.8`, `response 0.3-0.4` |
| Gesto → velocidad del muelle | Traspasa la velocidad de soltado | `velocidadGesto / (destino - actual)` si va normalizada |
| Punto de aterrizaje de un flick | Proyecta la inercia | `actual + (v/1000)·d/(1-d)`, `d ~ 0.998` |
| Interrumpir limpiamente | Arranca desde el valor de presentacion (vivo) | lee el transform en pantalla |
| Evitar el "muro" al invertir | Arrastra la velocidad al reapuntar | muelle que mezcla velocidad |
| Transicion reversible | Refleja la curva de easing | cubic-bezier inverso |
| Decidir invertir o confirmar | Usa el **signo** de la velocidad, no la posicion | al soltar |
| Arrastre 1:1 | Pointer Events + captura | respeta el offset del agarre |
| Feedback | Al pulsar, continuo | nunca solo al final |
| Limite | Rubber-band, no parón duro | resistencia progresiva |
| Chrome translucido | Capa con `backdrop-filter` | el contenido pasa por debajo |
| Tracking tipografico | Especifico del tamano, nunca fijo | aprieta el texto grande (`-0.02em`), cuerpo cerca de `0` |
| Movimiento reducido | Fundido cruzado, no deslizamiento ni muelle | `@media (prefers-reduced-motion)` |
