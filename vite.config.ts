import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { sites } from '@openai/sites-vite-plugin'
// @ts-expect-error Vite runs this config in Node; the browser app intentionally omits Node types.
import { copyFileSync, mkdirSync } from 'node:fs'

const sitesWorkerEntry: Plugin = {
  name: 'licenceflow-sites-worker-entry',
  apply: 'build',
  writeBundle() {
    const outputDirectory = 'dist'
    mkdirSync(`${outputDirectory}/server`, { recursive: true })
    copyFileSync('server/index.js', `${outputDirectory}/server/index.js`)
    copyFileSync('server/reliability.js', `${outputDirectory}/server/reliability.js`)
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
    outDir: 'dist/client',
    target: 'es2022',
  },
})
