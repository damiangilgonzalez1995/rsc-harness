# Calendario y obligaciones

Paso 3 de [`SKILL.md`](../SKILL.md). **Verificado a 2026-11-21.** Única fuente de fechas de esta skill: si una fecha cambia, se cambia aquí.

## Recomprobar antes de afirmar

El calendario ya cambió una vez: el Reglamento (UE) 2026/1744 («Ómnibus digital sobre IA», de 8.7.2026, DOUE 24.7.2026, en vigor el 27.7.2026) movió las fechas de alto riesgo. Antes de dar una fecha al usuario:

1. Abre el art. 113 (fechas de aplicación) y el art. 111 (regímenes transitorios) en una de estas fuentes.
2. Compara con la tabla de abajo.
3. Si difiere, usa la fuente, díselo al usuario y propón corregir este fichero.

| Fuente | Dirección |
|---|---|
| Reglamento (UE) 2024/1689, texto original | <https://eur-lex.europa.eu/eli/reg/2024/1689/oj> |
| Reglamento (UE) 2026/1744, la modificación | <https://eur-lex.europa.eu/eli/reg/2026/1744/oj> |
| AI Act Service Desk de la Comisión, texto consolidado por artículo | <https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-113> |
| Comisión, marco regulador de la IA | <https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai> |

EUR-Lex suele devolver una página vacía a clientes automáticos. El mismo texto sale del repositorio de la Oficina de Publicaciones: `http://publications.europa.eu/resource/celex/02024R1689-20260727` (consolidado) con la cabecera `Accept-Language: es`. El texto consolidado es un instrumento de documentación sin efecto jurídico; lo que obliga es lo publicado en el DOUE.

## Fechas de aplicación

| Fecha | Qué se aplica | Artículo |
|---|---|---|
| 1.8.2024 | Entrada en vigor del Reglamento | 113 |
| 2.2.2025 | Alfabetización (art. 4) y prácticas prohibidas del art. 5.1, letras a) a h) | 113 |
| 2.8.2025 | Modelos de uso general (capítulo V), gobernanza y sanciones | 113 |
| 2.8.2026 | Aplicación general: **art. 50**, vigilancia del mercado y el resto no exceptuado | 113 |
| 2.12.2026 | Fin de la gracia del art. 50.2 para sistemas generativos introducidos en el mercado antes del 2.8.2026. Dos prohibiciones nuevas del art. 5 | 111.4 y 113 |
| 2.8.2027 | Modelos de uso general introducidos en el mercado antes del 2.8.2025 | 111.3 |
| **2.12.2027** | **Alto riesgo del art. 6.2 y el anexo III** (capítulo III, secciones 1 a 3) | 113 |
| **2.8.2028** | **Alto riesgo del art. 6.1 y el anexo I** | 113 |
| 2.8.2030 | Sistemas de alto riesgo destinados a autoridades públicas que ya estaban en el mercado | 111.2 |

El art. 50 no se aplazó. La gracia del art. 111.4 cubre solo el marcado legible por máquina del art. 50.2; el aviso al usuario del art. 50.1 no tiene gracia.

Las fechas de alto riesgo eran 2.8.2026 (anexo III) y 2.8.2027 (anexo I) antes del Reglamento (UE) 2026/1744. Un documento que aún las cite está caducado.

## Bloque A. Ya exigible, sea cual sea el riesgo

