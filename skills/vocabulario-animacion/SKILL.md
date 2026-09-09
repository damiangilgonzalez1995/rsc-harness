---
name: vocabulario-animacion
description: "Use when someone describes a web motion effect without knowing its name (\\"that bouncy thing when a popover opens\\", \\"the iOS rubber-band scroll\\") and asks \\"what's it called when...\\". Returns the exact term so it can be requested from an AI or a designer. This is for NAMING an effect, not designing or building one."
tags: ["animation", "vocabulary", "reference"]
---

# Vocabulario de animacion

Convierte una descripcion vaga de un movimiento o efecto en el termino preciso, para que el usuario sepa que pedir.

Los terminos se mantienen en INGLES a proposito: es el vocabulario con el que se le habla a una IA, a una libreria de animacion o a un disenador. La explicacion va en espanol.

## Arranque rapido

El usuario describe un efecto vagamente. Tu devuelves el termino o terminos que encajan, con este formato:

```
**Stagger** — Anima varios elementos uno tras otro con un pequeno retardo entre cada uno, creando una cascada.
```

Si encajan varios terminos, lista primero el mejor y luego 1-2 alternativas con una linea sobre en que se diferencian.

## Instrucciones

1. **Lee la intencion, no las palabras clave.** El usuario describe lo que *ve* o *siente* ("elastico", "se desliza fuera", "se dibuja solo"), no el nombre tecnico. Mapea la sensacion al glosario de abajo.
2. **Cita el glosario tal cual.** Sus descripciones son la referencia: usalas como estan, no las parafrasees.
3. **Desambigua terminos cercanos.** Cuando compiten dos (*Clip-path* vs *Mask*, *Pop in* vs *Bounce*, *Shared element transition* vs *Layout animation*), contrastalos para que el usuario elija.
4. **Cuando nada encaja exactamente,** nombra el termino mas cercano y di claramente que es una aproximacion, o describe el efecto con el vocabulario del glosario (p. ej. "eso es un *stagger* de entradas *scale-in*").
5. **No salgas de este glosario.** Si un termino de verdad no esta aqui, dilo en vez de inventarlo; puedes explicar el concepto con estas palabras.
6. **Se breve.** Una pregunta de nombres quiere un nombre, no un ensayo. Empieza por el termino; amplia solo si te lo piden.

**Ejemplo 1 — basado en sensacion**
Usuario: "Como se llama cuando un popover parece crecer desde el boton que has pulsado y no desde su centro?"
Salida:
```
**Origin-aware animation** — Un elemento se anima saliendo de su disparador, como un popover que crece desde el boton que lo abrio en vez de desde su propio centro, que es lo que hace CSS por defecto.
```

**Ejemplo 2 — desambiguacion**
Usuario: "Eso de que una imagen se convierte en otra imagen."
Salida:
```
**Morph** — Una forma se convierte suavemente en otra, p. ej. la Dynamic Island.

Alternativas cercanas:
- **Crossfade** — si simplemente se funden una sobre otra en el mismo sitio.
- **Shared element transition** — si un elemento viaja y se transforma de una posicion a otra.
```

**Ejemplo 3 — sensacion fisica**
Usuario: "Ese scroll de iOS que se resiste y vuelve de golpe cuando tiras de mas."
Salida:
```
**Rubber-banding** — Resistencia y vuelta de golpe al arrastrar mas alla de un limite (la sensacion de overscroll de iOS).
```

## Glosario

### Entradas y salidas — como aparecen y desaparecen los elementos
- **Fade in / Fade out** — El elemento aparece o desaparece cambiando la opacidad.
- **Slide in** — El elemento entra deslizandose desde fuera de pantalla (izquierda, derecha, arriba o abajo).
- **Scale in** — El elemento crece de pequeno a tamano completo al aparecer, a menudo junto con un fundido.
- **Pop in** — El elemento aparece con un ligero sobrepaso, como si rebotara hasta su sitio.
- **Reveal** — El contenido se descubre gradualmente, normalmente animando un clip-path o una mascara.
- **Enter / Exit** — La animacion que reproduce un elemento al anadirse o quitarse de la pantalla.

### Secuenciacion y tiempos — coordinar varios elementos o momentos
- **Keyframes** — Puntos definidos de una animacion (0%, 50%, 100%) cuyos huecos rellena el navegador.
- **Interpolation / Tween** — Generar todos los fotogramas intermedios entre un valor inicial y uno final, para que el movimiento sea continuo.
- **Stagger** — Animar varios elementos uno tras otro con un pequeno retardo entre cada uno, creando una cascada.
- **Orchestration** — Cronometrar deliberadamente varias animaciones para que se sientan como un unico movimiento coordinado.
- **Delay** — Tiempo antes de que arranque una animacion.
- **Duration** — Cuanto dura una animacion.
- **Fill mode** — Si un elemento conserva los estilos de su primer o ultimo fotograma antes de empezar o despues de acabar (p. ej. forwards).
- **Stepped animation** — Animacion dividida en pasos discretos, como una cuenta atras.

