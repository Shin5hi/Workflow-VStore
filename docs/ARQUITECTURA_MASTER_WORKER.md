# Arquitectura Master Worker (Orquestador + Sub-workers)

Este documento define el patrón de arquitectura backend para Workflow-VStore usando Cloudflare Workers.

## Idea general

En lugar de tener múltiples Workers independientes sin coordinación, se usa un **Worker Maestro (Orchestrator)** que:

- Recibe todas las peticiones externas (Discord Interactions, webhooks de PayPal, peticiones desde la web Astro).
- Valida la petición (firma de Discord, verificación de PayPal, etc.).
- Decide a qué **sub-worker** enviar la tarea, según el tipo de evento.
- Centraliza logs, manejo de errores y respuestas estándar.

Los **sub-workers** son responsables de una única función de negocio y no se exponen directamente a internet salvo que sea necesario.

## Estructura de carpetas propuesta

```
workers/
  maestro/          -> Worker Orquestador (entry point público)
    src/index.ts
    wrangler.toml
  discord-bot/       -> Sub-worker: comandos /productos /stock
    src/index.ts
    wrangler.toml
  paypal-payments/   -> Sub-worker: create-order / capture-order
    src/index.ts
    wrangler.toml
```

## Flujo de una petición (ejemplo: comando /productos en Discord)

1. Discord envía la interacción al Worker Maestro.
2. El Maestro verifica la firma (DISCORD_PUBLIC_KEY).
3. El Maestro identifica el tipo de comando y hace un `service binding` o `fetch` interno al sub-worker `discord-bot`.
4. El sub-worker consulta el catálogo (KV, D1 o API externa) y devuelve la respuesta.
5. El Maestro reenvía la respuesta a Discord en el formato esperado.

## Comunicación entre Maestro y sub-workers

Se recomienda usar **Service Bindings** de Cloudflare Workers (comunicación worker-to-worker sin salir a internet, más rápida y sin coste de petición HTTP externa), en lugar de llamadas HTTP públicas entre workers.

## Ventajas de este patrón

- Un único punto de entrada y de seguridad (validación de firmas, rate limiting).
- Sub-workers pequeños, fáciles de testear y desplegar por separado.
- Permite añadir nuevos sub-workers (ej. notificaciones, analíticas) sin tocar el resto.
- Encaja con el plan gratuito de Cloudflare Workers.

## Estado actual

- [ ] Worker Maestro creado (`workers/maestro`)
- [ ] Sub-worker `discord-bot` creado
- [ ] Sub-worker `paypal-payments` creado
- [ ] Service Bindings configurados en `wrangler.toml`
- [ ] Despliegue de prueba en Cloudflare

## Relación con otros documentos

- Ver [DECISIONES.md](./DECISIONES.md) para el contexto de por qué se eligió Cloudflare.
- Ver [CHECKLIST_V1.md](./CHECKLIST_V1.md) para el checklist operativo general.
