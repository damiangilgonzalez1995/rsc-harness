# Lista de comprobación por zonas

Paso 4 de [`SKILL.md`](../SKILL.md). Verificado a 2026-11-21. Fechas en [`calendario.md`](calendario.md).

## Marco común

- Revisión **solo de lectura**. Los arreglos llegan después, y solo los que elija el usuario.
- De `.env` y de los secretos, solo si la variable existe; su valor se queda fuera del informe.
- Cada hallazgo lleva:
  - título;
  - carácter: **exigible ya**, **solo alto riesgo** o **buena práctica**;
  - artículo;
  - evidencia `fichero:línea`;
  - qué falta, en una frase llana;
  - arreglo en una o dos líneas.
- Una zona sin hallazgos se cierra con una línea y su evidencia. Una zona que no aplica (el producto no genera audio, por ejemplo) se cierra con el motivo.
- El carácter depende de los pasos 1 y 2. Lo marcado «alto riesgo» es exigible solo si el sistema lo es; para el resto es buena práctica.
- Lo que el Reglamento dice va con su artículo. Lo marcado **criterio** es una propuesta de ingeniería: explícala como tal.

## Zona 1. Aviso de IA al usuario

**Norma.** Art. 50.1 y 50.5. Exigible ya; obligado, el proveedor del sistema. Las directrices de la Comisión (C(2026) 7702, no vinculantes) concretan qué vale.

**Qué revisar.**
- Que un chat o un bot muestre un aviso visible, en lenguaje llano, antes o durante la primera interacción: una etiqueta o banda, o el saludo del primer turno.
- En voz, una frase hablada al inicio. Un tono o una señal sonora, por sí solos, no bastan según las directrices.
- Que el aviso no viva solo en los términos y condiciones, en una URL, en la documentación o en metadatos que el usuario no ve. Llamar «asistente» al sistema tampoco avisa.
- Que el aviso sea accesible: lector de pantalla y teclado (art. 50.5).
- Si el equipo se acoge a la excepción de «evidente» del art. 50.1, que esté escrito por qué.
- **Criterio.** Un test que falle si el aviso desaparece de la primera pantalla.

## Zona 2. Marcado de contenido sintético

**Norma.** Art. 50.2 (proveedor) y 50.4 (responsable del despliegue). Exigible ya; mira la gracia del art. 111.4 en el calendario. El Código de buenas prácticas de marcado y etiquetado (10.6.2026) es voluntario.

**Qué revisar.**
- Qué genera el producto: audio, imagen, vídeo, texto. Las directrices dejan fuera del art. 50.2 el código fuente, las cadenas cortas de interfaz y las salidas de máquina a máquina.
- Si la salida lleva una marca legible por máquina. El Código pide al menos dos capas de marcado para audio, imagen y vídeo, y admite una sola para el texto libre.
- **Criterio.** En texto libre la marca solo puede aplicarla quien controla el muestreo, o sea, el proveedor del modelo: comprueba en su documentación si la aplica, actívala si es opcional y deja escrito lo comprobado. La responsabilidad sigue siendo del proveedor del sistema.
- Si el producto publica ultrafalsificaciones o texto de interés público sin control editorial: que la etiqueta visible exista (art. 50.4).
- Si genera imagen, vídeo o audio de personas: qué salvaguardas técnicas impiden el material de las prohibiciones nuevas del art. 5.
- Un registro propio de lo generado ayuda, pero el Código no lo considera suficiente por sí solo.

## Zona 3. Registro y trazabilidad

**Norma.** Art. 12: capacidad técnica de registro automático durante todo el ciclo de vida, para tres finalidades (detectar situaciones de riesgo o una modificación sustancial, vigilancia poscomercialización y vigilancia del funcionamiento). Art. 13.3.f: las instrucciones de uso explican cómo recoger, almacenar e interpretar los logs. Solo alto riesgo.

El art. 12 no fija formato, campos ni mecanismo de integridad, salvo para la identificación biométrica remota (art. 12.3). Lo que sigue es **criterio**.

**Qué revisar.**
- Que exista un registro de eventos propio, distinto del log de texto y de la plataforma de trazas. Una traza que se descarta si falla el envío no es un registro fiable.
- Que cada turno deje:
  - momento y un identificador que una log, traza, mensajes y voto del usuario;
  - versión del sistema (commit o release);
  - modelo pedido y modelo que respondió;
  - nombre y versión del prompt;
  - herramientas llamadas y su resultado;
  - en RAG, identificador y hash de cada fragmento recuperado;
  - decisiones de supervisión humana: quién, cuándo y qué decidió;
  - resultado: correcto, error, rechazo o cancelación.