### Movimiento y transformaciones — cambiar posicion, tamano o angulo
- **Translate** — Mover un elemento por el eje X o Y.
- **Scale** — Hacer un elemento mas grande o mas pequeno.
- **Rotate** — Girar un elemento alrededor de un punto.
- **Skew** — Inclinar un elemento en X o Y, sacandolo de su forma rectangular.
- **3D tilt / Flip** — Rotar en el espacio 3D (rotateX / rotateY) para anadir profundidad.
- **Perspective** — Cuanto se nota el efecto 3D: un valor mas bajo exagera la profundidad, como si el espectador estuviera mas cerca.
- **Transform origin** — El punto de anclaje desde el que crece o gira una escala o rotacion.
- **Origin-aware animation** — Un elemento se anima saliendo de su disparador, como un popover que crece desde el boton que lo abrio en vez de desde su propio centro, que es el defecto de CSS.

### Transiciones entre estados — conectar un estado, vista o elemento con otro
- **Crossfade** — Un elemento se funde a la salida mientras otro se funde a la entrada, en el mismo sitio.
- **Continuity transition** — Un cambio que mantiene orientado al usuario conectando visualmente el antes y el despues. Por ejemplo, agrandar y encoger el mismo rectangulo.
- **Morph** — Una forma se convierte suavemente en otra, p. ej. la Dynamic Island.
- **Shared element transition** — Un elemento viaja y se transforma de una posicion a otra, como una miniatura que se expande hasta ser una tarjeta.
- **Layout animation** — Cuando cambia el tamano o la posicion de un elemento, se anima hasta el nuevo sitio en vez de saltar.
- **Accordion / Collapse** — Una seccion expande y colapsa su altura suavemente para mostrar u ocultar contenido.
- **Direction-aware transition** — El contenido se desliza hacia un lado al avanzar y hacia el contrario al volver, para que la navegacion tenga sentido de direccion.

### Scroll — movimiento ligado al desplazamiento o a la navegacion
- **Scroll reveal** — Los elementos se funden o deslizan a su sitio al entrar en el viewport.
- **Scroll-driven animation** — Animacion cuyo progreso esta atado directamente a la posicion del scroll.
- **Parallax** — Fondo y primer plano se mueven a velocidades distintas al hacer scroll, creando profundidad.
- **Page transition** — Animacion que se reproduce al navegar de una pagina o ruta a otra.
- **View transition** — El navegador transforma una vista en otra, conectando los elementos compartidos.

### Feedback e interaccion — responder a las acciones del usuario
- **Hover effect** — Cambio visual cuando el cursor pasa sobre un elemento.
- **Press / Tap feedback** — Una reduccion sutil de escala al pulsar, para que se sienta fisico.
- **Hold to confirm** — Un efecto de progreso que se rellena mientras el usuario mantiene pulsado.
- **Drag** — Mover un elemento agarrandolo, a menudo con inercia al soltarlo.
- **Drag to reorder** — Arrastrar elementos de una lista para reordenarlos mientras los demas se apartan para hacer sitio.
- **Swipe to dismiss** — Arrastrar un elemento fuera de pantalla para cerrarlo, como un drawer o un toast.
- **Rubber-banding** — Resistencia y vuelta de golpe al arrastrar mas alla de un limite (el overscroll de iOS).
- **Shake / Wiggle** — Una sacudida rapida de lado a lado que senala un error o una entrada rechazada.
- **Ripple** — Un circulo que se expande desde el punto de pulsacion, confirmando la pulsacion.

### Easing — como cambia la velocidad a lo largo de una animacion
- **Easing** — El ritmo al que una animacion acelera o frena.
- **Ease-out** — Empieza rapido, acaba lento. El defecto para casi toda la UI y para cualquier cosa que responda al usuario.
- **Ease-in** — Empieza lento, acaba rapido. Normalmente se evita; se siente pesado.
- **Ease-in-out** — Lento, rapido, lento. Bueno para elementos ya en pantalla que se mueven de A a B.
- **Linear** — Velocidad constante. Evitalo en UI; reservalo para spinners o marquesinas.
- **Cubic-bezier** — Una curva de easing propia que defines para control preciso.
- **Asymmetric easing** — Curva que acelera y frena a ritmos distintos. Se siente mas viva que una simetrica.

