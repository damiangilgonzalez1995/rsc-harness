#!/usr/bin/env bash
# shortform-editing · comprueba y prepara las herramientas del editor de reels en Mac (y Linux) (adaptado de becario-editor v1.0).
# Uso:  bash preparar.sh --solo-comprobar   solo mira qué hay (no escribe nada)
#       bash preparar.sh                    mira; si todo está, guarda rutas.json; si falta algo, dice qué bajaría y para
#       bash preparar.sh --acepto           instala lo que falta (con permiso)
# Todo va a ~/.editor-video (o a $EDITOR_VIDEO_HOME), sin permisos de administrador, salvo lo que haga Homebrew si ya
# lo tienes. Las descargas se comprueban: Node con su SHASUMS256 oficial, uv con su .sha256, npm/pip con sus huellas.
# Sin --acepto no se descarga nada. Escribe rutas.json con python, node, npm, ffmpeg, ffprobe, hyperframes y modelo.

set -u
SOLO=0; ACEPTO=0
while [ $# -gt 0 ]; do
  case "$1" in
    --solo-comprobar) SOLO=1; shift ;;
    --acepto) ACEPTO=1; shift ;;
    *) echo "Opción desconocida: $1 (usa --solo-comprobar o --acepto)"; exit 2 ;;
  esac
done

BASE="${EDITOR_VIDEO_HOME:-$HOME/.editor-video}"
HF_VERSION="0.9.5"; GSAP_VERSION="3.15.0"; FW_VERSION="1.2.1"
export HYPERFRAMES_NO_TELEMETRY=1 npm_config_cache="$BASE/npm-cache" npm_config_update_notifier=false npm_config_fund=false npm_config_audit=false
SO="$(uname -s)"; ARQ="$(uname -m)"
case "$SO" in Darwin) SO_N="darwin" ;; Linux) SO_N="linux" ;; *) echo "FALLO sistema no compatible: $SO (usa preparar.ps1 en Windows)"; exit 1 ;; esac
case "$ARQ" in arm64|aarch64) ARQ_N="arm64"; UV_ARQ="aarch64" ;; x86_64|amd64) ARQ_N="x64"; UV_ARQ="x86_64" ;; *) echo "FALLO procesador no compatible: $ARQ"; exit 1 ;; esac
BREW=""; for b in /opt/homebrew/bin/brew /usr/local/bin/brew; do [ -x "$b" ] && BREW="$b" && break; done
[ -z "$BREW" ] && command -v brew >/dev/null 2>&1 && BREW="$(command -v brew)"

sha256() { if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | cut -d' ' -f1; else shasum -a 256 "$1" | cut -d' ' -f1; fi; }
bajar() { curl -fsSL --retry 2 -o "$2" "$1"; }
version_mayor() { "$1" -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0; }
hay_nvidia() { command -v nvidia-smi >/dev/null 2>&1 && nvidia-smi -L >/dev/null 2>&1; }
modelo_principal() { if hay_nvidia; then echo large-v3-turbo; else echo small; fi; }
modelo_ok() { [ -f "$BASE/modelos/whisper-$1/model.bin" ]; }

# ------------------------------------------------------------ buscar lo que ya hay
buscar_node() {
  NODE=""
  for n in "$BASE/node/bin/node" "$(command -v node 2>/dev/null)" /opt/homebrew/bin/node /usr/local/bin/node; do
    [ -n "$n" ] && [ -x "$n" ] && [ "$(version_mayor "$n")" -ge 22 ] 2>/dev/null && NODE="$n" && break
  done
  NPM=""; [ -n "$NODE" ] && [ -x "$(dirname "$NODE")/npm" ] && NPM="$(dirname "$NODE")/npm"
  [ -n "$NODE" ] && [ -z "$NPM" ] && NPM="$(command -v npm 2>/dev/null)"
}
buscar_ffmpeg() {
  FFMPEG=""; FFPROBE=""
  for d in "$BASE/ffmpeg" "$(dirname "$(command -v ffmpeg 2>/dev/null || echo /x/x)")" /opt/homebrew/bin /usr/local/bin /usr/bin; do
    if [ -x "$d/ffmpeg" ] && [ -x "$d/ffprobe" ] && "$d/ffmpeg" -version >/dev/null 2>&1; then FFMPEG="$d/ffmpeg"; FFPROBE="$d/ffprobe"; break; fi
  done
}
python_valido() { "$1" -c 'import sys; sys.exit(0 if (3,10) <= sys.version_info[:2] <= (3,13) else 1)' >/dev/null 2>&1; }
buscar_python() {
  PYSIS=""
  for p in python3.12 python3.11 python3.13 python3.10 python3 /opt/homebrew/bin/python3.12 /usr/local/bin/python3.12; do
    c="$(command -v "$p" 2>/dev/null)"; [ -n "$c" ] || continue
    # en Mac, /usr/bin/python3 sin las herramientas de Xcode abre una ventana de instalación: se salta
    [ "$SO_N" = "darwin" ] && [ "$c" = "/usr/bin/python3" ] && ! xcode-select -p >/dev/null 2>&1 && continue
    python_valido "$c" && PYSIS="$c" && break
  done
}
venv_ok() { [ -x "$BASE/venv/bin/python" ] && "$BASE/venv/bin/python" -c 'import faster_whisper, cv2, mediapipe, PIL, numpy' >/dev/null 2>&1; }
buscar_chrome() {
  CHROME=""
  for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" "/Applications/Chromium.app/Contents/MacOS/Chromium" \
           "$(command -v google-chrome 2>/dev/null)" "$(command -v chromium 2>/dev/null)" "$(command -v chromium-browser 2>/dev/null)"; do
    [ -n "$c" ] && [ -x "$c" ] && CHROME="$c" && break
  done
}
motor_ok() { [ -f "$BASE/hyperframes/node_modules/hyperframes/bin/hyperframes.mjs" ] && [ -f "$BASE/hyperframes/node_modules/gsap/dist/gsap.min.js" ]; }

