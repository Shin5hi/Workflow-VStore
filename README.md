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
