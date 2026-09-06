/**
 * Sub-worker: paypal-payments
 *
 * Responsable de gestionar el flujo de pagos con PayPal:
 * - POST /create-order  : crea una orden de pago en PayPal
 * - POST /capture-order : captura el pago tras la aprobacion del usuario
 *
 * Recibe las peticiones del Worker Maestro via Service Binding.
 * No debe exponerse directamente a internet salvo para pruebas locales.
 *
 * Ver docs/ARQUITECTURA_MASTER_WORKER.md y docs/DECISIONES.md para el contexto.
 */

async function getAccessToken(env) {
  const auth = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);
  const res = await fetch(`${env.PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    throw new Error('No se pudo obtener el access token de PayPal');
  }

  const data = await res.json();
  return data.access_token;
}

async function createOrder(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response('JSON invalido', { status: 400 });
  }

  const { amount, currency } = body || {};
  if (!amount || !currency) {
    return new Response('Faltan campos amount/currency', { status: 400 });
  }

  try {
    const accessToken = await getAccessToken(env);
    const res = await fetch(`${env.PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          { amount: { currency_code: currency, value: amount } },
        ],
      }),
    });

    const order = await res.json();
    return new Response(JSON.stringify(order), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error creando orden PayPal:', err);
    return new Response('Error creando orden', { status: 502 });
  }
}

async function captureOrder(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response('JSON invalido', { status: 400 });
  }

  const { orderId } = body || {};
  if (!orderId) {
    return new Response('Falta el campo orderId', { status: 400 });
  }

  try {
    const accessToken = await getAccessToken(env);
    const res = await fetch(
      `${env.PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const capture = await res.json();
    return new Response(JSON.stringify(capture), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error capturando orden PayPal:', err);
    return new Response('Error capturando orden', { status: 502 });
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method !== 'POST') {
      return new Response('paypal-payments sub-worker activo', { status: 200 });
    }

    if (url.pathname === '/create-order') {
      return await createOrder(request, env);
    }

    if (url.pathname === '/capture-order') {
      return await captureOrder(request, env);
    }

    return new Response('Ruta no encontrada', { status: 404 });
  },
};
