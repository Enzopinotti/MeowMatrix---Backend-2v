# B3 — Auth/session/authorization security model

## Estado

B3 reemplaza el stack histórico mezclado de Passport, JWT y `express-session` por una única autoridad de sesión backend-owned. La implementación moderna ya incluye contrato HTTP, hashing, autorización, rate limiting, persistencia Mongo real y entrega SMTP de recovery. Si `MONGO_URL` no está configurado, `/healthz` sigue funcionando y auth responde explícitamente `503 AUTH_UNAVAILABLE`; no existe una base en memoria disfrazada de producción.

El issue histórico de rotación/revocación de secretos permanece separado y abierto: cambiar Git no puede revocar credenciales que hayan existido fuera del repositorio.

## Contrato HTTP

La autoridad vive bajo `/api/v1/auth`:

- `POST /register`
- `POST /login`
- `GET /me`
- `POST /logout`
- `POST /password-reset/request`
- `POST /password-reset/confirm`

Login devuelve únicamente usuario sanitizado y metadata de expiración. El identificador de sesión no aparece en JSON: viaja sólo en la cookie `meow_session` `HttpOnly`.

Logout es `POST`, revoca el digest server-side y expira la cookie. Registro no permite elegir rol.

## Passwords y migración histórica

Las contraseñas nuevas y de reset usan un formato versionado `scrypt$v1` con Node 24:

- N = 16384;
- r = 8;
- p = 1;
- salt aleatorio de 16 bytes;
- key derivada de 64 bytes;
- política de creación/reset: 12–128 caracteres.

Login tiene deliberadamente un contrato distinto: acepta 1–4096 caracteres para que cuentas históricas no queden bloqueadas antes de verificar el hash. El adapter reconoce hashes bcrypt `$2a$`, `$2b$` y `$2y$`; después de una autenticación bcrypt válida, la misma credencial ya verificada se rehashea inmediatamente a `scrypt$v1` sin imponer retroactivamente la política de contraseña nueva. Nuevas altas y resets siguen exigiendo 12–128.

La suite contiene una regresión específica para una contraseña bcrypt histórica corta y verifica que el hash resultante empiece con `scrypt$v1$`.

## Persistencia Mongo

La autoridad moderna reutiliza la colección histórica `users`; no crea una segunda identidad paralela. El adapter traduce los campos legacy (`password`, `rol`, `avatar`) al DTO moderno y conserva compatibilidad durante la migración.

Al iniciar con `MONGO_URL` configurado, se validan/crean:

- índice único case-insensitive de email en `users`;
- `auth_sessions` con `tokenHash` único, índice por usuario y TTL por `expiresAt`;
- `auth_password_resets` con `tokenHash` único, un reset activo por usuario y TTL.

La unicidad de email es responsabilidad atómica del repositorio. Un duplicate-key Mongo (`11000`) se convierte en `DuplicateAuthEmailError` y el servicio responde `409 EMAIL_ALREADY_REGISTERED`; no existe el patrón vulnerable `find → create`.

Si datos históricos impiden crear el índice único —por ejemplo emails duplicados sólo por casing— el arranque debe fallar y exigir limpieza explícita. No se corrigen identidades ambiguas automáticamente.

## Sesiones y tokens

Los identificadores de sesión y recovery usan 32 bytes aleatorios. Sólo SHA-256 de esos tokens cruza la frontera de persistencia. El token crudo de sesión existe únicamente en la cookie; el token de reset existe sólo para construir el mensaje de recovery.

Defaults:

- cookie `meow_session`;
- `HttpOnly`;
- `SameSite=Lax`;
- TTL de sesión: 8 horas;
- TTL de reset: 30 minutos;
- `Path=/`;
- `Secure=true` por defecto en producción.

`SameSite=None` exige `Secure=true` durante carga de configuración. Un reset exitoso revoca todas las sesiones activas del usuario.

## Recovery por SMTP

Con Mongo habilitado también son obligatorios `SMTP_HOST`, `SMTP_FROM` y `PASSWORD_RESET_URL`; `SMTP_USER` y `SMTP_PASSWORD` deben aparecer juntos si el servidor requiere autenticación. `PASSWORD_RESET_URL` debe ser HTTPS en producción.

La solicitud de reset siempre responde el mismo `202 {data:{accepted:true}}` para emails válidos, existan o no. Esto evita la enumeración de cuentas del backend histórico. El reset se consume atómicamente mediante `findOneAndDelete` con chequeo de expiración.

No se loguean tokens ni secretos.

## CORS y CSRF

`FRONTEND_ORIGINS` es una allow-list exacta; no existe wildcard con credenciales. Mutaciones browser-side verifican `Origin`, las requests usan JSON y la cookie es `HttpOnly` + `SameSite` según la topología configurada.

B7 deberá volver a validar esta frontera cuando se fije la topología final. Si frontend/API terminan siendo cross-site, la decisión `SameSite=None; Secure` debe documentarse junto con trusted proxy y enforcement compartido.

## Autorización

B3 exporta políticas reutilizables:

- `requireRole(...)`;
- `requireOwnerOrAdmin(...)`.

Los bloques siguientes deben derivar identidad/rol de la sesión backend-owned y nunca aceptar autoridad desde IDs o roles enviados por React.

## Rate limiting

El baseline single-process queda acotado y con memoria limitada:

- login: 10 intentos / 15 minutos / IP;
- registro: 8 intentos / hora / IP;
- password reset: 5 intentos / hora / IP;
- máximo 10.000 buckets en memoria;
- sweep periódico de buckets expirados y eviction al alcanzar el límite.

Esto evita crecimiento ilimitado dentro de un proceso, pero no pretende coordinación horizontal. Antes de varias réplicas, B7 debe mover enforcement a una capa compartida/edge.

## Variables de runtime

La autoridad moderna reconoce:

- `MONGO_URL`;
- `MONGO_DB_NAME` opcional;
- `FRONTEND_ORIGINS`;
- `SESSION_COOKIE_SECURE`;
- `SESSION_COOKIE_SAME_SITE`;
- `SESSION_TTL_SECONDS`;
- `RESET_TTL_SECONDS`;
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`;
- `SMTP_USER` + `SMTP_PASSWORD` opcionales como par;
- `SMTP_FROM`;
- `PASSWORD_RESET_URL`.

Ningún secreto debe versionarse.

## Evidencia de calificación

El finalizer B3 ejecutó el mismo `npm run check` de la autoridad moderna después de instalar el lockfile definitivo: format, ESLint, TypeScript, tests y build. La suite terminó con 26/26 tests verdes, incluyendo concurrencia de registro, migración bcrypt→scrypt, digest-only storage, reset one-time, revocación, Origin, rate limiting y contratos HTTP.

Los helpers temporales utilizados para producir lockfile/formato fueron retirados antes del HEAD candidato al merge. El merge sólo se permite cuando los workflows permanentes del PR estén verdes sobre ese HEAD limpio.
