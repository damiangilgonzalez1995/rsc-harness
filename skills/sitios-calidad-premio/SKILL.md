---
name: sitios-calidad-premio
description: "Art-direct and implement marketing, editorial, portfolio, and landing sites that are distinctive and motion-rich, with original imagery inspired by references, standout heroes, GSAP choreography, a single smooth-scroll engine, optional Three.js shaders, honest icon and logo sourcing, photographic avatars, accessibility, and performance safeguards. Use when asked for an award-quality, premium, cinematic, interactive, high-concept, or motion-driven website."
tags: ["award-site", "gsap", "webgl", "art-direction"]
profiles: [ui, full]
---

# Construir sitios de calidad de premio

Construye un sitio cohesionado y memorable donde la idea visual, el material, la tipografia y el movimiento cuenten la misma historia. Trata "calidad de premio" como un liston de aceptacion, nunca como una afirmacion de haber ganado un premio o un reconocimiento.

## 1. Fija la direccion de arte

- Inspecciona por completo el material de referencia del usuario antes de implementar. Extrae solo rasgos de alto nivel: jerarquia, ritmo, contraste, tratamiento de imagen y principios de movimiento.
- Genera una identidad, layout, sistema de textos, imagenes y lenguaje de interaccion materialmente nuevos. Nunca reutilices, calques ni reproduzcas de cerca assets, capturas, codigo fuente, identidad o textos de la referencia.
- Selecciona y nombra al menos una skill de diseno web compatible que tengas instalada. Sigue el conjunto relevante mas pequeno y evita combinar sistemas esteticos sin relacion.
- Escribe una direccion compacta antes de picar codigo: tesis visual, asset focal del hero, jerarquia tipografica, sistema de color, secuencia de secciones, narrativa de movimiento, motor de scroll suave elegido, decision sobre Three.js y plan de procedencia de assets.

## 2. Construye un sistema de assets honesto

- Genera imagenes originales de hero o de proyecto cuando mejoren materialmente el concepto. Usa material con licencia adecuada cuando sea mas fuerte, y deja constancia de la procedencia en el codigo del sitio.
- No dibujes ilustraciones con SVG, CSS o rutas de canvas escritas por el modelo. Usa recortes PNG transparentes originales, generados o con licencia adecuada, para los elementos ilustrativos. Si se permiten marcas de marca simples, iconos de interfaz, graficos de datos y un canvas de shader justificado.
- Usa fotografias para todos los avatares. Prefiere fotos aportadas o con licencia adecuada; nunca entregues iniciales, cabezas ilustradas, siluetas sin rostro ni personas generadas presentadas como clientes, empleados o avaladores reales.
- Usa iconos Solar a traves de Iconify para los simbolos de interfaz. Usa los logos SVG de Iconify solo para marcas reales legitimas en contextos veraces. Usa Logo Ipsum solo para especimenes de marcas ficticias declarados explicitamente como tales, nunca como prueba de clientes. Omite el muro de logos cuando no exista prueba honesta.
- Define relaciones de aspecto deliberadas, comportamiento de recorte, texto alternativo, comportamiento de carga y respaldos para material que falte. Evita imagenes de archivo genericas, mockups copiados, marcas de agua y material decorativo sin papel narrativo.

## 3. Compon el hero

- Haz del primer viewport el momento mas fuerte del sitio. Combina un mensaje claro y un CTA con imagen original, video, interaccion que responde al puntero o una escena justificada de Three.js.
- Crea una secuencia de introduccion coreografiada con GSAP para el hero. Manten la navegacion, el mensaje principal y el CTA legibles y usables antes de que termine la animacion.
- Haz que los efectos de puntero sean aditivos. Soporta tactil, teclado, punteros gruesos, perdida de foco de la ventana y cambios de visibilidad sin dejar la interfaz a medias.
- Disena un primer fotograma estatico que siga estando completo cuando no haya JavaScript, ni reproduccion de medios, ni WebGL, ni movimiento.

## 4. Construye el sistema de movimiento

