import { defineConfig } from 'astro/config';
import { storyblok } from '@storyblok/astro';
import { loadEnv } from 'vite';
import vercel from '@astrojs/vercel';
import mkcert from 'vite-plugin-mkcert';

const env = loadEnv(process.env.NODE_ENV ?? '', process.cwd(), 'STORYBLOK');
const accessToken = env.STORYBLOK_TOKEN || process.env.STORYBLOK_TOKEN;
const isDev = process.argv.includes('dev');

if (!accessToken) {
  throw new Error(
    'Missing STORYBLOK_TOKEN. Add it to .env locally, or to Vercel → Settings → Environment Variables (enable for Production Build), then redeploy.',
  );
}

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [
    storyblok({
      accessToken,
      livePreview: true,
    }),
  ],
  vite: {
    plugins: isDev ? [mkcert()] : [],
  },
});
