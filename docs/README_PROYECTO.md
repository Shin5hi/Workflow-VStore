# Workflow-VStore — Documentación del proyecto

## Visión general
Proyecto de tienda online integrada con Discord, construido con tecnologías gratuitas / open source y desplegado en la nube (Cloudflare).

La V1 se centra exclusivamente en:
- Web de catálogo y carrito (Astro + Cloudflare Pages)
- Pagos con PayPal
- Bot de Discord para consultar productos y stock (Cloudflare Workers)
- Servidor de Discord como centro de comunidad y soporte

Queda fuera de la V1 cualquier funcionalidad relacionada con el proyecto VTuber (Shinshi), que se aborda en una fase posterior (V2+).

## Arquitectura

```
Discord (comunidad + bot) <--> Cloudflare Workers (lógica bot) <--> Web Astro (Cloudflare Pages)
                                        |
                                     PayPal API
```

- **Discord**: servidor de comunidad + comandos slash (/productos, /stock)
- **Astro**: framework de la web pública (catálogo, fichas de producto, carrito)
- **Cloudflare Pages**: hosting gratuito de la web Astro
- **Cloudflare Workers**: backend serverless para el bot de Discord y los endpoints de PayPal
- **Node.js**: entorno de desarrollo local y scripts
- **GitHub**: control de versiones y documentación del proyecto

## Estado actual

- Fase 1-2: Web Astro + catálogo + carrito — base funcional
- Fase 3: Integración PayPal — preparada para Sandbox; requiere secretos y despliegue
- Fase 4: Bot de Discord en Workers — pendiente
- Fase 5: Despliegue en producción — pendiente

## Hosting elegido

La opción principal es Cloudflare Pages para Astro SSR junto con Cloudflare Workers para el Worker Maestro y sus sub-workers. El frontend acepta `PUBLIC_API_BASE_URL` para apuntar al Worker Maestro; si queda vacío, usa el mismo origen. Vercel es una alternativa viable para Astro SSR, pero no es la opción principal porque separaría el frontend de los Workers de Discord y pagos ya definidos.

Consulta `docs/CHECKLIST_V1.md` para el detalle tarea a tarea.

## Roadmap (V2+)

- Proyecto VTuber Shinshi (PNGTuber, voz TTS, contenido en redes)
- Automatizaciones avanzadas (Activepieces, GitHub Actions)
- Paneles con autenticación (Stytch)
- Integraciones adicionales (HubSpot, Slack)

Ver `docs/DECISIONES.md` para el porqué de cada decisión tomada.