- Usa GSAP como sistema de animacion principal.
- Evalua Lenis y Locomotive Scroll y elige exactamente uno como unico motor de scroll suave del sitio. Nunca instales ni inicialices los dos. Conecta bien el motor elegido a GSAP ScrollTrigger, refresca las mediciones tras cambios de material y de fuentes, y destruyelo en la limpieza.
- Saltate el scroll suave y las lineas de tiempo con scrub bajo `prefers-reduced-motion: reduce`. Renderiza los estados finales de inmediato en vez de limitarte a acortar las animaciones.
- Coreografia la pagina seccion a seccion. Revela los titulares importantes palabra a palabra con un escalonado contenido, y luego secuencia el texto de apoyo y el material.
- Preserva un nombre accesible sin partir para el texto escalonado. Oculta a la tecnologia asistiva las palabras decorativas partidas, nunca partas enlaces ni marcado en linea con significado, y manten el contenido sin partir visible sin JavaScript.
- Usa CSS para los estados simples de hover, foco y pulsacion. Reserva ScrollTrigger para las secuencias con scrub o fijadas que lo justifiquen, y evita que dos sistemas controlen la misma propiedad.

## 5. Anade Three.js solo con proposito

- Usa Three.js y shaders WebGL propios cuando la profundidad espacial, la transicion de textura, el desplazamiento o la respuesta al puntero apoyen materialmente la direccion de arte. No metas un shader como ruido decorativo de fondo.
- Dale al canvas una unica responsabilidad clara y mantenlo subordinado al contenido semantico y a los controles.
- Limita la densidad de pixeles del dispositivo, pausa el renderizado fuera de pantalla o cuando el documento esta oculto, estrangula la entrada de puntero y evita reservar memoria en cada fotograma.
- Aporta un poster estatico y sustituye el canvas por completo bajo movimiento reducido o si falla WebGL.
- Libera fotogramas de animacion, observadores, listeners, targets de render, texturas, geometrias, materiales y el renderer. Maneja la perdida de contexto sin romper el contenido de la pagina.

## 6. Alcanza el liston de calidad

- Construye una pagina semantica completa, no un concepto de solo hero. Incluye navegacion responsive, progresion coherente de secciones, contenido concreto de conversion, CTA final, pie, estados robustos de formularios o controles cuando existan, y foco de teclado visible.
- Exige una idea de direccion de arte distintiva, un primer viewport memorable, tipografia y espaciado disciplinados, recortes de imagen intencionados, transiciones coreografiadas y comportamiento refinado de hover, foco, activo, carga, deshabilitado, error, tactil y movimiento reducido.
- Preserva el rendimiento con material responsive, carga diferida por debajo del pliegue, transforms acotados, desenfoque limitado, trabajo de canvas con tope y nada animandose continuamente fuera de pantalla.
- Rechaza las manchas de degradado genericas, las rejillas bento ornamentales, el cristal aplicado en todas partes, los layouts de componente de plantilla, los testimonios falsos, las colaboraciones inventadas, el teatro del muro de logos y el movimiento sin papel narrativo.
- Nunca describas el resultado como premiado ni reconocido salvo que el usuario aporte evidencia verificable.

## 7. Valida antes de entregar

- Ejecuta la construccion de produccion y arregla cada fallo.
- Revisa la pagina en tamanos de escritorio y movil cuando se pida validacion en navegador o haga falta para resolver un bloqueo.
- Verifica la navegacion por teclado, el foco visible, el comportamiento tactil, el contenido sin JavaScript, los respaldos estaticos de material y el comportamiento con `prefers-reduced-motion`.
- Comprueba que solo hay un motor de scroll suave instalado e inicializado, que la integracion con ScrollTrigger es correcta y que todos los recursos de animacion y WebGL se liberan.
- Busca en el contenido renderizado y en el codigo marcadores sin sustituir, identidad copiada de la referencia, afirmaciones sin respaldo, logos enganosos, material sin acreditar y texto partido inaccesible.
- Reporta la skill de diseno web elegida, las fuentes de los assets, el stack de movimiento, la decision sobre Three.js, la validacion realizada y cualquier limitacion que quede.
