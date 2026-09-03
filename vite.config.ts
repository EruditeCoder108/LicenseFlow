import { build, defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { sites } from '@openai/sites-vite-plugin'
import { localApi } from './server/dev/viteApi'

const sitesWorkerEntry: Plugin = {
  name: 'licenceflow-sites-worker-entry',
  apply: 'build',
  async writeBundle() {
    await build({
      configFile: false,
      ssr: { target: 'webworker', noExternal: true },
      build: {
        ssr: 'server/index.js', outDir: 'dist/server', target: 'es2022',
        sourcemap: false, minify: false,
        rollupOptions: { output: { entryFileNames: 'index.js', format: 'es' } },
      },
    })
  },
}

const privateExamBoundary: Plugin = {
  name: 'licenceflow-private-exam-boundary',
  transform(_code, id, options) {
    if (!options?.ssr && /[/\\]server[/\\]exam[/\\]/.test(id)) {
      this.error('Server-only exam code must never enter the browser bundle.')
    }
  },
}

export default defineConfig({
  plugins: [react(), sites(), localApi(), privateExamBoundary, sitesWorkerEntry],
  server: {
    watch: {
      ignored: ['**/*.tmp', '**/*~tmp', '**/*.png.~tmp', '**/ChatGPT Image*'],
    },
  },
  build: {
    outDir: 'dist/client',
    target: 'es2022',
  },
})
