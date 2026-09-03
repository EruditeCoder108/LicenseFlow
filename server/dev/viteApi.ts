import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { openLocalDatabase } from './database'

// Real API handlers + migrated SQLite for local preview. No production secrets,
// remote database, mocked grading, or new localStorage authority are involved.
export function localApi(): Plugin {
  let database: ReturnType<typeof openLocalDatabase> | undefined
  function middleware(loadWorker: () => Promise<{ default: { fetch: (request: Request, env: unknown) => Promise<Response> } }>) {
    return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
      if (!req.url?.startsWith('/api/')) return next()
      try {
        database ??= (() => { mkdirSync('.tmp', { recursive: true }); return openLocalDatabase('.tmp/licenceflow.sqlite') })()
        const chunks: Buffer[] = []
        let size = 0
        for await (const chunk of req) {
          size += chunk.length
          if (size > 16_000) { res.writeHead(413); res.end('Request too large'); return }
          chunks.push(Buffer.from(chunk))
        }
        const headers = new Headers()
        for (const [key, value] of Object.entries(req.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value)
        const method = req.method ?? 'GET'
        const request = new Request(`http://${req.headers.host}${req.url}`, { method, headers, ...(method !== 'GET' && method !== 'HEAD' ? { body: Buffer.concat(chunks) } : {}) })
        const worker = await loadWorker()
        const response = await worker.default.fetch(request, { DB: database.db })
        const responseHeaders: Record<string, string> = {}
        response.headers.forEach((value, key) => { responseHeaders[key] = value })
        res.writeHead(response.status, responseHeaders)
        res.end(Buffer.from(await response.arrayBuffer()))
      } catch (error) {
        // Visible in the developer terminal, never expose SQL/source to clients.
        console.error('[LicenceFlow local API]', error)
        res.writeHead(503, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ code: 'exam_unavailable', error: 'The local API could not confirm this request.' }))
      }
    }
  }
  return {
    name: 'licenceflow-local-api',
    configureServer(server) {
      server.middlewares.use(middleware(() => server.ssrLoadModule('/server/index.js') as ReturnType<Parameters<typeof middleware>[0]>))
      server.httpServer?.once('close', () => database?.close())
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware(() => import(pathToFileURL(resolve('dist/server/index.js')).href)))
      server.httpServer.once('close', () => database?.close())
    },
  }
}
