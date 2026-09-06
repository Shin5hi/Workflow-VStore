/**
 * Sub-worker: paypal-payments
 *
 * Gestiona el flujo PayPal Sandbox:
 * - POST /create-order: crea una orden y devuelve el enlace de aprobacion.
 * - POST /capture-order: captura una orden aprobada.
 *
 * Recibe peticiones del Worker Maestro mediante Service Binding.
 */

async function getAccessToken(env) {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET || !env.PAYPAL_API_BASE) {
    throw new Error('Faltan variables de entorno de PayPal');
  }

  const auth = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);
  const response = await fetch(`${env.PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('No se pudo obtener el access token de PayPal');
  }

  const data = await response.json();
  return data.access_token;
}

async function createOrder(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('JSON invalido', 400);
  }

  const { amount, currency, returnUrl, cancelUrl } = body || {};
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0 || !currency) {
    return jsonError('Faltan campos amount/currency', 400);
  }

  try {
    const accessToken = await getAccessToken(env);
    const purchaseUnit = {
      amount: {
        currency_code: String(currency).toUpperCase(),
        value: numericAmount.toFixed(2),
      },
    };
    const applicationContext =
      returnUrl && cancelUrl
        ? { application_context: { return_url: returnUrl, cancel_url: cancelUrl } }
        : {};

    const response = await fetch(`${env.PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [purchaseUnit],
        ...applicationContext,
      }),
    });

    return jsonResponse(await response.json(), response.status);
  } catch (error) {
    console.error('Error creando orden PayPal:', error);
    return jsonError('Error creando orden', 502);
  }
}

async function captureOrder(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('JSON invalido', 400);
  }

  const { orderId } = body || {};
  if (!orderId || !/^[A-Z0-9-]+$/i.test(orderId)) {
    return jsonError('Falta el campo orderId', 400);
  }

  try {
    const accessToken = await getAccessToken(env);
    const response = await fetch(
      `${env.PAYPAL_API_BASE}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return jsonResponse(await response.json(), response.status);
  } catch (error) {
    console.error('Error capturando orden PayPal:', error);
    return jsonError('Error capturando orden', 502);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonError(error, status) {
  return jsonResponse({ error }, status);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method !== 'POST') {
      return new Response('paypal-payments sub-worker activo', { status: 200 });
    }

    if (url.pathname === '/create-order') {
      return createOrder(request, env);
    }

    if (url.pathname === '/capture-order') {
      return captureOrder(request, env);
    }

    return new Response('Ruta no encontrada', { status: 404 });
  },
};
