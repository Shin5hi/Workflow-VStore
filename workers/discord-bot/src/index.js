/**
 * Sub-worker: discord-bot
 *
 * Responsable de responder a los comandos de la aplicacion de Discord:
 * - /productos : lista el catalogo disponible
 * - /stock     : consulta el stock de un producto concreto
 *
 * Recibe las peticiones del Worker Maestro via Service Binding.
 * No debe exponerse directamente a internet salvo para pruebas locales.
 */

const DISCORD_TYPE_PING = 1;
const DISCORD_TYPE_APPLICATION_COMMAND = 2;

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('discord-bot sub-worker activo', { status: 200 });
    }

    let interaction;
    try {
      interaction = await request.json();
    } catch (err) {
      return new Response('JSON invalido', { status: 400 });
    }

    // Discord envia un PING periodico para comprobar el endpoint.
    if (interaction.type === DISCORD_TYPE_PING) {
      return Response.json({ type: 1 });
    }

    if (interaction.type === DISCORD_TYPE_APPLICATION_COMMAND) {
      const commandName = interaction.data?.name;

      if (commandName === 'productos') {
        return respond('Aqui aparecera el listado de productos (pendiente de conectar al catalogo).');
      }

      if (commandName === 'stock') {
        return respond('Aqui aparecera el stock del producto solicitado (pendiente de conectar al catalogo).');
      }

      return respond('Comando no reconocido.');
    }

    return new Response('Tipo de interaccion no soportado', { status: 400 });
  },
};

function respond(content) {
  return Response.json({
    type: 4,
    data: { content },
  });
}
