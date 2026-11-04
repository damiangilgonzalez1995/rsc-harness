---
name: tunel-ngrok
description: "Use when the user wants to open a local project's frontend on their phone without deploying, share the local environment through a public URL, get HTTPS for the microphone or camera, or set up ngrok in a project. One ngrok tunnel to the frontend port; the frontend proxies the API so the phone sees a single HTTPS origin. NOT deploying to a real host (that is `deployment`)."
tags: [ngrok, tunnel, mobile, https, local-dev]
recommends: [deployment]
profiles: [minimal, core, ui, full]
origin: damiangil
---

# Túnel ngrok al front

**Un solo túnel, al puerto del front.** El front reenvía la API (y el login, si va por el mismo servidor) a sus destinos, así que el móvil ve un único origen HTTPS: sin CORS, sin IPs, sin certificados.

## Pasos

1. **Explora y enseña el plan antes de tocar nada.** Localiza y anota:
   - el servidor del front y su puerto: Vite, Angular, Next, o un nginx/Caddy en Docker que sirve el build;
   - el prefijo de la API (`/api`…) y de cualquier otra ruta del backend (`/auth/v1`, `/ws`…);
   - dónde define el front la URL de la API;
   - si ya existe un reenvío (`server.proxy` de Vite, `proxyConfig` de Angular, `rewrites` de Next, `location` de nginx);
   - si el login usa un proveedor externo con lista de redirecciones (Supabase OAuth, Auth0, Google…);
   - si hay otro ngrok abierto: `curl -s http://127.0.0.1:4040/api/tunnels`.
   Termina con la lista de ficheros que tocarás y sus riesgos, y espera el visto bueno.
2. **Reenvío en el front**, solo si falta. El destino sale de una variable de entorno (reusa la que tenga el proyecto; si no hay, `API_PROXY_TARGET`): dentro de Docker, el nombre del servicio (`http://backend:8000`); en el host, el puerto publicado. Incluye cada prefijo del backend que llame el navegador, websockets con `ws: true`.
3. **URL relativa solo en desarrollo:** el front llama a `'/api'`. Producción queda como está.
4. **CORS intacto:** con un solo origen sobra; ningún dominio de ngrok entra en la lista.
5. **Script del túnel:** copia [`tunel.sh`](tunel.sh) a donde el proyecto guarde sus scripts (por defecto `scripts/dev/tunel-movil.sh`) y ajusta `DEFAULT_PORT` y los mensajes de cómo levantar el front. Respeta las reglas del repo sobre dónde van los scripts y regístralo donde se listen.
6. **Login externo:** si hay redirecciones de OAuth o enlaces mágicos, dile al usuario que añada el dominio de ngrok a la lista del proveedor, y recomienda `NGROK_DOMAIN` (dominio fijo gratuito) para añadirlo una sola vez. Con usuario y contraseña no hace falta nada.
7. **Documenta** en dos líneas cómo usarlo, donde el proyecto explique el entorno local, avisando de que la URL es pública mientras está abierta.
8. **Verifica**; el trabajo está hecho cuando todo esto da lo esperado:
   - `curl localhost:<puerto>/api/...` responde el backend (un 401 en JSON del backend vale);
   - con el túnel abierto, `curl -H 'ngrok-skip-browser-warning: 1' <url-ngrok>/` da 200 y `<url-ngrok>/api/...` responde el backend;
   - si hay login, un login real por la URL de ngrok devuelve token y una ruta protegida responde con él;
   - el script falla con mensaje claro si ya hay otro ngrok abierto y si el front no responde.

## Trampas

- **Host desconocido:** Vite (`server.allowedHosts`), Angular y webpack rechazan el dominio de ngrok. `--host-header=rewrite` lo resuelve sin tocar la configuración.
- **Un túnel por cuenta gratuita:** si hay otro abierto, ciérralo solo con permiso del usuario.
- **Aviso de ngrok:** el navegador ve una página intermedia la primera vez («Visit Site»); `curl` la salta con `ngrok-skip-browser-warning: 1`.
- **Micrófono, cámara o ubicación** necesitan HTTPS: ngrok lo da, la IP local por HTTP no.
- **Windows:** el script es bash para Git Bash; lánzalo con `bash ruta/al/script.sh`.
