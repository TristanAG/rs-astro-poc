import { defineConfig } from 'astro/config';
import { storyblok } from '@storyblok/astro';
import { loadEnv } from 'vite';
import vercel from '@astrojs/vercel';
import mkcert from 'vite-plugin-mkcert';

const env = loadEnv('', process.cwd(), 'STORYBLOK');
const isDev = process.argv.includes('dev');

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [
    storyblok({
      accessToken: env.STORYBLOK_TOKEN || process.env.STORYBLOK_TOKEN,
      livePreview: true,
    }),
  ],
  vite: {
    plugins: isDev ? [mkcert()] : [],
  },
});
