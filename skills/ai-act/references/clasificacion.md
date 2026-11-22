# Clasificación: rol y nivel de riesgo

Pasos 1 y 2 de [`SKILL.md`](../SKILL.md). Verificado a 2026-11-21. Las fechas viven en [`calendario.md`](calendario.md).

## Rol

### Preguntas

Hazlas todas de una vez.

1. ¿Quién desarrolla el sistema, y con qué nombre o marca llega a sus usuarios?
2. ¿Lo usas tú en tu actividad profesional, lo vendes u ofreces a otros, o las dos cosas?
3. ¿El modelo es tuyo o lo llamas por API? Si lo afinas, ¿con cuánto cómputo frente al entrenamiento original?
4. ¿Lo publicas con licencia libre? ¿Cobras por él o lo operas tú para alguien?
5. ¿Hay usuarios, clientes o resultados que se usen en la UE?
6. ¿Para qué finalidad lo ofreces, y para qué lo usan de verdad tus clientes?

### De la respuesta al rol

| Situación | Rol | Artículo |
|---|---|---|
| Desarrolla el sistema, o lo encarga, y lo introduce en el mercado o lo pone en servicio con su nombre o marca, de pago o gratis | Proveedor | 3.3 |
| Usa un sistema de IA bajo su autoridad en una actividad profesional | Responsable del despliegue | 3.4 |
| Construye un sistema (chat, RAG, agente) sobre un modelo ajeno que llama por API | Proveedor posterior de un sistema; no es proveedor del modelo | 3.68 |
| Construye el sistema y además lo opera para sus usuarios | Proveedor y responsable del despliegue a la vez | 3.3 y 3.4 |
| Publica el sistema con licencia libre y de código abierto | Fuera del Reglamento, salvo que se introduzca en el mercado o se ponga en servicio como alto riesgo, o entre en el art. 5 o en el art. 50 | 2.12 |
| Introduce en la UE un sistema con marca de alguien de fuera de la UE | Importador | 3.6 |
| Pone el sistema a disposición en la UE sin ser proveedor ni importador | Distribuidor | 3.7 |

Matices:

- **Afinar un modelo.** Según las directrices de la Comisión, no vinculantes, quien modifica un modelo pasa a ser proveedor del modelo modificado solo si la modificación es significativa; el criterio indicativo es usar más de un tercio del cómputo de entrenamiento del modelo original.
- **Código abierto.** La exención del art. 2.12 no cubre el art. 50: a un chat con licencia libre que se pone en servicio se le aplica el aviso de IA. Que publicar una plantilla no convierta a su autor en proveedor de lo que otros construyan con ella es una lectura razonable, no un texto del Reglamento: quien la despliega asume su rol.
- **Ámbito territorial (art. 2.1).** Alcanza a proveedores que introducen el sistema en el mercado de la UE, estén donde estén; a responsables del despliegue en la UE; y a unos y otros de terceros países cuando el resultado del sistema se usa en la UE.
- **Exclusiones (art. 2).** Investigación y desarrollo científicos exclusivos (2.6); investigación, prueba y desarrollo antes de la introducción en el mercado, sin incluir las pruebas en condiciones reales (2.8); uso puramente personal y no profesional (2.10).

### Cuándo pasas a ser proveedor de un sistema de alto riesgo (art. 25.1)

Avisa siempre de esto a quien construye sobre un modelo genérico.

- a) Pones tu nombre o marca en un sistema de alto riesgo ya comercializado.
- b) Modificas sustancialmente un sistema de alto riesgo y sigue siéndolo.
- c) **Cambias la finalidad prevista de un sistema que no era de alto riesgo, incluido uno de uso general, de modo que pasa a serlo.** Usar un asistente genérico para cribar candidaturas o puntuar solvencia entra aquí.

El proveedor inicial debe cooperar con el nuevo, salvo que hubiera especificado claramente que su sistema no debe transformarse en uno de alto riesgo (art. 25.2). Lee las condiciones de uso del proveedor del modelo: si prohíben ese uso, esa cooperación no está garantizada.

## Nivel de riesgo

Recorre los cuatro niveles en orden. Se acumulan.

### Señales en el código

| Busca | Apunta a |
|---|---|
| SDK de un LLM, interfaz de chat, bot de voz | Art. 50.1 |
| Síntesis de voz, generación de imagen, vídeo o texto que se entrega o se publica | Art. 50.2; art. 50.4 si se publica |
| Generación de imagen, vídeo o audio de personas, clonación de voz, avatares | Art. 50.4; prohibiciones nuevas del art. 5 si faltan salvaguardas |
| Análisis de emociones sobre voz, texto o imagen | Art. 5.1.f en el trabajo o en centros educativos; anexo III, punto 1, en otros contextos; art. 50.3 |
| Biometría, reconocimiento o categorización de personas | Art. 5.1 e), g) y h); anexo III, punto 1 |
| Puntuaciones, rankings o decisiones sobre personas (candidatos, alumnos, clientes, solicitantes) | Anexo III; elaboración de perfiles |
| Herramientas del agente con efectos externos o irreversibles | Art. 14 si es de alto riesgo; buena práctica siempre |

El código rara vez dice la finalidad prevista. Pregúntala.

### 1. Prohibido (art. 5)

Aplicable desde el 2.2.2025, salvo las dos nuevas.