informe() {
  buscar_node; buscar_ffmpeg; buscar_python
  local g="no"; hay_nvidia && g="sí (Whisper irá en la tarjeta gráfica)"
  echo "Sistema: $SO $ARQ · GPU NVIDIA: $g · Homebrew: ${BREW:-no} · carpeta de herramientas: $BASE"
  if [ -n "$NODE" ]; then echo "OK    Node.js $("$NODE" -v) ($NODE)"; else echo "FALTA Node.js 22 o posterior"; fi
  if [ -n "$FFMPEG" ]; then echo "OK    FFmpeg ($FFMPEG)"; else echo "FALTA FFmpeg y FFprobe"; fi
  if [ -n "$PYSIS" ]; then echo "OK    Python ($PYSIS)"; else echo "FALTA Python 3.10-3.13 (se usaría uv con un Python propio)"; fi
  if venv_ok; then echo "OK    Whisper y librerías de efectos ($BASE/venv)"; else echo "FALTA Whisper y librerías de efectos (faster-whisper, mediapipe, opencv)"; fi
  if motor_ok; then echo "OK    HyperFrames ($BASE/hyperframes)"; else echo "FALTA HyperFrames (subtítulos animados y recursos)"; fi
  local m; m="$(modelo_principal)"
  if modelo_ok "$m"; then echo "OK    modelo de voz Whisper $m"; else echo "FALTA modelo de voz Whisper $m"; fi
}

faltan() {
  FALTAN=()
  buscar_node; buscar_ffmpeg
  [ -z "$NODE" ] && FALTAN+=("Node.js 22 (Homebrew o nodejs.org, ~40 MB)")
  [ -z "$FFMPEG" ] && FALTAN+=("FFmpeg y FFprobe (Homebrew o npm, ~80 MB)")
  venv_ok || FALTAN+=("Whisper y librerías de efectos en un Python propio (faster-whisper, mediapipe, opencv; ~600 MB)")
  motor_ok || FALTAN+=("HyperFrames $HF_VERSION y GSAP $GSAP_VERSION con su navegador (npm, ~250 MB)")
  local m; m="$(modelo_principal)"
  if ! modelo_ok "$m"; then
    if [ "$m" = "small" ]; then FALTAN+=("Modelo de voz Whisper small (Hugging Face, ~240 MB)")
    else FALTAN+=("Modelo de voz Whisper $m (Hugging Face, ~1,6 GB)"); fi
  fi
}

# ------------------------------------------------------------ instalar (solo con --acepto)
instalar_node() {
  buscar_node; [ -n "$NODE" ] && return 0
  if [ -n "$BREW" ]; then echo "· Instalando Node.js con Homebrew…"; "$BREW" install node >/dev/null 2>&1; buscar_node; [ -n "$NODE" ] && return 0; fi
  echo "· Descargando Node.js 22 (nodejs.org, comprobado con SHASUMS256)…"
  local tmp; tmp="$(mktemp -d)"
  bajar "https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt" "$tmp/SHASUMS256.txt" || { echo "FALLO no se pudo descargar la lista de Node.js"; return 1; }
  local linea fich suma
  linea="$(grep -E "node-v22\.[0-9.]+-$SO_N-$ARQ_N\.tar\.gz$" "$tmp/SHASUMS256.txt" | head -1)"
  suma="${linea%% *}"; fich="${linea##* }"
  [ -z "$fich" ] && { echo "FALLO no hay Node.js 22 para $SO_N-$ARQ_N"; return 1; }
  bajar "https://nodejs.org/dist/latest-v22.x/$fich" "$tmp/$fich" || { echo "FALLO no se pudo descargar $fich"; return 1; }
  [ "$(sha256 "$tmp/$fich")" = "$suma" ] || { echo "FALLO la descarga de Node.js no coincide con su sha256; descartada"; rm -rf "$tmp"; return 1; }
  rm -rf "$BASE/node"; mkdir -p "$BASE/node"
  tar -xzf "$tmp/$fich" -C "$BASE/node" --strip-components=1 && rm -rf "$tmp"
  buscar_node; [ -n "$NODE" ]
}