| Obligación | Artículo | A quién | Desde |
|---|---|---|---|
| Adoptar medidas para apoyar la alfabetización en IA del personal y de quienes usen el sistema en su nombre. No exige un nivel concreto a ninguna persona | 4 | Proveedor y responsable del despliegue | 2.2.2025 |
| No realizar las prácticas prohibidas de las letras a) a h) | 5.1 | Todos los operadores | 2.2.2025 |
| No generar imágenes íntimas o sexuales de una persona identificable sin su consentimiento, ni material de abuso sexual infantil. Alcance en [`clasificacion.md`](clasificacion.md) | 5, letras y apartado nuevos | Proveedor y responsable del despliegue | 2.12.2026 |
| Diseñar el sistema para que la persona sepa que interactúa con una IA, salvo que sea evidente | 50.1 | Proveedor | 2.8.2026 |
| Marcar en formato legible por máquina el audio, la imagen, el vídeo o el texto sintéticos | 50.2 | Proveedor del sistema generativo | 2.8.2026; hasta el 2.12.2026 si el sistema ya estaba en el mercado |
| Informar a las personas expuestas a reconocimiento de emociones o categorización biométrica | 50.3 | Responsable del despliegue | 2.8.2026 |
| Hacer público que una ultrafalsificación (imagen, audio o vídeo) es contenido generado o manipulado | 50.4 | Responsable del despliegue | 2.8.2026 |
| Divulgar que un texto publicado para informar al público sobre asuntos de interés público es generado, salvo revisión humana o control editorial con responsable | 50.4 | Responsable del despliegue | 2.8.2026 |
| Dar esa información de forma clara y distinguible, a más tardar en la primera interacción o exposición, y de forma accesible | 50.5 | Los anteriores | 2.8.2026 |
| RGPD, si hay datos personales: el Reglamento de IA no lo desplaza | 2.7 | Responsable y encargado del tratamiento | 25.5.2018 |

## Bloque B. Solo alto riesgo

Desde el 2.12.2027 (anexo III) o el 2.8.2028 (anexo I).

| Obligación | Artículo | A quién |
|---|---|---|
| Sistema de gestión de riesgos, continuo, con pruebas contra métricas y umbrales definidos de antemano | 9 | Proveedor |
| Gobernanza de datos. Si el sistema no entrena modelos, solo sobre los conjuntos de prueba (art. 10.6) | 10 | Proveedor |
| Documentación técnica antes de la introducción en el mercado, y al día | 11 y anexo IV | Proveedor |
| Capacidad técnica de registro automático de eventos durante todo el ciclo de vida | 12 | Proveedor |
| Instrucciones de uso | 13 | Proveedor |
| Diseño para la supervisión humana, con parada segura | 14 | Proveedor |
| Precisión, solidez y ciberseguridad | 15 | Proveedor |
| Sistema de gestión de la calidad, documentado | 17 | Proveedor |
| Conservar la documentación técnica diez años | 18.1 | Proveedor |
| Conservar los logs bajo su control al menos seis meses, salvo que el Derecho de protección de datos disponga otra cosa | 19.1 | Proveedor |
| Asumir las obligaciones de proveedor por marca, modificación sustancial o cambio de finalidad | 25.1 | Distribuidor, importador, responsable del despliegue |
| Usar conforme a las instrucciones, asignar la supervisión a personas con competencia, formación y autoridad, vigilar y suspender el uso ante un riesgo | 26.1, 26.2 y 26.5 | Responsable del despliegue |
| Conservar los logs bajo su control al menos seis meses, con la misma salvedad | 26.6 | Responsable del despliegue |
| Informar a los trabajadores y a sus representantes antes de usarlo en el trabajo; informar a las personas sobre las que el sistema decide o ayuda a decidir | 26.7 y 26.11 | Responsable del despliegue |
| Evaluación de impacto en los derechos fundamentales, antes del primer uso | 27 | Organismos públicos, entidades privadas que prestan servicios públicos, y quien despliega sistemas de solvencia o de seguros de vida y salud (anexo III, 5 b y c). Excluidas las infraestructuras críticas |
| Documentar la evaluación de «no es de alto riesgo» y registrarse | 6.3, 6.4 y 49.2 | Proveedor de un sistema del anexo III que se acoge al filtro |
| Vigilancia poscomercialización, con plan | 72 | Proveedor |
| Notificar incidentes graves: 15 días con carácter general, 10 si hay fallecimiento, 2 si es infracción generalizada o interrupción grave de una infraestructura crítica | 73 | Proveedor; el responsable del despliegue avisa al proveedor (26.5) |

