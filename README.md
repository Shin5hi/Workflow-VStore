# Workflow-VStore

[![CI](https://github.com/Shin5hi/Workflow-VStore/actions/workflows/ci.yml/badge.svg)](https://github.com/Shin5hi/Workflow-VStore/actions/workflows/ci.yml)

Workflow para tienda en Discord + Web con Astro

## Discord

La estructura inicial del servidor esta documentada en [docs/discord-server-setup.md](docs/discord-server-setup.md).

Comandos utiles:

```bash
npm run discord:plan
npm run discord:apply
```

Para aplicar cambios reales en Discord hace falta configurar `DISCORD_BOT_TOKEN` y `DISCORD_GUILD_ID` como variables de entorno. El modo `discord:plan` no modifica el servidor.


## Documentacion

- [Documentacion general del proyecto](docs/README_PROYECTO.md)
- [Checklist V1](docs/CHECKLIST_V1.md)
- [Decisiones tecnicas](docs/DECISIONES.md)
- [Setup del servidor de Discord](docs/discord-server-setup.md)
- [Arquitectura Master Worker](docs/ARQUITECTURA_MASTER_WORKER.md)

## Estructura del proyecto

```
docs/       -> Documentacion del proyecto (decisiones, checklist, arquitectura)
web/        -> Sitio Astro (catalogo + carrito), desplegado en Cloudflare Pages
workers/
  maestro/       -> Worker Orquestador (punto de entrada publico)
  discord-bot/   -> Sub-worker: comandos /productos /stock
scripts/discord/ -> Scripts de aprovisionamiento del servidor de Discord
```

Nota: el proyecto VTuber (Shinshi) se desarrolla por separado y no forma parte de este workflow de tienda en la V1.

