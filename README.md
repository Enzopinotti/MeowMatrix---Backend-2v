# Meow Matrix — backend

Este repositorio preserva la evolución backend del proyecto iniciado en 2023 y emparejado luego con el frontend Meow Matrix.

## Historia y rollback

Baseline histórico pre-remediation:

```text
9cd1b87e69b6455487c64d7fdbe6ef0c90b73f88
```

Security baseline 2026:

```text
73ba6f1a9b470140630d5143f258bd50742c8b0f
```

`Proyecto_Backend` comparte commits con este repositorio y se conserva como ancestor/sibling histórico. La autoridad backend mantenida se desarrolla acá para evitar dos líneas modernas divergentes.

## Autoridad 2026

La nueva API vive en `modern/` y comienza con un objetivo deliberadamente pequeño:

- Node 24 + npm explícitos;
- Express + TypeScript strict;
- `createApp()` separado de `server.ts`;
- `/healthz` sin Mongo ni secretos;
- configuración validada antes de abrir el listener;
- respuesta 404 consistente;
- tests herméticos sin tocar servicios externos;
- CI read-only para lint, format, types, tests y build.

Mongo, auth, products, categories, cart, tickets/orders y uploads se migrarán por bloques después de fijar sus contratos. El backend histórico sigue disponible por SHA y no se reescribe para aparentar una arquitectura que no tenía.

Security blocker externo/histórico: issue #1.
Modernización full-stack: issue #3.