- Que el registro guarde referencias al contenido en lugar del contenido.
- Integridad: tabla de solo inserción, encadenado por hash, rol de escritura sin permiso de borrado y último hash anclado fuera del sistema. Da evidencia de manipulación; no la impide.

## Zona 4. Retención y borrado

**Norma.** Arts. 19.1 y 26.6: los logs bajo control de cada uno se conservan un tiempo adecuado a la finalidad, **de al menos seis meses, salvo que el Derecho de protección de datos disponga otra cosa**. Solo alto riesgo. El Reglamento no da un máximo. RGPD, art. 5.1.e (limitación del plazo) y art. 17 (supresión): exigible ya si hay datos personales. La documentación técnica tiene su propio plazo, diez años (art. 18.1).

Seis meses es un suelo para el registro de eventos; no autoriza a guardar las conversaciones.

**Qué revisar.**
- Un plazo definido y aplicado por almacén: historial de conversación, memoria del agente, trazas, audio, votos y comentarios, vectores y documentos indexados.
- Borrado por usuario en todos los almacenes, incluidos el almacén vectorial y la plataforma de trazas.
- La retención real de la plataforma de trazas: si queda por debajo de seis meses, no puede ser el único registro de un sistema de alto riesgo.
- **Criterio.** Tres almacenes: registro de eventos (metadatos seudonimizados, seis meses o más, solo inserción), contenido (vida corta, borrable por usuario y conversación) y tabla de correspondencia seudónimo-usuario (borrarla desvincula el registro). Si basta en un caso concreto lo decide el delegado de protección de datos.

El calendario de retención como documento es de `data-policy`.

## Zona 5. Supervisión humana y parada

**Norma.** Art. 14: el sistema se diseña para que una persona pueda vigilarlo, entender sus límites, ser consciente del sesgo de automatización, interpretar la salida, decidir no usarla o anularla, e interrumpirlo con un botón de parada o un procedimiento similar que lo deje en un estado seguro. Art. 26.2: la supervisión se asigna a personas con competencia, formación y autoridad. Art. 26.5: ante un riesgo, se suspende el uso. Solo alto riesgo.

**Qué revisar.**
- Aprobación humana antes de las acciones irreversibles o con efecto externo, y registro de esa decisión. Aprobarlo todo no es supervisar: clasifica las acciones por reversibilidad y alcance.
- Que la salida se pueda descartar o revertir, y que la interfaz muestre fuentes y pasos.
- **Criterio.** Parada en tres niveles: el turno en curso; una herramienta o un agente; el sistema entero o un cliente, en caliente, con registro de quién la acciona y un estado seguro definido. Un interruptor que solo se lee al arrancar no cubre el tercero.
- La parte organizativa del art. 26.2 no la da el código: anótala como pendiente del responsable del despliegue.

Las decisiones automatizadas del art. 22 del RGPD son una cuestión aparte, que no depende de que el sistema sea de alto riesgo. Los límites técnicos del agente son de `agent-safety`.

## Zona 6. Seudonimización en trazas

**Norma.** RGPD, arts. 5.1.c (minimización), 25 y 32. Exigible ya si hay datos personales. Los prompts pueden traer datos de salud u otras categorías especiales sin que nadie los pida.

**Qué revisar.**
- Qué identificador de usuario sale hacia la plataforma de trazas: un seudónimo opaco, no el correo ni el identificador interno.
- Si el contenido de prompts y respuestas se captura en las trazas, y si se enmascara en el cliente antes de exportar.
- Que nadie trate la detección automática de datos personales como garantía.
- Variables locales, tokens y frases del usuario en los logs de error.

Un dato cifrado o seudonimizado sigue siendo dato personal.

## Zona 7. Transferencias internacionales

**Norma.** RGPD, arts. 28 y 44 a 49. Exigible ya si hay datos personales.

**Qué revisar.**
- A qué terceros salen datos (modelo, trazas, voz, base vectorial, alojamiento) y en qué región está cada uno.
- Que la región y el proveedor sean configuración, con una región de la UE disponible.
- Contrato de encargo con cada tercero y lista de subencargados.
- Para proveedores de Estados Unidos: si están certificados en el Data Privacy Framework. La decisión de adecuación sigue vigente, pero el Comité Europeo de Protección de Datos pidió a la Comisión que evalúe si una sentencia del Tribunal Supremo de Estados Unidos la afecta (carta de 31.7.2026): ten cláusulas contractuales tipo como respaldo.

Los contratos y las cláusulas son de `gdpr-privacy`.

Los artículos del RGPD citados en este fichero son su lectura habitual; valídalos con el delegado de protección de datos.

## Entrega

Lista numerada: primero lo exigible ya, después lo de alto riesgo, al final la buena práctica. Cada número, en una o dos frases llanas: qué falta y qué artículo lo pide. El usuario responde punto por punto.
