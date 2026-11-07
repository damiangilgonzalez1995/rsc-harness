# Zonas de la auditoría

Encargo de cada subagente del paso 2 de [`SKILL.md`](SKILL.md). Copia el **marco común** en los tres encargos y añade la zona.

## Marco común

- Auditoría **solo de lectura**. Prohibido modificar ficheros.
- Prohibido lanzar pruebas o comandos que rehagan bases compartidas. Busca en el proyecto cuáles son y nómbralas en el encargo (por ejemplo, los tests de la base y `supabase db reset`).
- De `.env` y de los secretos, solo si la variable existe. Nunca su valor.
- Cada hallazgo, con evidencia `fichero:línea`. Lo que esté bien, una línea en «Bien hecho».
- Formato de cada hallazgo:
  - título;
  - gravedad (crítica, alta, media o baja);
  - controles afectados;
  - evidencia;
  - escenario concreto de ataque o de fallo;
  - arreglo en una o dos líneas.
- Hallazgos de más a menos grave, y después «Bien hecho» y «No aplica todavía (sin despliegue)».

## Zona 1. Identidad, autenticación y autorización

**Controles.**
- SOC 2: CC6.1, CC6.2, CC6.3, CC6.6 y CC6.7.
- ISO 27001: 5.15, 5.16, 5.17, 5.18, 8.2, 8.3, 8.4 y 8.5.
- ISO 27701: el acceso a datos personales.

**Qué revisar.**
- Rutas sin sesión.
- El rol, comprobado en el servidor en cada ruta.
- Acceso a registros ajenos (IDOR).
- Rutas de desarrollo o dobles que una variable de entorno pueda activar.
- RLS, `GRANT` y roles de la base, `SECURITY DEFINER` sin `search_path` y el uso de `service_role`.
- Fuentes externas que deban ser de solo lectura.
- Configuración de Auth: registro abierto, contraseñas, MFA y duración de los tokens.
- Registro de los accesos rechazados.

## Zona 2. Datos personales, retención y registros

**Controles.**
- ISO 27701: minimización, finalidad, retención y borrado, subencargados, transferencias y derechos del interesado.
- SOC 2: C1.1, C1.2, la serie P y CC7.2.
- ISO 27001: 5.12, 5.33, 5.34, 8.10, 8.11, 8.12, 8.15 y 8.24.

**Qué revisar.**
- Qué datos personales hay: voz, nombres, texto libre y conversación.
- Qué se manda a terceros (proveedores de IA), con `store` o la retención que se pida.
- Qué se escribe en los registros: trazas con variables locales, tokens, frases y ficheros de depuración.
- Si se puede borrar o caduca.
- Cifrado en tránsito.
- Si la pista de auditoría es de verdad inmutable.
- `.gitignore` y `git ls-files`, por si se ha colado algo sensible.

**Además entrega** la tabla «Inventario de datos personales»: dato, dónde vive, a qué tercero va y cuánto se guarda.

## Zona 3. Desarrollo seguro, secretos, dependencias y CI

**Controles.**
- SOC 2: CC6.8, CC7.1 y CC8.1.
- ISO 27001: 8.4, 8.7, 8.8, 8.9, 8.20, 8.25, 8.26, 8.27, 8.28, 8.29, 8.31 y 8.32.

**Qué revisar.**
- Secretos en git, también en el historial.
- Entrada no confiable:
  - subidas: tamaño, tipo y ruta;
  - SQL construido a mano;
  - longitud de los textos;
  - inyección de prompt con efecto en las herramientas;
  - fórmulas en el Excel.
- Límite de peticiones y de gasto:
  - por IP y por identidad, con la IP real tras el proxy;
  - más estricto en login, OTP, registro y endpoints que cuestan dinero;
  - un contador en memoria no vale con más de una réplica.
- Validación en el servidor, no solo en el navegador: rehacer a mano la petición con el campo que el formulario bloquearía.
- Sesiones que vencen, rotación del refresh y cookie `HttpOnly`/`Secure`/`SameSite`.
- Contraseñas con hash fuerte (Argon2id o bcrypt) y datos sensibles cifrados.
- CORS con lista de orígenes, nunca `*` con credenciales.
- Secretos de producción en la plataforma (Vercel, Supabase, GitHub), nunca solo en `.env` ni en el repo.
- Errores que filtran detalles internos, cabeceras, CSP y CORS.
- Front: `innerHTML` y dónde se guarda la sesión.
- Dependencias: si están fijadas y si algo las escanea. `npm audit` se puede lanzar porque solo lee.
- Docker: si corre como administrador, imágenes sin digest y puertos abiertos a `0.0.0.0`.
- CI: permisos del token, acciones sin SHA, Dependabot, SAST y búsqueda de secretos.
- SSH sin verificar la clave del servidor.
