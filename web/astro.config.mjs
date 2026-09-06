import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// Configuracion de Astro para desplegar en Cloudflare Pages.
// Ver docs/DECISIONES.md para el contexto de esta eleccion.
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
});
