#!/usr/bin/env bash
# Front local en el móvil por un túnel de ngrok, sin desplegar nada. Un solo túnel al puerto del front:
# el front reenvía la API a su destino, así que todo va por el mismo origen y no hace falta CORS.
# ngrok da HTTPS, que el micrófono y la cámara exigen.
#
#   bash scripts/dev/tunel-movil.sh            # puerto por defecto (DEFAULT_PORT o FRONT_PORT)
#   bash scripts/dev/tunel-movil.sh 5173       # otro puerto
#
# NGROK_DOMAIN (entorno o .env de la raíz) fija un dominio propio de ngrok. Ctrl+C cierra el túnel.
set -euo pipefail

DEFAULT_PORT=5173  # AJUSTAR: el puerto del front del proyecto
PORT="${1:-${FRONT_PORT:-$DEFAULT_PORT}}"
INSPECT="http://127.0.0.1:4040"
ENV_FILE="${ENV_FILE:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)/.env}"

fail() { echo "✗ $*" >&2; exit 1; }

command -v ngrok >/dev/null || fail "ngrok no está instalado: https://ngrok.com/download"
ngrok config check >/dev/null 2>&1 || fail "ngrok no tiene configuración válida: ngrok config add-authtoken <TOKEN>"
grep -q "authtoken" "$(ngrok config check 2>&1 | sed -n 's/.*file at //p')" 2>/dev/null \
  || fail "ngrok no tiene authtoken: ngrok config add-authtoken <TOKEN>"

curl -s -o /dev/null -m 3 "http://localhost:$PORT/" || fail "El front no responde en localhost:$PORT. Levántalo:
  AJUSTAR: el comando que levanta el front del proyecto"

if curl -s -m 2 "$INSPECT/api/tunnels" >/dev/null 2>&1; then
  fail "Ya hay otro ngrok abierto ($INSPECT). Ciérralo antes; el plan gratuito admite uno."
fi

if [ -z "${NGROK_DOMAIN:-}" ] && [ -f "$ENV_FILE" ]; then
  NGROK_DOMAIN="$(sed -n 's/^NGROK_DOMAIN=//p' "$ENV_FILE" | tr -d '"\r' | tail -n 1)"
fi
ARGS=(http "$PORT" --host-header=rewrite --log=stdout --log-level=warn)
[ -n "${NGROK_DOMAIN:-}" ] && ARGS+=("--url=https://$NGROK_DOMAIN")

ngrok "${ARGS[@]}" >/dev/null &
NGROK_PID=$!
trap 'kill "$NGROK_PID" 2>/dev/null; echo; echo "Túnel cerrado."' EXIT INT TERM

URL=""
for _ in $(seq 1 30); do
  URL="$(curl -s -m 2 "$INSPECT/api/tunnels" 2>/dev/null | grep -o '"public_url":"https://[^"]*' | head -n 1 | cut -d'"' -f4 || true)"
  [ -n "$URL" ] && break
  kill -0 "$NGROK_PID" 2>/dev/null || fail "ngrok se cerró al arrancar; lánzalo a mano para ver el error: ngrok ${ARGS[*]}"
  sleep 1
done
[ -n "$URL" ] || fail "ngrok no dio una dirección pública en 30 s."

echo "✓ En el móvil: $URL"
echo "  La primera vez ngrok enseña un aviso: pulsa «Visit Site». Ctrl+C para cerrar."
wait "$NGROK_PID"