instalar_ffmpeg() {
  buscar_ffmpeg; [ -n "$FFMPEG" ] && return 0
  if [ -n "$BREW" ]; then echo "· Instalando FFmpeg con Homebrew (tarda unos minutos)…"; "$BREW" install ffmpeg >/dev/null 2>&1; buscar_ffmpeg; [ -n "$FFMPEG" ] && return 0; fi
  echo "· Instalando FFmpeg y FFprobe desde npm (versión ligera, sin administrador)…"
  mkdir -p "$BASE/ffmpeg-npm" "$BASE/ffmpeg"
  PATH="$(dirname "$NODE"):$PATH" "$NPM" install -q --prefix "$BASE/ffmpeg-npm" @ffmpeg-installer/ffmpeg @ffprobe-installer/ffprobe >/dev/null 2>&1 \
    || { echo "FALLO npm no pudo instalar FFmpeg"; return 1; }
  local f p
  f="$(cd "$BASE/ffmpeg-npm" && "$NODE" -p "require('@ffmpeg-installer/ffmpeg').path" 2>/dev/null)"
  p="$(cd "$BASE/ffmpeg-npm" && "$NODE" -p "require('@ffprobe-installer/ffprobe').path" 2>/dev/null)"
  [ -f "$f" ] && [ -f "$p" ] || { echo "FALLO no encuentro los binarios de FFmpeg de npm"; return 1; }
  cp "$f" "$BASE/ffmpeg/ffmpeg"; cp "$p" "$BASE/ffmpeg/ffprobe"; chmod u+x "$BASE/ffmpeg/ffmpeg" "$BASE/ffmpeg/ffprobe"
  [ "$SO_N" = "darwin" ] && xattr -d com.apple.quarantine "$BASE/ffmpeg/ffmpeg" "$BASE/ffmpeg/ffprobe" 2>/dev/null
  rm -rf "$BASE/ffmpeg-npm"
  buscar_ffmpeg; [ -n "$FFMPEG" ]
}

conseguir_uv() {
  UV="$(command -v uv 2>/dev/null)"; [ -x "$BASE/uv/uv" ] && UV="$BASE/uv/uv"
  [ -n "$UV" ] && return 0
  local destino="uv-$UV_ARQ-apple-darwin"; [ "$SO_N" = "linux" ] && destino="uv-$UV_ARQ-unknown-linux-gnu"
  echo "· Descargando uv (gestor de Python de Astral, comprobado con su sha256)…"
  local tmp; tmp="$(mktemp -d)"
  bajar "https://github.com/astral-sh/uv/releases/latest/download/$destino.tar.gz" "$tmp/uv.tar.gz" \
    && bajar "https://github.com/astral-sh/uv/releases/latest/download/$destino.tar.gz.sha256" "$tmp/uv.sha256" \
    || { echo "FALLO no se pudo descargar uv"; return 1; }
  [ "$(sha256 "$tmp/uv.tar.gz")" = "$(cut -d' ' -f1 "$tmp/uv.sha256")" ] || { echo "FALLO uv no coincide con su sha256; descartado"; return 1; }
  mkdir -p "$BASE/uv"; tar -xzf "$tmp/uv.tar.gz" -C "$BASE/uv" --strip-components=1 && rm -rf "$tmp"
  UV="$BASE/uv/uv"; [ -x "$UV" ]
}

PAQUETES=("faster-whisper==$FW_VERSION" mediapipe opencv-python pillow numpy pytest)

instalar_whisper() {
  venv_ok && return 0
  buscar_python
  if [ -z "$PYSIS" ] && [ -n "$BREW" ]; then echo "· Instalando Python 3.12 con Homebrew…"; "$BREW" install python@3.12 >/dev/null 2>&1; buscar_python; fi
  echo "· Instalando en $BASE/venv: ${PAQUETES[*]} (puede tardar unos minutos)…"
  rm -rf "$BASE/venv"
  if [ -n "$PYSIS" ] && "$PYSIS" -m venv "$BASE/venv" >/dev/null 2>&1 \
     && "$BASE/venv/bin/python" -m pip install -q --disable-pip-version-check "${PAQUETES[@]}" >/dev/null 2>&1; then
    venv_ok && return 0
  fi
  echo "· Python del sistema no sirve; uso uv con un Python 3.12 propio…"
  rm -rf "$BASE/venv"
  conseguir_uv || return 1
  export UV_PYTHON_INSTALL_DIR="$BASE/uv/python" UV_CACHE_DIR="$BASE/uv/cache"
  "$UV" venv -q --python 3.12 "$BASE/venv" >/dev/null 2>&1 \
    && "$UV" pip install -q --python "$BASE/venv/bin/python" "${PAQUETES[@]}" >/dev/null 2>&1
  rm -rf "$BASE/uv/cache"
  venv_ok || { echo "FALLO no se pudo instalar faster-whisper y las librerías de efectos"; return 1; }
}

