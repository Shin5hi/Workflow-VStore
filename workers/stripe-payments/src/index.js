/**
 * Sub-worker: stripe-payments
 *
 * Responsable de gestionar el flujo de pagos con Stripe:
 * - POST /stripe/create-checkout-session : crea una sesion de pago (Stripe Checkout)
 * - POST /stripe/webhook                 : recibe y verifica eventos de Stripe
 *
 * Recibe las peticiones del Worker Maestro via Service Binding.
 * No debe exponerse directamente a internet salvo para pruebas locales.
 * Ver docs/ARQUITECTURA_MASTER_WORKER.md y docs/DECISIONES.md para el contexto.
 */

const STRIPE_API_BASE = 'https://api.stripe.com/v1';

async function createCheckoutSession(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'JSON invalido' }), { status: 400 });
  }

  const { amount, currency = 'eur', productName = 'Producto Workflow-VStore', successUrl, cancelUrl } = body;

  if (!amount || !successUrl || !cancelUrl) {
    return new Response(
      JSON.stringify({ error: 'Faltan campos: amount, successUrl, cancelUrl' }),
      { status: 400 }
    );
  }

  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('success_url', successUrl);
  params.append('cancel_url', cancelUrl);
  params.append('line_items[0][price_data][currency]', currency);
  params.append('line_items[0][price_data][product_data][name]', productName);
  params.append('line_items[0][price_data][unit_amount]', String(Math.round(amount * 100)));
  params.append('line_items[0][quantity]', '1');

  const res = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await res.json();

  if (!res.ok) {
    return new Response(JSON.stringify({ error: 'No se pudo crear la sesion de Stripe', details: data }), {
      status: 502,
    });
  }

  return new Response(JSON.stringify({ id: data.id, url: data.url }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Verifica la firma del webhook de Stripe usando HMAC-SHA256,
 * replicando el algoritmo de Stripe-Signature sin depender del SDK oficial
 * (que no es 100% compatible con el runtime de Cloudflare Workers).
 */
async function verifyStripeSignature(payload, signatureHeader, secret) {
  if (!signatureHeader) return false;

  const parts = signatureHeader.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    acc[key] = value;
    return acc;
  }, {});

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${payload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return expectedSignature === signature;
}

async function handleWebhook(request, env) {
  const payload = await request.text();
  const signatureHeader = request.headers.get('Stripe-Signature');

  const isValid = await verifyStripeSignature(payload, signatureHeader, env.STRIPE_WEBHOOK_SECRET);
  if (!isValid) {
    return new Response('Firma invalida', { status: 400 });
  }

  const event = JSON.parse(payload);

  switch (event.type) {
    case 'checkout.session.completed':
      console.log('Pago completado en Stripe:', event.data.object.id);
      break;
    default:
      console.log('Evento Stripe no manejado:', event.type);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/stripe/create-checkout-session') {
      return createCheckoutSession(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/stripe/webhook') {
      return handleWebhook(request, env);
    }

    return new Response('vstore-stripe-payments worker', { status: 200 });
  },
};