### Muelles (springs) — movimiento basado en fisica, alternativa al easing de duracion fija
- **Spring** — Movimiento gobernado por fisica (tension, masa, amortiguacion) en vez de por una duracion fijada.
- **Stiffness / Tension** — Con cuanta fuerza tira el muelle hacia su destino. Mas alto se siente mas seco y rapido.
- **Damping** — Con cuanta rapidez se asienta un muelle. Menos amortiguacion significa mas rebote y oscilacion.
- **Mass** — Cuanto pesa el elemento animado. Mas masa lo hace mas lento y pesado.
- **Bounce** — Un muelle que sobrepasa y se asienta, anadiendo un caracter jugueton.
- **Perceptual duration** — Cuanto tarda un muelle en *parecer* terminado, aunque por debajo siga micro-asentandose.
- **Momentum** — Movimiento que arrastra velocidad, sobre todo tras un arrastre o una interrupcion.
- **Velocity** — A que velocidad y en que direccion se mueve un elemento. Un muelle la lleva a la siguiente animacion al interrumpirse, asi que un elemento lanzado conserva su velocidad.
- **Interruptible animation** — Animacion que se puede redirigir suavemente en pleno vuelo en vez de tener que terminar antes.

### Bucles y movimiento ambiental — animaciones que corren solas
- **Marquee** — Texto o contenido que se desplaza continuamente en bucle.
- **Loop** — Animacion que se repite, un numero de veces o infinitamente.
- **Alternate (yoyo)** — Un bucle que va hacia delante y luego se invierte en cada iteracion, en vez de saltar al principio.
- **Orbit** — Un elemento girando alrededor de otro en una trayectoria continua.
- **Pulse** — Un cambio suave y repetido de escala u opacidad para llamar la atencion.
- **Float** — Una deriva suave y continua arriba y abajo que hace que un elemento estatico parezca vivo e ingravido.
- **Idle animation** — Movimiento sutil que se reproduce mientras un elemento esta ahi parado, esperando interaccion.

### Pulido y efectos — los detalles que separan lo bueno de lo excelente
- **Blur** — Filtro de desenfoque para suavizar un elemento o disimular imperfecciones minimas.
- **Clip-path** — Recortar un elemento a una forma; se usa para reveals, mascaras y sliders de antes/despues.
- **Mask** — Ocultar o revelar partes de un elemento con una forma o un degradado; como clip-path, pero con bordes suaves y difuminables.
- **Before / after slider** — Un divisor arrastrable que barre entre dos imagenes superpuestas para compararlas.
- **Line drawing** — Un path SVG que se dibuja solo, como si un boligrafo invisible lo trazara.
- **Text morph** — Texto que se anima caracter a caracter al cambiar, llamando la atencion sobre el valor nuevo.
- **Skeleton / Shimmer** — Un marcador de posicion con un brillo en movimiento mientras carga el contenido.
- **Number ticker** — Digitos que ruedan o cuentan hasta un valor.
- **Tabular numbers** — Digitos de ancho fijo para que los numeros no bailen al cambiar. Imprescindible en tickers, temporizadores y contadores.
- **Typewriter** — Texto que aparece caracter a caracter, como si se estuviera escribiendo.

### Rendimiento — lo que mantiene el movimiento fluido en vez de a tirones
- **Frame rate (FPS)** — Fotogramas dibujados por segundo. 60fps es la base de un movimiento fluido; 120fps en pantallas modernas.
- **Jank** — Tiron visible cuando el navegador pierde fotogramas porque no llega.
- **Dropped frame** — Fotograma que el navegador no llego a dibujar a tiempo, causando un microtiron.
- **Compositing** — Dejar que la GPU mueva o funda un elemento en su propia capa sin rehacer layout ni pintado.
- **will-change** — Pista CSS de que un elemento va a animarse, para que el navegador lo promocione a su propia capa por adelantado.
- **Layout thrashing** — Animar propiedades como width, height, top o left, que obligan al navegador a recalcular el layout en cada fotograma y provocan jank.

### Principios que hay que saber — cuando y como animar
- **Purposeful animation** — El movimiento debe cumplir una funcion (orientar, dar feedback, mostrar relaciones), no solo decorar.
- **Anticipation** — Un pequeno impulso en direccion contraria antes de un movimiento, insinuando lo que va a pasar.
- **Follow-through** — Partes de un elemento siguen moviendose y se asientan un poco despues de que pare el movimiento principal, anadiendo peso.
- **Squash & stretch** — Deformar un elemento al moverse para transmitir peso, velocidad y flexibilidad.
- **Perceived performance** — La animacion adecuada hace que una interfaz se sienta mas rapida, aunque no lo sea.
- **Frequency of use** — Cuanto mas a menudo ve el usuario una animacion, mas corta y sutil debe ser.
- **Spatial consistency** — Animar de forma que un elemento conserve su identidad y su posicion entre estados, para que el usuario nunca pierda de vista donde han ido las cosas.
- **Hardware acceleration** — Animar transform y opacity deja que la GPU mantenga el movimiento fluido.
- **Reduced motion** — Respetar el ajuste prefers-reduced-motion del usuario suavizando o eliminando el movimiento.
