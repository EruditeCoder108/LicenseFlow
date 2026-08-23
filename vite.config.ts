import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { sites } from '@openai/sites-vite-plugin'

const sitesWorkerEntry: Plugin = {
  name: 'licenceflow-sites-worker-entry',
  apply: 'build',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'server/index.js',
      source: `export default {
  async fetch(request, env) {
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) return assetResponse;

    const acceptsHtml = (request.headers.get('accept') || '').includes('text/html');
    if (request.method !== 'GET' || !acceptsHtml) return assetResponse;

    const indexUrl = new URL('/', request.url);
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};\n`,
    })
  },
}

export default defineConfig({
  plugins: [react(), sites(), sitesWorkerEntry],
  build: {
    target: 'es2022',
  },
})
