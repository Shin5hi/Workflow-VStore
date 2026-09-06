/**
 * Sub-worker: revolut-payments
 *
 * Responsable de la integracion con Revolut Merchant API:
 * - POST /revolut/create-order : crea una orden de pago
 * - POST /revolut/webhook      : recibe notificaciones de pago (ORDER_COMPLETED, etc.)
 *
 * Recibe las peticiones del Worker Maestro via Service Binding.
 * Requiere los secrets REVOLUT_API_KEY y REVOLUT_WEBHOOK_SECRET,
 * configurados con `wrangler secret put` (nunca en texto plano).
 */

const REVOLUT_API_BASE = 'https://merchant.revolut.com/api/1.0';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method !== 'POST') {
      return new Response('revolut-payments sub-worker activo', { status: 200 });
    }

    if (url.pathname === '/revolut/create-order') {
      return await createOrder(request, env);
    }

    if (url.pathname === '/revolut/webhook') {
      return await handleWebhook(request, env);
    }

    return new Response('Ruta no soportada', { status: 404 });
  },
};

/**
 * Crea una orden de pago en Revolut Merchant API.
 * Espera un body JSON: { amount, currency, description }
 */
async function createOrder(request, env) {
  if (!env.REVOLUT_API_KEY) {
    return new Response('REVOLUT_API_KEY no configurada', { status: 500 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch (err) {
    return new Response('JSON invalido', { status: 400 });
  }

  const { amount, currency, description } = payload;
  if (!amount || !currency) {
    return new Response('Faltan campos amount/currency', { status: 400 });
  }

  try {
    const revolutResponse = await fetch(`${REVOLUT_API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.REVOLUT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, currency, description }),
    });

    const data = await revolutResponse.json();

    if (!revolutResponse.ok) {
      return new Response(JSON.stringify({ error: 'Error creando orden en Revolut', details: data }), {
        status: revolutResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error llamando a Revolut API:', err);
    return new Response('Error interno creando orden', { status: 500 });
  }
}

/**
 * Verifica y procesa un webhook de Revolut.
 * Revolut firma sus webhooks con HMAC-SHA256 en la cabecera
 * Revolut-Signature, usando REVOLUT_WEBHOOK_SECRET.
 */
async function handleWebhook(request, env) {
  if (!env.REVOLUT_WEBHOOK_SECRET) {
    return new Response('REVOLUT_WEBHOOK_SECRET no configurado', { status: 500 });
  }

  const signatureHeader = request.headers.get('Revolut-Signature');
  const body = await request.text();

  if (!signatureHeader) {
    return new Response('Falta cabecera de firma', { status: 401 });
  }

  const isValid = await verifyHmacSignature(body, signatureHeader, env.REVOLUT_WEBHOOK_SECRET);
  if (!isValid) {
    return new Response('Firma invalida', { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch (err) {
    return new Response('JSON invalido', { status: 400 });
  }

  // Aqui se puede conectar con el catalogo/pedidos segun event.event
  console.log('Evento de Revolut recibido:', event.event);

  return new Response('OK', { status: 200 });
}

/**
 * Verifica una firma HMAC-SHA256 usando Web Crypto (crypto.subtle),
 * nativo en Cloudflare Workers, sin dependencias externas.
 */
async function verifyHmacSignature(body, signatureHeader, secret) {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const expectedSignature = signatureHeader.replace(/^sha256=/, '');
    const signatureBytes = hexToBytes(expectedSignature);

    return await crypto.subtle.verify('HMAC', key, signatureBytes, new TextEncoder().encode(body));
  } catch (err) {
    console.error('Error verificando firma HMAC de Revolut:', err);
    return false;
  }
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}
