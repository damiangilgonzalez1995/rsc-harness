---
name: video-a-superprompt
description: "Turns a reference video into a highly detailed recreation or inspiration prompt. Use when the user provides, mentions, uploads, links, or points to a video and asks to analyze the design, UI, animations, transitions, scroll interactions, typography, colors, assets, WebGL/Three.js, narrative, or section-by-section behavior, or to create a prompt or article that recreates the page, app, interaction, or motion system."
tags: ["video-analysis", "prompt-engineering", "design"]
---

# De video a superprompt

## Objetivo

Convertir cualquier video de referencia utilizable en un prompt listo para construir que capture lo que el video muestra, como se mueve, como debe reconstruirse y que assets o material generado hacen falta. La salida por defecto es un unico prompt listo para pegar, salvo que el usuario pida un articulo, un pack de assets o una implementacion.

## Flujo

1. **Localiza el video fuente.**
   - Acepta rutas locales, ficheros subidos, URLs, videos visibles en el navegador, assets de un articulo o material del repo.
   - Si el video se referencia pero no es accesible, pide el fichero o la URL exactos antes de inventarte detalles.
   - Si el usuario quiere una recreacion exacta, inspecciona el HTML/CSS/JS fuente o la pagina local conectada al video antes de escribir el prompt.

2. **Inspecciona el video tecnicamente.**
   - Para ficheros locales, ejecuta `ffprobe` para duracion, dimensiones, fotogramas por segundo, codec y tamano.
   - Extrae fotogramas representativos con `ffmpeg`, favoreciendo los momentos clave de la linea de tiempo antes que miniaturas uniformes.
   - Pasada rapida sugerida:
     ```bash
     ffprobe -v error -show_entries format=duration,size:stream=width,height,r_frame_rate -of json "$VIDEO"
     mkdir -p /tmp/video-frames
     ffmpeg -y -i "$VIDEO" -vf fps=1 /tmp/video-frames/frame-%03d.jpg
     ```
   - En videos largos o con mucho scroll, extrae ademas el principio, el medio, el final y los momentos de transicion visibles.

3. **Analiza por capas.**
   - **Historia**: proposito de la pagina o app, arco emocional, orden de secciones, transicion entre tiempos.
   - **Pantalla y layout**: encuadre del viewport, rejillas, zonas pegajosas, tarjetas, medios, capas superpuestas, margenes, navegacion, pie.
   - **Movimiento**: tiempos de revelado, easing, parallax, mascaras, secciones fijadas, scroll con scrub, estados hover y tap, movimiento ambiental en bucle, movimientos de camara.
   - **Diseno visual**: tipografia, paleta, superficies, bordes, sombras, textura, iconografia, tratamiento de imagen y video.
   - **Reconstruccion tecnica**: CSS y APIs nativas, IntersectionObserver, Web Animations API, GSAP ScrollTrigger, Lenis, Framer Motion / Motion One, Three.js / WebGL, canvas, scrub de `video.currentTime`, carruseles u otras librerias del dominio.
   - **Accesibilidad y rendimiento**: movimiento reducido, comportamiento en movil, estados tactiles y de teclado, carga diferida, precarga de video, tope de densidad de pixeles, respaldos estaticos.

4. **Planifica los assets.**
   - Produce un mapa de assets. Incluye las URLs exactas cuando se aporten, nombres de fichero locales cuando se usen, o nombres de marcador cuando todavia haya que generarlos.
   - Si hacen falta assets de IA, crea prompts separados para planchas de imagen, clips de video, elementos WebGL/canvas, posters, sprites, mascaras y capas de textura.
   - Si el usuario nombra modelos o APIs concretos, conservalos exactamente en el prompt y separa los prompts de imagen de los de video.

5. **Escribe el superprompt.**
   - Usa un unico bloque `text` con cercas para el prompt listo para pegar, salvo que el usuario pida otro formato.
   - Empieza por lo que hay que construir y el limite de la referencia: recreacion exacta frente a adaptacion inspirada.
   - Incluye: mapa de assets, marca y contenido, lenguaje de diseno global, reglas de layout, anatomia seccion a seccion, sistema de movimiento, sistema de scroll, comportamiento del video, comportamiento WebGL/Three.js, requisitos responsive, accesibilidad y rendimiento, y antipatrones.
   - Para cada seccion importante, especifica proposito, layout, detalles visuales, animacion, interacciones, comportamiento de scroll, eleccion de libreria o API, y respaldo para movimiento reducido.
   - Evita frases vagas tipo "que quede bonito", "animacion parecida" o "transiciones agradables". Convierte el gusto en instrucciones concretas de construccion.

6. **Verifica antes de dar por hecho.**
   - Comprueba que todas las rutas y URLs de assets del prompt existen o estan claramente marcadas como marcadores.
   - Si creaste capturas o fotogramas, confirma que los ficheros no estan vacios y son representativos.
   - Si escribes un articulo o un artefacto del repo, respeta las instrucciones del espacio de trabajo local y manten el area de staging acotada.

## Modos de salida

- **Solo prompt**: entrega el prompt listo para pegar y, cuando ayude, un mapa de assets corto encima.
- **Articulo**: crea `content.md` mas las evidencias locales de fotogramas y video, el manifiesto y los prompts.
- **Brief de implementacion**: anade un plan de construccion y una lista de QA despues del prompt.
- **Pack de generacion de assets**: separa los prompts en imagenes de fondo, clips de video, sprites/WebGL, posters y prompt final de pagina.

## Liston de calidad

- El prompt debe ser lo bastante largo como para reconstruir la interaccion sin haber visto el video original.
- Debe preservar la secuencia, el ritmo y las peculiaridades notables del video.
- Debe nombrar los mecanismos de movimiento exactos: seccion fijada, linea de tiempo con scrub, `video.currentTime`, capa de parallax, revelado por opacidad, transform, mascara, shader, campo de particulas, estado hover o fisica de carrusel.
- Debe incluir siempre el comportamiento en movil y el de movimiento reducido.
- Debe senalar que evitar, sobre todo secciones genericas de landing, manchas decorativas, material de archivo que no encaja, video con reproduccion automatica cuando hace falta scrub por scroll, y solapamiento de texto.

## Referencias

- Lee `references/superprompt-template.md` al escribir el prompt final de cero o cuando el usuario pida "el prompt detallado completo".
