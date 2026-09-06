/**
 * Worker Maestro (Orchestrator)
 *
 * Punto de entrada unico para:
 * - Interacciones de Discord (/productos, /stock, ...)
 * - Webhooks/endpoints de pago: PayPal, Stripe y Revolut
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
      // Interacciones de Discord: se verifica la firma Ed25519 aqui,
      // en el unico worker expuesto a internet, antes de delegar.
      if (url.pathname === '/discord/interactions') {
        const verified = await verifyDiscordRequest(request, env);
        if (!verified.ok) {
          return new Response('Firma invalida', { status: 401 });
        }
        return await routeToDiscordBot(verified.request, env);
      }

      // Webhooks / endpoints de PayPal
      if (url.pathname.startsWith('/paypal/')) {
        return await routeToPaypal(request, env);
      }

      // Webhooks / endpoints de Stripe
      if (url.pathname.startsWith('/stripe/')) {
        return await routeToStripe(request, env);
      }

      // Webhooks / endpoints de Revolut
      if (url.pathname.startsWith('/revolut/')) {
        return await routeToRevolut(request, env);
      }

      return new Response('Workflow-VStore Master Worker', { status: 200 });
    } catch (err) {
      console.error('Error en Master Worker:', err);
      return new Response('Internal Error', { status: 500 });
    }
  },
};

/**
 * Verifica la firma Ed25519 de una peticion entrante de Discord usando
 * las cabeceras X-Signature-Ed25519 y X-Signature-Timestamp, tal como
 * exige la documentacion oficial de Discord Interactions.
 *
 * Usa Web Crypto (crypto.subtle), nativo en Cloudflare Workers,
 * sin dependencias externas.
 *
 * Devuelve { ok: boolean, request: Request } donde `request` es un
 * clon con el body ya leido, listo para reenviar al sub-worker.
 */
async function verifyDiscordRequest(request, env) {
  const signature = request.headers.get('X-Signature-Ed25519');
  const timestamp = request.headers.get('X-Signature-Timestamp');
  const body = await request.text();

  if (!signature || !timestamp || !env.DISCORD_PUBLIC_KEY) {
    return { ok: false, request: null };
  }

  try {
    const publicKey = await crypto.subtle.importKey(
      'raw',
      hexToBytes(env.DISCORD_PUBLIC_KEY),
      { name: 'Ed25519', namedCurve: 'Ed25519' },
      false,
      ['verify']
    );

    const isValid = await crypto.subtle.verify(
      { name: 'Ed25519' },
      publicKey,
      hexToBytes(signature),
      new TextEncoder().encode(timestamp + body)
    );

    if (!isValid) {
      return { ok: false, request: null };
    }

    // Reconstruimos la request con el body ya consumido para
    // poder reenviarla intacta al sub-worker discord-bot.
    const forwarded = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body,
    });

    return { ok: true, request: forwarded };
  } catch (err) {
    console.error('Error verificando firma de Discord:', err);
    return { ok: false, request: null };
  }
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

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

/**
 * Delega la peticion al sub-worker stripe-payments usando Service Binding.
 * Requiere configurar el binding STRIPE_PAYMENTS en wrangler.toml.
 */
async function routeToStripe(request, env) {
  if (!env.STRIPE_PAYMENTS) {
    return new Response('STRIPE_PAYMENTS binding no configurado', { status: 500 });
  }
  return env.STRIPE_PAYMENTS.fetch(request);
}

/**
 * Delega la peticion al sub-worker revolut-payments usando Service Binding.
 * Requiere configurar el binding REVOLUT_PAYMENTS en wrangler.toml.
 */
async function routeToRevolut(request, env) {
  if (!env.REVOLUT_PAYMENTS) {
    return new Response('REVOLUT_PAYMENTS binding no configurado', { status: 500 });
  }
  return env.REVOLUT_PAYMENTS.fetch(request);
}
