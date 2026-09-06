/**
 * Worker Maestro (Orchestrator)
 *
 * Punto de entrada unico para:
 * - Interacciones de Discord (/productos, /stock, ...)
 * - Webhooks de PayPal (create-order, capture-order)
 * - Peticiones desde la web Astro (opcional)
 *
 * Este worker valida las peticiones y las delega a los
 * sub-workers correspondientes usando Service Bindings.
 * Ver docs/ARQUITECTURA_MASTER_WORKER.md para el detalle completo.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    try {
      // Interacciones de Discord
      if (url.pathname === '/discord/interactions') {
        return await routeToDiscordBot(request, env);
      }

      // Webhooks / endpoints de PayPal
      if (url.pathname.startsWith('/paypal/')) {
        return await routeToPaypal(request, env);
      }

      return new Response('Workflow-VStore Master Worker', { status: 200 });
    } catch (err) {
      console.error('Error en Master Worker:', err);
      return new Response('Internal Error', { status: 500 });
    }
  },
};

/**
 * Delega la peticion al sub-worker discord-bot usando Service Binding.
 * Requiere configurar el binding DISCORD_BOT en wrangler.toml.
 */
async function routeToDiscordBot(request, env) {
  if (!env.DISCORD_BOT) {
    return new Response('DISCORD_BOT binding no configurado', { status: 500 });
  }
  return env.DISCORD_BOT.fetch(request);
}

/**
 * Delega la peticion al sub-worker paypal-payments usando Service Binding.
 * Requiere configurar el binding PAYPAL_PAYMENTS en wrangler.toml.
 */
async function routeToPaypal(request, env) {
  if (!env.PAYPAL_PAYMENTS) {
    return new Response('PAYPAL_PAYMENTS binding no configurado', { status: 500 });
  }
  return env.PAYPAL_PAYMENTS.fetch(request);
}
