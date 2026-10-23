import { getRequestListener } from '@hono/node-server'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite'
import { createApi } from './server/app.ts'

/** Serves the same /api routes as the production server (server/index.ts) from the dev and preview servers. */
function strayApi(env: Record<string, string>): Plugin {
  const listener = getRequestListener(createApi(env).fetch)
  const handle: Connect.NextHandleFunction = (req, res, next) => {
    if (req.url?.startsWith('/api/')) listener(req, res)
    else next()
  }
  return {
    name: 'stray-api',
    configureServer(server) {
      server.middlewares.use(handle)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '' loads every variable, not just VITE_*; the key stays server-side and is never bundled.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), strayApi(env)],
  }
})
