# Contexto del proyecto y decisiones del hilo

Este documento conserva el contexto técnico tratado durante este hilo para que el proyecto pueda retomarse sin perder decisiones ni pendientes.

## 1. Punto de partida

`Workflow-VStore` es un workflow para una tienda integrada con Discord y una web. La V1 contempla:

- Web de catálogo y carrito.
- Pagos con PayPal.
- Bot de Discord para consultar productos y stock.
- Cloudflare Workers como backend serverless.
- GitHub como repositorio y documentación del proyecto.

El proyecto VTuber de Shinshi queda fuera de esta V1.

## 2. Revisión inicial de interfaz

Se revisó la página `web/src/pages/index.astro` contra las Web Interface Guidelines. Las observaciones iniciales fueron:

- Faltaba un enlace para saltar al contenido principal y un landmark `<main>`.
- El precio usaba un formato numérico fijo en vez de `Intl.NumberFormat`.
- Los botones no tenían un estado de foco visible explícito.
- `alert()` no era una buena solución para anunciar que un producto se añadió al carrito; se recomendó un estado accesible con `aria-live`.

Estas observaciones guiaron los cambios de accesibilidad y presentación de la página.

## 3. Estado encontrado

La web ya estaba iniciada con:

- Astro 6.
- `output: 'server'`.
- Adaptador oficial `@astrojs/cloudflare`.
- Catálogo de ejemplo.
- Carrito persistido en `localStorage`.
- Flujo de creación y captura de órdenes PayPal en Sandbox.

Los Workers existentes son:

```text
workers/maestro/           Worker público y orquestador
workers/discord-bot/       Interacciones de Discord
workers/paypal-payments/   Creación y captura de órdenes PayPal
workers/stripe-payments/   Preparado para Stripe
workers/revolut-payments/  Preparado para Revolut
```

El Worker Maestro usa Service Bindings para delegar peticiones a los sub-workers.

## 4. Decisión de hosting

### Opción principal: Cloudflare

Se mantiene Cloudflare como opción principal porque el repositorio ya está diseñado para esa plataforma:

- Astro tiene configurado `@astrojs/cloudflare`.
- Cloudflare Pages permite desplegar Astro SSR.
- Cloudflare Workers aloja el Worker Maestro y los sub-workers.
- Los Service Bindings permiten comunicación interna entre Workers.
- Los secretos de PayPal y Discord permanecen en el backend.
- Se evita separar el frontend y el backend en plataformas distintas.

### Alternativa: Vercel

Vercel también es compatible con Astro SSR mediante `@astrojs/vercel` y ofrece buenas previews conectadas a GitHub. No es la opción principal de la V1 porque obligaría a separar el frontend de los Workers de Discord y pagos ya definidos.

La migración a Vercel queda abierta si más adelante se priorizan previews, analytics o servicios específicos de Vercel. En ese caso habría que:

1. Sustituir el adaptador de Astro.
2. Revisar el despliegue de rutas SSR y endpoints.
3. Mantener o migrar por separado los Workers de backend.
4. Revisar variables de entorno, dominios y callbacks de PayPal.

## 5. Cambios aplicados

### Web Astro

En `web/src/pages/index.astro`:

- Se añadió un enlace “Saltar al contenido principal”.
- Se añadió el landmark `<main>`.
- Se añadió `type="button"` a los botones de acción.
- Se añadieron estilos explícitos para `:focus-visible`.
- Se añadió realimentación visual en hover.
- Se sustituyó el formato fijo de precios por `Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })`.
- El total del carrito usa formato localizado.
- El estado de checkout mantiene `role="status"` y `aria-live="polite"`.
- Se añadió `PUBLIC_API_BASE_URL` para apuntar al Worker Maestro desde Pages.
- Las peticiones de creación y captura de PayPal usan ese origen configurable.

En `web/astro.config.mjs`:

- Se habilitó `platformProxy` para aproximar el runtime de Cloudflare durante el desarrollo local.

### Configuración y documentación

En `.env.example`:

- Se documentó `PAYPAL_API_BASE`.
- Se documentó `PUBLIC_API_BASE_URL`.

En `docs/DECISIONES.md`:

- Se formalizó Cloudflare como hosting principal.
- Se documentó Vercel como alternativa y el coste de una posible migración.

En `docs/CHECKLIST_V1.md`:

- Se añadió la configuración de `PUBLIC_API_BASE_URL`.
- Se documentaron el directorio `web`, el comando de build y el flujo recomendado de despliegue.

En `docs/README_PROYECTO.md`:

- Se actualizó el estado de la web y PayPal.
- Se explicó la relación entre Pages, Workers y `PUBLIC_API_BASE_URL`.

## 6. Flujo recomendado de despliegue

### Web en Cloudflare Pages

1. Conectar el repositorio de GitHub a Cloudflare Pages.
2. Usar `web` como directorio raíz del proyecto Pages.
3. Usar `npm run build` como comando de compilación.
4. Usar `dist` como directorio de salida.
5. Definir `PUBLIC_API_BASE_URL` con la URL pública del Worker Maestro.

### Workers

1. Ejecutar `wrangler login`.
2. Desplegar cada Worker desde su carpeta.
3. Configurar los Service Bindings del Worker Maestro.
4. Guardar secretos con `wrangler secret put`.
5. Probar primero con PayPal Sandbox.
6. Configurar Discord para usar `/discord/interactions` del Worker Maestro.

No se deben guardar en GitHub `PAYPAL_CLIENT_SECRET`, tokens de Discord, claves privadas ni secretos de webhooks.

## 7. Validación realizada

Desde `web` se ejecutó:

```bash
npm install
npm run build
```

El build terminó correctamente con:

- `astro check`: 0 errores, 0 warnings y 0 hints.
- Build SSR generado con el adaptador de Cloudflare.

El build mostró advertencias de comentarios `@__PURE__` dentro de dependencias de terceros (`zod`), no del código del proyecto.

La instalación detectó vulnerabilidades de dependencias de npm. No se ejecutó `npm audit fix --force` porque podría introducir cambios incompatibles y no era necesario para validar esta tarea.

## 8. Pendientes de la V1

- Crear/configurar el proyecto de Cloudflare Pages.
- Configurar el dominio y `PUBLIC_API_BASE_URL`.
- Configurar los secretos de PayPal Sandbox.
- Desplegar y comprobar el Worker Maestro.
- Confirmar los Service Bindings.
- Registrar los comandos de Discord.
- Invitar el bot al servidor.
- Probar el flujo completo: catálogo → carrito → PayPal Sandbox → captura → confirmación.
- Repetir la prueba con credenciales reales solo después de completar la validación Sandbox.

## 9. Fuentes técnicas consultadas

- Documentación oficial de Astro para el adaptador Cloudflare.
- Documentación oficial de Astro para el adaptador Vercel.
- Guía oficial de Cloudflare Pages para desplegar Astro.
- Web Interface Guidelines de Vercel Labs.
