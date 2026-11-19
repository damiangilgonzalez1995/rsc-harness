# Problemas y soluciones

Primero, siempre: `preparar.ps1 -SoloComprobar` (Windows) o `bash preparar.sh --solo-comprobar` (Mac/Linux), que
dice qué falta sin escribir nada, y `python editor.py estado`, que dice qué herramientas y modelos hay en
`~/.editor-video`.

Las órdenes de esta página van desde la carpeta `scripts/` de la skill y con el Python de
`~/.editor-video/rutas.json`. `ROOT` es la raíz del proyecto (la carpeta que contiene `reels/`).

## Preparación (paso 1)
- **No instala nada**: es lo esperado sin permiso. Sin `-Acepto` / `--acepto` solo dice qué bajaría y cuánto
  ocupa (sale con código 3). Explica la lista a la persona, pide permiso y repite con `-Acepto` / `--acepto`.
- **Windows · «la ejecución de scripts está deshabilitada»**: usa exactamente
  `powershell -NoProfile -ExecutionPolicy Bypass -File "…\preparar.ps1" -Acepto` (solo afecta a esa orden).
- **Windows · FFmpeg no se instala**: el script prueba con winget (`Gyan.FFmpeg`). Si winget no existe, baja la
  versión «essentials» de gyan.dev, descomprime su carpeta `bin` en `~/.editor-video/ffmpeg` y repite.
- **Windows · «Python» abre la Microsoft Store**: es un acceso directo falso de Windows; el script lo ignora y, si
  no hay otro Python 3.10-3.13, usa uv con un Python 3.12 propio.
- **Mac sin Homebrew**: no hace falta; se usan Node.js portable, FFmpeg desde npm y Python con uv, todo en
  `~/.editor-video`.
- **Mac · «no se puede abrir porque no se puede verificar el desarrollador» (ffmpeg)**:
  `xattr -d com.apple.quarantine ~/.editor-video/ffmpeg/ffmpeg ~/.editor-video/ffmpeg/ffprobe`.
- **Mac Intel antiguo (macOS 12 o anterior)**: puede que no haya paquetes de faster-whisper o mediapipe para su
  sistema; dilo claramente y propón actualizar macOS.
- **Se corta a medias**: vuelve a lanzar la misma orden; salta lo que ya está.
- **Sin internet o con un proxy de empresa**: npm, pip y las descargas fallarán. Pide que lo intente en otra red.
- **Antivirus que borra ffmpeg.exe**: que restaure el archivo y lo marque como seguro (es la compilación de
  gyan.dev que enlaza ffmpeg.org, o la de npm).

## Navegador del motor (HyperFrames)
- **«Chrome not found» al montar**: `node <hyperframes>/node_modules/hyperframes/bin/hyperframes.mjs browser ensure`.
  Si no se puede descargar, pon en `~/.editor-video/rutas.json` la clave `"chrome"` con la ruta de Chrome o de Edge
  (Windows: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`).
- **«sub_timeline_script_failure» con gsap**: la composición no encuentra GSAP en local; comprueba que existe
  `<hyperframes>/node_modules/gsap/dist/gsap.min.js` o repite la preparación.

## Whisper (transcripción)
- **«no está el modelo de voz»**: `editor.py` nunca descarga nada. Repite la preparación con permiso; baja
  large-v3-turbo si hay GPU NVIDIA, small si no.
- **Con GPU sale «CUDA no disponible; uso large-v3-turbo en CPU»**: faltan las DLL de CUDA/cuDNN o el controlador
  es antiguo. Funciona igual, con el mismo modelo, pero bastante más lento. Actualiza el controlador de NVIDIA o
  repite la preparación con permiso (reinstala las librerías CUDA del entorno).
- **«Whisper no ha oído ninguna palabra»**: `cortar` deja `cortado.palabras.json` vacío y el reel saldría sin
  subtítulos. Comprueba que el bruto tiene voz y se oye bien (no solo música).
- **Transcribe mal nombres propios**: corrige `reels/trabajo/X/cortado.palabras.json` (campo `p` de cada palabra)
  antes de montar; el montaje usa ese fichero, no el `.srt`.
- **Va muy lento**: sin GPU es normal (unos 1-2 minutos por minuto de vídeo).

## Cortes (FFmpeg)
- **El corte de silencios se come palabras**: sube `--margen` (0,2) o baja `--umbral` (-45):
  `editor.py cortar ROOT reels/brutos/X.mp4 --margen 0.2`. Si deja demasiadas pausas, sube `--umbral` (-30) o baja
  `--minimo` (0,35). Se puede repetir: `cortar` rehace `reels/trabajo/X/` y nunca toca `reels/brutos/`.
- **«todo el clip parece silencio»**: el volumen es muy bajo; prueba `--umbral -45` o `-50`.
- **«el clip no tiene sonido»**: el bruto no trae pista de audio; pide el vídeo original del móvil.
- **Vídeo del móvil con la imagen girada**: FFmpeg respeta la rotación al cortar; si aun así sale mal, pide el
  vídeo exportado de nuevo desde el móvil.
- **Rutas con espacios o tildes**: funcionan; si un error menciona la ruta, cópiala entre comillas tal cual.

## Hoja de contacto
- **«no encuentro el clip … cortado.mp4»**: corta primero el bruto (`editor.py cortar ROOT reels/brutos/X.mp4`).
- **La hoja no muestra los recursos**: pásale el plan: `hoja.py ROOT X --plan reels/trabajo/X/plan.json`.
- **«el efecto … no existe» / «el recurso … no existe»**: el plan pide un nombre mal escrito. Lista los efectos con
  `python fx/fx.py --list` y los recursos en `motor/recursos/`.

## Efectos (fx)
- **«No module named cv2 / mediapipe»**: no se está usando el Python del editor; usa el de `rutas.json`.
- **El efecto no encuentra la cara**: la persona debe verse de frente y con luz; los efectos van detrás de la cabeza
  y necesitan la cara en el plano.
