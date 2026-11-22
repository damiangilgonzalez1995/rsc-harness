# Plantillas de documentación

Paso 5 de [`SKILL.md`](../SKILL.md). Verificado a 2026-11-21. Cuatro esqueletos; genera solo el que pidan.

## Reglas comunes

- Guarda el documento donde el proyecto guarde su documentación (por ejemplo, `docs/ia/`) y enlázalo desde su índice.
- `[REPO]`: rellénalo con lo que el repositorio demuestra y cita el fichero. `[HUMANO]`: exige juicio; déjalo marcado y dile al usuario quién debería rellenarlo.
- Un campo sin evidencia se queda marcado. Un esqueleto con huecos visibles vale más que uno relleno con suposiciones.
- Todo documento empieza con esta cabecera:

```markdown
> Borrador generado con ayuda de un agente a partir del repositorio. No es asesoría jurídica ni acredita el cumplimiento del Reglamento (UE) 2024/1689.
> Referencias normativas verificadas a 2026-11-21; recomprobar en EUR-Lex antes de usar.
> Versión del sistema: [REPO: commit o release] · Fecha: [fecha] · Redacta: [HUMANO] · Revisa y firma: [HUMANO]
```

## 1. Registro de decisión de clasificación

Sirve a cualquier sistema. Si el proveedor se acoge al filtro del art. 6.3, es la evaluación que el art. 6.4 manda documentar antes de la introducción en el mercado. Si el proyecto usa ADR, puede ser uno (`write-adr`).

```markdown
# Decisión de clasificación: [nombre del sistema]

## Sistema
- Qué hace: [REPO]
- Finalidad prevista: [HUMANO]
- Quién lo usa y sobre quién decide o influye: [HUMANO]
- Modelos y proveedores: [REPO]
- Usuarios o resultados en la UE: [HUMANO]

## Rol
- Rol o roles: [proveedor / responsable del despliegue / proveedor posterior / otro] (art. 3.[n])
- Hechos en que se apoya: [HUMANO]
- Art. 25.1.c: ¿algún uso de los clientes cambia la finalidad a un ámbito del anexo III? [HUMANO]

## Nivel de riesgo
- Art. 5: [descartado, y por qué / indicio, y cuál]
- Art. 6.1 y anexo I: [aplica / no aplica, y por qué]
- Art. 6.2 y anexo III: [ámbito, o «ninguno»]
- Filtro del art. 6.3, si hay ámbito: [condición que se cumple] · ¿Elabora perfiles de personas físicas? [sí / no]
- Art. 50: [apartados que aplican]
- Resultado: [prohibido / alto riesgo / transparencia / mínimo]

## Obligaciones y fechas
| Obligación | Artículo | Desde | Estado |
|---|---|---|---|

## Dudas abiertas
| Duda | Quién la resuelve | Fecha límite |
|---|---|---|

## Revisión
- Revisar esta decisión cuando cambie la finalidad, el modelo o el calendario.
- Firma: [HUMANO]
```

## 2. Documentación técnica (anexo IV, art. 11)

Para el proveedor de un sistema de alto riesgo. Se elabora antes de la introducción en el mercado y se mantiene al día. Son nueve apartados; el esqueleto los sigue en orden.