- a) Técnicas subliminales, manipuladoras o engañosas que alteran el comportamiento y causan o pueden causar un perjuicio considerable.
- b) Explotación de vulnerabilidades por edad, discapacidad o situación social o económica.
- c) Puntuación social con trato perjudicial injustificado o desproporcionado.
- d) Predicción del riesgo de delinquir basada solo en perfiles o rasgos de personalidad.
- e) Bases de datos de reconocimiento facial por extracción no selectiva de internet o de cámaras.
- f) Inferencia de emociones en el trabajo y en centros educativos, salvo motivos médicos o de seguridad.
- g) Categorización biométrica que deduce raza, opiniones políticas, afiliación sindical, creencias, vida u orientación sexual.
- h) Identificación biométrica remota en tiempo real en espacios públicos con fines policiales, con excepciones tasadas.
- **Nuevas, desde el 2.12.2026.** Sistemas que generan o manipulan imágenes, vídeo o audio realistas, íntimos o sexualmente explícitos, de una persona identificable sin su consentimiento explícito; y sistemas que generan o manipulan material de abuso sexual infantil. La introducción en el mercado está prohibida si esa generación es la finalidad prevista, o si es un resultado razonablemente previsible y reproducible y el sistema carece de salvaguardas técnicas adecuadas. El uso está prohibido cuando el responsable del despliegue lo usa para generar ese material.

Para un producto con generación de imagen o de vídeo, la ausencia de salvaguardas forma parte del supuesto: es un hallazgo de la revisión.

Ante un indicio de art. 5, detén la clasificación, descríbele al usuario el hecho y la letra del artículo, y remítelo a un especialista.

### 2. Alto riesgo (art. 6)

Dos vías:

1. **Art. 6.1 y anexo I.** El sistema es un componente de seguridad de un producto regulado por la legislación de armonización del anexo I, o es ese producto, **y** el producto exige evaluación de la conformidad por un tercero. Una función que no es de seguridad (asistencia, optimización, automatización, comodidad, control de calidad) no cuenta como componente de seguridad, salvo que su fallo ponga en peligro la salud o la seguridad.
2. **Art. 6.2 y anexo III.** Ocho ámbitos de uso:
   1. Biometría: identificación remota, categorización por atributos sensibles, reconocimiento de emociones.
   2. Infraestructuras críticas: componentes de seguridad en infraestructura digital crítica, tráfico, agua, gas, calefacción y electricidad.
   3. Educación y formación profesional: admisión, evaluación de resultados, nivel educativo, vigilancia en exámenes.
   4. Empleo y gestión de trabajadores: selección, promoción, despido, asignación de tareas, evaluación del rendimiento.
   5. Servicios esenciales: prestaciones públicas, solvencia crediticia (salvo detección de fraude), seguros de vida y de salud, llamadas de emergencia y triaje.
   6. Aplicación de la ley.
   7. Migración, asilo y control fronterizo.
   8. Administración de justicia y procesos democráticos.

**Filtro del art. 6.3.** Un sistema del anexo III no es de alto riesgo si no plantea un riesgo significativo, lo que ocurre cuando cumple alguna de estas condiciones: realiza una tarea procedimental limitada; mejora el resultado de una actividad humana previa; detecta patrones de decisión sin sustituir la valoración humana; o hace una tarea preparatoria. **Si elabora perfiles de personas físicas, es siempre de alto riesgo.**

Quien se acoge al filtro documenta su evaluación antes de introducir el sistema en el mercado, se registra (art. 49.2) y entrega la documentación a la autoridad si la pide (art. 6.4). Usa el registro de decisión de [`plantillas-documentacion.md`](plantillas-documentacion.md).

Si el ámbito encaja en el anexo III, la decisión de acogerse o no al filtro la toma el usuario con un especialista. Tú preparas los hechos.

### 3. Transparencia (art. 50)

| El sistema… | Obligación | A quién | Artículo |
|---|---|---|---|
| Interactúa directamente con personas | Que la persona sepa que interactúa con una IA, salvo que sea evidente para una persona razonablemente informada, atenta y perspicaz | Proveedor | 50.1 |
| Genera audio, imagen, vídeo o texto sintéticos | Marcar la salida en formato legible por máquina. No aplica a funciones de apoyo a la edición estándar ni cuando no se alteran sustancialmente los datos de entrada | Proveedor | 50.2 |
| Reconoce emociones o categoriza biométricamente | Informar a las personas expuestas | Responsable del despliegue | 50.3 |
| Genera o manipula ultrafalsificaciones | Hacer público que el contenido es generado o manipulado; en obra manifiestamente artística, creativa, satírica o de ficción basta indicarlo sin entorpecer la obra | Responsable del despliegue | 50.4 |
| Genera texto que se publica para informar sobre asuntos de interés público | Divulgar que es generado, salvo revisión humana o control editorial con un responsable editorial | Responsable del despliegue | 50.4 |

Según las directrices de la Comisión sobre el art. 50 (C(2026) 7702, no vinculantes), el obligado por el art. 50.2 es el proveedor del sistema, no el del modelo; puede apoyarse en la marca que aplique el proveedor del modelo, sin que eso le quite su responsabilidad.

### 4. Mínimo

Sin requisitos específicos más allá de la alfabetización del art. 4 y, si hay datos personales, del RGPD.

## Qué dejar escrito

Rol, nivel, artículos, hechos en que se apoya, dudas abiertas y quién firma. Plantilla: «Registro de decisión de clasificación» en [`plantillas-documentacion.md`](plantillas-documentacion.md).
