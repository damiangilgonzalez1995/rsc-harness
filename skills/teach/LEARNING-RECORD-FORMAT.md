# Formato de los registros de aprendizaje

Los registros de aprendizaje viven en `./learning-records/` y usan numeración secuencial: `0001-slug.md`, `0002-slug.md`, etc. Crea el directorio de forma perezosa: solo cuando se escriba el primer registro.

Son el equivalente docente de los ADR: capturan lecciones no obvias, aprendizajes clave y conocimiento previo declarado que orientarán futuras sesiones. Se usan para calcular la zona de desarrollo próximo.

## Plantilla

```md
# {Título corto de lo aprendido o establecido}

{1-3 frases: qué se aprendió (o qué conocimiento previo se estableció), y por qué importa para futuras sesiones.}
```

Ese es todo el formato. Un registro de aprendizaje puede ser un único párrafo. El valor está en registrar _que_ esto ya se sabe y _por qué_ cambia lo que conviene enseñar a continuación, no en rellenar secciones.

## Secciones opcionales

Inclúyelas solo cuando aporten valor real. La mayoría de los registros no las necesitarán.

- **Status** en el frontmatter (`active | superseded by LR-NNNN`): útil cuando un entendimiento anterior resulta ser erróneo y se reemplaza.
- **Evidencia**: cómo demostró el usuario el entendimiento (una pregunta respondida, un ejercicio completado, experiencia previa citada). Útil cuando la afirmación pueda revisarse.
- **Implicaciones**: qué desbloquea o descarta para futuras sesiones. Vale la pena registrarlo cuando no es obvio.

## Numeración

Escanea `./learning-records/` en busca del número más alto existente e incrementa en uno.

## Cuándo escribir un registro de aprendizaje

Escribe uno cuando se cumpla alguna de estas condiciones:

1. **El usuario demostró entendimiento genuino de algo no trivial**: no solo exposición, sino evidencia de que puede usar el concepto correctamente. Esto fija un nuevo suelo para lo que enseñar a continuación.
2. **El usuario reveló conocimiento previo**: "ya sé X". Regístralo para que futuras sesiones no lo reenseñen. Registra también la _profundidad_ declarada.
3. **Se corrigió una idea errónea**: el usuario creía algo equivocado y ahora ve por qué. Estos son muy valiosos: predicen futuros tropiezos en temas relacionados.
4. **La misión cambió como respuesta al aprendizaje**: el usuario descubrió que le importaba algo distinto de lo que pensaba. Enlaza a [[MISSION.md]] y actualízala.

### Qué _no_ califica

- Material que simplemente se cubrió. Cobertura no es aprendizaje. Espera a la evidencia.
- Cualquier cosa ya capturada de forma escueta en [[GLOSSARY.md]] como definición de término. No dupliques.
- Registros de actividad sesión a sesión. Los registros de aprendizaje no son un diario: son aprendizajes con calidad de decisión.

## Supersesión

Cuando un registro posterior contradiga a uno anterior (el entendimiento del usuario se profundizó o se corrigió), marca el registro antiguo con `Status: superseded by LR-NNNN` en lugar de borrarlo. La historia de cómo evolucionó el entendimiento es en sí misma señal útil.
