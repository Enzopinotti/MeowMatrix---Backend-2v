# B0 — frozen backend qualification

Fecha de cierre técnico: 2026-09-16.

## Baselines

Historical backend: `9cd1b87e69b6455487c64d7fdbe6ef0c90b73f88`.

Security baseline: `73ba6f1a9b470140630d5143f258bd50742c8b0f`.

Frontend histórico emparejado: `452ca67fe3fe494ad7caa731c944d352973276d9`.

## Matriz

Run one-shot: `35053239194`.

La matriz probó el árbol histórico y el security baseline sobre Node 20/22/24.

- `npm ci` funciona con el lockfile histórico;
- `src/app.js` y `src/index.js` parsean en los runtimes probados;
- se descubren cinco archivos de test históricos;
- `npm test` no es hermético: conecta Mongo durante setup/import y falla si `MONGO_URL` no está presente;
- parte de la suite usa el antiguo backend Railway como target, por lo que tampoco representa un integration gate local controlado;
- el security baseline mantiene su gate independiente en verde;
- Node 24/npm 11 hace visible el install script nativo histórico de `bcrypt`, otra razón para tratar dependencias ejecutables como decisión explícita en la migración.

## Deployment

Los hostnames Railway embebidos históricamente no resolvieron DNS en la verificación actual. Se documentan como endpoints anteriores, no como producción vigente.

GitHub muestra integración/status de Vercel para este repo, pero un status de proveedor no sustituye un smoke HTTP/API. La autoridad pública 2026 se definirá recién en B7.

## Decisiones para B1

- Node 24;
- npm, manteniendo el menor cambio posible después de probar `npm ci`;
- Express se conserva como framework HTTP;
- la autoridad mantenida vive en `modern/`;
- TypeScript strict;
- app factory separada del proceso/listener;
- ningún acceso a Mongo al importar el módulo de aplicación;
- health y tests foundation sin credenciales externas;
- Mongo/Mongoose se incorporarán detrás de un lifecycle explícito en el siguiente bloque de datos/API;
- Kubernetes, brokers, Redis, microservices y otras capas no entran sin requirement demostrado.
