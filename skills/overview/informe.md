# Modo `informe`

Un informe de lo que está mal en el proyecto, contado como lo contaría un amigo que se lo ha mirado entero: una página para leer de un vistazo, con trama. La plantilla es [`informe.html`](informe.html), y el diseño sale siempre de ahí: tú solo escribes el texto.

## 1. Reúne lo que hay

1. Lanza `node scripts/overview.mjs scan` (completo, no `--fast`) y lee `.rsc/overview/state.json`: `kpis.health`, `findings` de cada zona, `uncoveredWeighty`, `uncoveredEndpoints`, zonas en `never`, `checks` en `unknown` y `pass`.
2. Lee `docs/overview/overview.json`: `questions[]` abiertas y decididas, y las `verifications[]` con `ok: false`.
3. Suma lo que se haya encontrado en esta sesión y no esté en el estado: salidas de escáneres (npm audit, pip-audit, Semgrep, gitleaks…), PR revisadas, búsquedas a mano.

Hecho cuando cada hallazgo tiene una fuente: un check, una verificación, un archivo con línea o la salida de una herramienta. Si no la tiene, no entra.

## 2. Clasifica

| Sección | Qué va | Origen típico |
|---|---|---|
| Lo que me preocupa | Lo que puede costar dinero, datos o caída hoy | `findings` de zonas `red`, `uncoveredWeighty`, escáneres con gravedad media o alta |
| Lo que me escama | Lo que no rompe hoy pero muerde si crece | verificaciones con `ok: false`, smells de revisión, avisos bajos |
| Lo que está bien hecho | Comprobado y correcto, con evidencia | `checks` en `pass`, escáneres limpios |
| Donde no he mirado | Lo que no se sabe | zonas `never`, `checks` en `unknown`, herramientas que faltan, lo que el usuario excluyó |

- «Bien hecho» lleva solo lo comprobado. Lo que no se comprobó va a «Donde no he mirado», aunque parezca estar bien.
- Ordena «Lo que me preocupa» por gravedad: el primero es el que arreglarías mañana.

## 3. Escribe con la voz del amigo

Segunda persona, frases cortas, sin jerga sin explicar (define cada término la primera vez: «RLS, las reglas de quién puede ver qué fila»).

- **Titular**: el veredicto en una frase, la buena y la mala juntas («Nada explotable confirmado, pero tres fallos que arreglar ya»).
- **Entrada**: dos párrafos. Qué has mirado, y luego la buena noticia y la mala en lenguaje llano.
- **Cada hallazgo de «me preocupa» y «me escama»** es una escena con tres tiempos:
  - *Lo que vi*: el hecho, con el archivo o el dato;
  - *Qué pasa si…*: la consecuencia concreta, con alguien haciendo algo («…alguien escribe un bucle de diez líneas contra el agente: en una noche te vacía el saldo»);
  - *Para qué sirve arreglarlo*: lo que ganas, con una imagen cotidiana («es un cinturón de seguridad»);
  - y la etiqueta con la skill que lo arregla (`recommendedSkill` o la `skill` del check).
- **«Bien hecho»**: una línea por punto, con para qué te sirve tenerlo.
- **«Donde no he mirado»**: por qué importa no saberlo. Marca el punto ciego mayor.
- **Cierre «Si yo fuera tú, esta semana haría esto»**: 3–5 pasos en orden, el más barato y urgente primero. Después, en una frase, lo decidido y las preguntas abiertas más importantes.

Hecho cuando cada hallazgo rojo y ámbar tiene sus tres tiempos y cada consecuencia nombra quién hace qué y qué pierdes.

## 4. Genera la página

1. Copia [`informe.html`](informe.html) a `.rsc/overview/informe.html` y rellena cada `{{…}}`. Repite los bloques marcados con `<!-- repetir -->` tantas veces como haga falta; borra una sección entera si no tiene nada.
2. Escapa `<`, `>` y `&` en todo texto que venga del repo (paths, notas, salidas de herramientas).
3. El círculo de salud: `stroke-dasharray="<health> 100"`, en rojo por debajo de 40, ámbar hasta 80 y verde por encima (`--bad`, `--mid`, `--ok`).
4. Si el asistente puede publicar artifacts, publica el archivo y da el enlace. Si no, da la ruta del archivo para abrirlo con doble clic.
5. En el chat, resume en tres líneas: el titular, lo primero que arreglarías y el punto ciego mayor. Puede que no abra la página.
