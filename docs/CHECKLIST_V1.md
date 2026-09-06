# Checklist V1 — Tienda + Discord

## Cuentas y herramientas
- [ ] GitHub creado
- [ ] Cloudflare creado
- [ ] Discord creado
- [ ] PayPal Developer creado
- [ ] VS Code instalado
- [ ] Node.js instalado
- [ ] Git instalado

## Discord
- [ ] Servidor creado
- [ ] Canales creados: #bienvenida, #productos, #pedidos, #general, #avisos
- [ ] Aplicación creada en Discord Developer Portal
- [ ] Bot creado y token guardado de forma segura

## Web Astro
- [x] Proyecto Astro creado (carpeta o repo)
- [x] Astro configurado con adaptador de Cloudflare
- [x] Página de inicio con productos
- [x] Carrito básico (localStorage)
- [x] Flujo web preparado para crear y capturar órdenes PayPal en sandbox
- [ ] Deploy en Cloudflare Pages

## PayPal
- [ ] App creada en PayPal Developer
- [ ] CLIENT_ID y SECRET obtenidos
- [ ] Endpoint /create-order probado con credenciales sandbox
- [ ] Endpoint /capture-order probado con una orden sandbox
- [x] Botón de checkout PayPal integrado en la web

## Bot de Discord (Cloudflare Workers)
- [x] Worker creado para el bot
- [ ] Variables de entorno configuradas (DISCORD_TOKEN, DISCORD_PUBLIC_KEY, APPLICATION_ID)
- [ ] Comandos /productos y /stock registrados
- [ ] Bot invitado al servidor de Discord

## Producción
- [ ] Credenciales reales configuradas (PayPal, Discord)
- [ ] wrangler login ejecutado
- [ ] Deploy final comprobado en producción
- [ ] Flujo completo probado: catálogo -> carrito -> pago -> comandos de Discord


## Arquitectura Master Worker
- [x] Worker Maestro creado (workers/maestro)
- [x] Sub-worker discord-bot creado
- [x] Sub-worker paypal-payments creado
- [ ] Service Bindings configurados en wrangler.toml
- [ ] Despliegue de prueba en Cloudflare

Ver detalle en [ARQUITECTURA_MASTER_WORKER.md](./ARQUITECTURA_MASTER_WORKER.md).
