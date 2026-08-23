import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { sites } from '@openai/sites-vite-plugin'
// @ts-expect-error Vite runs this config in Node; the browser app intentionally omits Node types.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const toUtf8Bytes = (value: string) => {
  const bytes: number[] = []

  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.codePointAt(index) ?? 0
    if (codePoint > 0xffff) index += 1

    if (codePoint <= 0x7f) bytes.push(codePoint)
    else if (codePoint <= 0x7ff) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f))
    } else if (codePoint <= 0xffff) {
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      )
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      )
    }
  }

  return Uint8Array.from(bytes)
}

const encodeOutput = (contents: string | Uint8Array) => {
  const bytes = typeof contents === 'string' ? toUtf8Bytes(contents) : contents
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let encoded = ''

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index]
    const second = bytes[index + 1]
    const third = bytes[index + 2]
    const block = (first << 16) | ((second ?? 0) << 8) | (third ?? 0)

    encoded += alphabet[(block >> 18) & 0x3f]
    encoded += alphabet[(block >> 12) & 0x3f]
    encoded += second === undefined ? '=' : alphabet[(block >> 6) & 0x3f]
    encoded += third === undefined ? '=' : alphabet[block & 0x3f]
  }

  return encoded
}

const sitesWorkerEntry: Plugin = {
  name: 'licenceflow-sites-worker-entry',
  apply: 'build',
  writeBundle(options, bundle) {
    const outputDirectory = options.dir ?? 'dist'
    const embeddedAssets: Record<string, string> = {}

    for (const output of Object.values(bundle)) {
      if (output.fileName.startsWith('server/')) continue

      const contents = output.type === 'chunk' ? output.code : output.source
      embeddedAssets[`/${output.fileName}`] = encodeOutput(contents)
    }

    embeddedAssets['/index.html'] = encodeOutput(
      readFileSync(`${outputDirectory}/index.html`, 'utf8'),
    )

    for (const publicAssetPath of ['/og.png', '/assets/parivahan-transport-hero.png']) {
      embeddedAssets[publicAssetPath] = encodeOutput(
        readFileSync(`${outputDirectory}${publicAssetPath}`),
      )
    }

    const workerSource = `const assets = ${JSON.stringify(embeddedAssets)};

const contentType = (path) => {
  if (path.endsWith('.html')) return 'text/html; charset=utf-8';
  if (path.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (path.endsWith('.css')) return 'text/css; charset=utf-8';
  if (path.endsWith('.json')) return 'application/json; charset=utf-8';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  if (path.endsWith('.woff2')) return 'font/woff2';
  if (path.endsWith('.woff')) return 'font/woff';
  return 'application/octet-stream';
};

const decode = (encoded) => {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

export default {
  async fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }

    const path = new URL(request.url).pathname;
    const acceptsHtml = (request.headers.get('accept') || '').includes('text/html');
    const assetPath = assets[path] ? path : acceptsHtml ? '/index.html' : path;
    const encoded = assets[assetPath];

    if (!encoded) return new Response('Not found', { status: 404 });

    const headers = new Headers({
      'Content-Type': contentType(assetPath),
      'Cache-Control': assetPath.startsWith('/assets/')
        ? 'public, max-age=31536000, immutable'
        : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });

    return new Response(request.method === 'HEAD' ? null : decode(encoded), { status: 200, headers });
  },
};\n`

    mkdirSync(`${outputDirectory}/server`, { recursive: true })
    writeFileSync(`${outputDirectory}/server/index.js`, workerSource)
  },
}

export default defineConfig({
  plugins: [react(), sites(), sitesWorkerEntry],
  build: {
    target: 'es2022',
  },
})