instalar_modelo() {
  local m; m="$(modelo_principal)"
  modelo_ok "$m" && return 0
  echo "· Descargando el modelo de voz Whisper $m (Hugging Face, una sola vez)…"
  mkdir -p "$BASE/modelos/whisper-$m"
  "$BASE/venv/bin/python" -c 'import sys; from faster_whisper import download_model; download_model(sys.argv[1], output_dir=sys.argv[2])' \
    "$m" "$BASE/modelos/whisper-$m" >/dev/null 2>&1
  modelo_ok "$m" || { echo "FALLO el modelo $m no se ha descargado entero; borra $BASE/modelos/whisper-$m y repite"; return 1; }
}

instalar_motor() {
  export PATH="$(dirname "$NODE"):$(dirname "$FFMPEG"):$PATH"
  CHROME_FIJO=""
  if ! motor_ok; then
    echo "· Instalando HyperFrames $HF_VERSION y GSAP $GSAP_VERSION (sin skills globales)…"
    mkdir -p "$BASE/hyperframes"
    "$NPM" install -q --prefix "$BASE/hyperframes" "hyperframes@$HF_VERSION" "gsap@$GSAP_VERSION" >/dev/null 2>&1 \
      || { echo "FALLO npm no pudo instalar HyperFrames"; return 1; }
  fi
  local hf="$BASE/hyperframes/node_modules/hyperframes/bin/hyperframes.mjs"
  "$NODE" "$hf" browser ensure >/dev/null 2>&1 \
    || { buscar_chrome; [ -n "$CHROME" ] && CHROME_FIJO="$CHROME" || echo "AVISO HyperFrames no pudo bajar su navegador; se reintentará al montar"; }
  motor_ok
}

escribir_rutas() {
  mkdir -p "$BASE"
  local py="$BASE/venv/bin/python"; [ -x "$py" ] || py="$PYSIS"
  "$py" - "$BASE" "$NODE" "$NPM" "$FFMPEG" "$FFPROBE" "${CHROME_FIJO:-}" "$(modelo_principal)" <<'PY'
import json, sys, os
base, node, npm, ff, fp, chrome, modelo = sys.argv[1:8]
ruta = os.path.join(base, "rutas.json")
try:
    datos = json.load(open(ruta, encoding="utf-8"))
except Exception:
    datos = {}
datos.update({"node": node, "npm": npm, "ffmpeg": ff, "ffprobe": fp, "python": os.path.join(base, "venv", "bin", "python"),
              "hyperframes": os.path.join(base, "hyperframes"), "modelo": modelo})
if chrome:
    datos["chrome"] = chrome
with open(ruta, "w", encoding="utf-8") as f:
    json.dump(datos, f, indent=2, ensure_ascii=False)
print("OK    rutas guardadas en " + ruta)
PY
}

# ------------------------------------------------------------ orden
informe
[ "$SOLO" = "1" ] && exit 0

faltan
if [ "${#FALTAN[@]}" -gt 0 ] && [ "$ACEPTO" != "1" ]; then
  echo
  echo "Para seguir hay que descargar e instalar (todo en $BASE, salvo lo que haga Homebrew):"
  for f in "${FALTAN[@]}"; do echo "  - $f"; done
  echo "No he descargado nada. Si das permiso, vuelve a ejecutar con --acepto."
  exit 3
fi
if [ "${#FALTAN[@]}" -gt 0 ]; then
  mkdir -p "$BASE"
  instalar_node    || { echo "FALLO Node.js"; exit 1; }
  instalar_ffmpeg  || { echo "FALLO FFmpeg"; exit 1; }
  instalar_whisper || { echo "FALLO Whisper"; exit 1; }
  instalar_modelo  || { echo "FALLO modelo de voz"; exit 1; }
  instalar_motor   || { echo "FALLO HyperFrames"; exit 1; }
  rm -rf "$BASE/npm-cache"
  echo; informe
fi
escribir_rutas || { echo "FALLO al guardar rutas.json"; exit 1; }
echo "LISTO. Python del editor: $BASE/venv/bin/python"
exit 0
