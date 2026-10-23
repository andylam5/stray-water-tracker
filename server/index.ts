// Production server: the API plus the built app from dist/. Run `npm run build`, then `npm start`.
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { createApi } from './app.ts';

// Local runs read .env; hosts set real environment variables instead.
try {
  process.loadEnvFile();
} catch {
  // No .env file.
}

const port = Number(process.env.PORT) || 3000;
const app = new Hono();

app.use(logger());
app.use(secureHeaders());
app.route('/', createApi(process.env));

// Vite fingerprints everything in /assets, so those files can be cached for good.
app.use('/assets/*', async (c, next) => {
  await next();
  if (c.res.ok) c.header('Cache-Control', 'public, max-age=31536000, immutable');
});
app.use('/*', serveStatic({ root: './dist' }));
// Client-side routes (/home, /goal, …) all load the app shell.
app.get('*', serveStatic({ path: './dist/index.html' }));

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Stray is listening on http://localhost:${info.port}`);
});
