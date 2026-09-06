# Decisiones del proyecto

Este documento recoge las decisiones clave tomadas para el proyecto Workflow-VStore y el motivo detrás de cada una.

## V1 sin VTuber
La V1 se centra exclusivamente en la tienda (Discord + Web + pagos). El proyecto VTuber (Shinshi) se desarrolla en paralelo pero no forma parte del workflow técnico de la tienda hasta una V2, para evitar mezclar objetivos y facilitar terminar algo funcional cuanto antes.

## Cloudflare como hosting principal
Se elige Cloudflare (Pages + Workers) frente a otras alternativas porque:
- Tiene plan gratuito generoso (100.000 solicitudes/día en Workers)
- No requiere mantener un servidor propio
- Se integra bien con Astro mediante adaptador oficial
- Baja latencia y buena escalabilidad
- Permite mantener el frontend SSR y los endpoints serverless de PayPal en la misma plataforma.

### Alternativa Vercel
Vercel también es compatible con Astro SSR mediante `@astrojs/vercel` y ofrece una experiencia excelente de previews desde GitHub. No se adopta como opción principal en V1 porque obligaría a separar la ejecución del frontend de los Workers ya definidos para Discord y pagos, añadiendo otra plataforma sin una necesidad funcional.

La migración a Vercel queda abierta si el proyecto pasa a priorizar previews, analytics o servicios específicos de Vercel. En ese caso habría que sustituir el adaptador, revisar los endpoints SSR y conservar los Workers de backend o migrarlos por separado.

## Astro como framework web
Astro permite construir la web de catálogo de forma sencilla, con buen rendimiento y despliegue directo en Cloudflare Pages.

## PayPal como única pasarela de pago en V1
Se usa PayPal en la V1 por ser la opción más conocida y sencilla de integrar sin gestionar datos bancarios sensibles directamente. Las claves secretas viven solo en el backend (Workers), nunca en el cliente.

## Bot de Discord solo para comandos de tienda
El bot se implementa sobre el modelo de Interactions Endpoint de Discord (HTTP, sin conexión persistente), suficiente para comandos como /productos y /stock. No se busca un bot de moderación o presencia permanente en esta fase.

## Carrito sin base de datos
En V1 el carrito se gestiona con localStorage en el navegador, evitando la complejidad de una base de datos hasta que sea realmente necesaria.

## Todo gratuito / open source primero
Se prioriza siempre la opción gratuita, open source o con plan free de uso diario suficiente, evitando suscripciones mientras el proyecto está en fase de validación.
