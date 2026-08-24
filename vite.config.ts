import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { sites } from '@openai/sites-vite-plugin'
// @ts-expect-error Vite runs this config in Node; the browser app intentionally omits Node types.
import { mkdirSync, writeFileSync } from 'node:fs'

const sitesWorkerEntry: Plugin = {
  name: 'licenceflow-sites-worker-entry',
  apply: 'build',
  writeBundle(options) {
    const outputDirectory = options.dir ?? 'dist'
    const workerSource = `const withSiteHeaders = (response, path) => {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set(
    'Cache-Control',
    path.startsWith('/assets/')
      ? 'public, max-age=31536000, immutable'
      : 'no-cache',
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export default {
  async fetch(request, env) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', {
        status: 405,
        headers: { Allow: 'GET, HEAD' },
      });
    }

    const url = new URL(request.url);
    const response = await env.ASSETS.fetch(request);

    if (response.status !== 404) {
      return withSiteHeaders(response, url.pathname);
    }

    const acceptsHtml = (request.headers.get('accept') || '').includes('text/html');
    if (!acceptsHtml) return withSiteHeaders(response, url.pathname);

    const indexUrl = new URL('/index.html', request.url);
    const indexRequest = new Request(indexUrl, request);
    const indexResponse = await env.ASSETS.fetch(indexRequest);
    return withSiteHeaders(indexResponse, '/index.html');
  },
};
`

    mkdirSync(`${outputDirectory}/server`, { recursive: true })
    writeFileSync(`${outputDirectory}/server/index.js`, workerSource)
  },
}

export default defineConfig({
  plugins: [react(), sites(), sitesWorkerEntry],
  server: {
    watch: {
      ignored: ['**/*.tmp', '**/*~tmp', '**/*.png.~tmp', '**/ChatGPT Image*'],
    },
  },
  build: {
    target: 'es2022',
  },
})
