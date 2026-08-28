import { spawn } from 'node:child_process'

const forwardedArgs = process.argv.slice(2)
const server = spawn(process.execPath, ['./node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173'], {
  stdio: 'inherit',
})

async function waitForServer() {
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch('http://127.0.0.1:4173')
      if (response.ok) return
    } catch {
      // The dev server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('The LicenceFlow test server did not start within 60 seconds.')
}

function stopServer() {
  if (!server.pid) return
  server.kill('SIGTERM')
}

try {
  await waitForServer()
  const runner = spawn(process.execPath, ['./node_modules/@playwright/test/cli.js', 'test', ...forwardedArgs], { stdio: 'inherit' })
  const exitCode = await new Promise((resolve) => runner.on('exit', (code) => resolve(code ?? 1)))
  process.exitCode = exitCode
} finally {
  stopServer()
}