```markdown
# Documentación técnica: [nombre del sistema]

## 1. Descripción general
- Finalidad prevista, proveedor y versión: [HUMANO] / [REPO]
- Interacción con otro hardware o software: [REPO: dependencias, rutas de la API]
- Formas en que se introduce en el mercado o se pone en servicio: [HUMANO]
- Interfaz de usuario e instrucciones de uso: [REPO] / enlace

## 2. Elementos del sistema y proceso de desarrollo
- Herramientas y modelos preentrenados de terceros: [REPO]
- Lógica general, decisiones clave de diseño y supuestos: [REPO: ADR] / [HUMANO]
- Arquitectura: [REPO]
- Datos: origen, preparación, conjuntos de prueba: [HUMANO]
- Medidas de supervisión humana: [REPO] / [HUMANO]
- Validación y pruebas, con métricas y resultados: [REPO: tests y evaluaciones]
- Medidas de ciberseguridad: [REPO] / [HUMANO]

## 3. Supervisión, funcionamiento y control
- Capacidades y limitaciones, niveles de precisión: [HUMANO]
- Riesgos previsibles: [HUMANO]

## 4. Idoneidad de los parámetros de rendimiento
[HUMANO]

## 5. Sistema de gestión de riesgos (art. 9)
[HUMANO]

## 6. Cambios a lo largo del ciclo de vida
[REPO: historial de versiones]

## 7. Normas armonizadas y otras especificaciones aplicadas
[HUMANO]

## 8. Declaración UE de conformidad
[HUMANO: copia de la declaración]

## 9. Vigilancia poscomercialización (art. 72)
[HUMANO: sistema y plan]
```

Las pymes y las pequeñas empresas de mediana capitalización pueden presentar el anexo IV de forma simplificada con un formulario de la Comisión (art. 11.1). A 2026-11-21 ese formulario no estaba localizado.

Los títulos de arriba resumen el anexo. Antes de dar el documento por completo, coteja cada apartado con el texto del anexo IV.

## 3. Instrucciones de uso (art. 13)

Las escribe el proveedor de un sistema de alto riesgo para el responsable del despliegue. Concisas, completas, correctas y claras. Se versionan con el producto.

```markdown
# Instrucciones de uso: [nombre del sistema] [versión]

## Proveedor
Identidad y contacto: [HUMANO]

## Finalidad prevista
[HUMANO]

## Precisión, solidez y ciberseguridad
- Nivel con el que se probó y parámetros para medirlo: [REPO: evaluaciones] / [HUMANO]
- Circunstancias conocidas o previsibles que pueden afectar a ese nivel o crear riesgos: [HUMANO]
- Rendimiento respecto de las personas o colectivos con los que se usará: [HUMANO]

## Datos de entrada
Especificaciones: [REPO] / [HUMANO]

## Interpretación de la salida
Qué significa la salida y cómo usarla: [HUMANO]

## Supervisión humana
Medidas previstas y cómo se accionan, incluida la parada: [REPO] / [HUMANO]

## Recursos y mantenimiento
Recursos de cómputo, vida útil prevista, mantenimiento y actualizaciones: [REPO] / [HUMANO]

## Archivos de registro
Cómo recoger, almacenar e interpretar los logs (art. 13.3.f): [REPO]
```

## 4. Evaluación de impacto en los derechos fundamentales (FRIA, art. 27)

La hace el **responsable del despliegue**, antes del primer uso, si es un organismo de Derecho público, una entidad privada que presta servicios públicos, o despliega un sistema de solvencia crediticia o de seguros de vida y salud (anexo III, punto 5, letras b y c). Comprueba primero que al usuario le toca.

El contenido mínimo son las letras a) a f) del art. 27.1.

```markdown
# FRIA: [sistema] en [organización]

## a) Procesos en que se usará
[HUMANO]

## b) Periodo y frecuencia de uso
[HUMANO]

## c) Categorías de personas y colectivos afectados
[HUMANO]

## d) Riesgos de perjuicio para esas personas
[HUMANO]

## e) Medidas de supervisión humana
[HUMANO] / [REPO]

## f) Medidas si los riesgos se materializan
Gobernanza interna y mecanismos de reclamación: [HUMANO]

## Relación con la EIPD
Referencias a la evaluación de impacto del art. 35 del RGPD (art. 27.4): [HUMANO]

## Notificación
Resultado notificado a la autoridad de vigilancia del mercado: [HUMANO: fecha]
```

La plantilla oficial de la Oficina de IA (art. 27.5) era un borrador en consulta a 2026-11-21. Cuando se publique la definitiva, manda ella.

Una FRIA la firma el responsable del despliegue con un especialista. El esqueleto ordena la información; no la evalúa.