Los sistemas de alto riesgo introducidos en el mercado antes de la fecha de aplicación solo quedan sujetos si después sufren cambios significativos de diseño (art. 111.2).

Aunque no sea exigible todavía, diseñar hoy el registro, la retención y la supervisión es buena práctica: cambiarlos después es un cambio de arquitectura.

## Quien integra un modelo ajeno por API

- Es proveedor posterior de un sistema (art. 3.68), no proveedor del modelo: las obligaciones del art. 53 son del proveedor del modelo.
- Tiene derecho a recibir del proveedor del modelo la información del art. 53.1.b: capacidades, limitaciones y requisitos de integración.
- Las obligaciones de los modelos de uso general se aplican desde el 2.8.2025.

## Sanciones (art. 99)

| Infracción | Tope |
|---|---|
| Prácticas prohibidas del art. 5 | 35 millones de euros o el 7 % del volumen de negocio mundial, el mayor |
| Obligaciones de proveedores y responsables del despliegue, y transparencia del art. 50 | 15 millones o el 3 %, el mayor |
| Información incorrecta o engañosa a las autoridades | 7,5 millones o el 1 %, el mayor |

Para las pymes se aplica el menor de los dos topes (art. 99.6).

## Normas técnicas y España

- A 2026-11-21, la única norma armonizada citada en el DOUE que consta es la EN 18286:2026, sobre el sistema de gestión de la calidad del art. 17 (Decisión de Ejecución (UE) 2026/2274). No hay norma armonizada publicada para el registro del art. 12: el esquema de eventos es una decisión de diseño que habrá que revisar cuando exista.
- La ISO/IEC 42001 no da presunción de conformidad con el Reglamento.
- España: la AESIA publica guías no vinculantes (la 12 trata los registros). El proyecto de ley española de IA caducó con la disolución de las Cortes en octubre de 2026; a 2026-11-21 no hay ley nacional que desarrolle el régimen sancionador.

## Normas vecinas

Aplican a la vez y no las decide esta skill. Para saber cuáles obligan al negocio, `compliance`.

- **RGPD.** Para un producto con IA suele ser la norma que más obliga en el día a día. Documentos: `gdpr-privacy` y `data-policy`.
- **Directiva (UE) 2024/2853, productos defectuosos.** Trata el software y los sistemas de IA como producto, para los introducidos en el mercado después del 9.12.2026. Se presume el defecto si el demandado no exhibe las pruebas pertinentes (arts. 9 y 10): los registros son también defensa.
- **Reglamento (UE) 2024/2847, ciberresiliencia.** Notificación de vulnerabilidades desde el 11.9.2026 y el resto desde el 11.12.2027. Alcanza al software que se entrega para ejecutarse en el lado del cliente; según la guía de la Comisión, no vinculante, una aplicación web a la que solo se accede por navegador no es producto por ese solo motivo.

## Pendiente de verificar

Preséntalo siempre como pendiente, nunca como hecho. A 2026-11-21 no estaba verificado en fuente primaria:

- Directrices de la Comisión sobre la clasificación de alto riesgo (art. 6.5): solo consta, por fuente secundaria, un borrador de mayo de 2026.
- Detalle de los arts. 16, 20, 21, 43, 47, 48 y 49: evaluación de la conformidad, declaración UE, marcado CE y registro. Un sistema de alto riesgo los necesita; léelos en fuente antes de afirmar nada.
- Numeración exacta, en la versión española, de las dos prohibiciones nuevas del art. 5 y del apartado que fija su alcance.
- Plantilla de la FRIA de la Oficina de IA (art. 27.5): solo hay un borrador en consulta hasta el 15.1.2027.
- Formulario simplificado de documentación técnica para pymes (art. 11.1): no localizado.
- Directrices finales sobre incidentes graves (art. 73): no localizadas.
- Normas de registro ISO/IEC 24970 y prEN 18229: sin publicar o sin contenido público.
- Que los arts. 72 y 73 no obliguen en la práctica hasta las fechas de alto riesgo es una inferencia.
- Qué autoridad española sanciona hoy y con qué potestad.
