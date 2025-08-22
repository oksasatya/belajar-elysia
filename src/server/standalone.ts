import { app } from './elysia';

function parseFromEnv() {
  const url = process.env.EDEN_URL;
  if (url) {
    try {
      const u = new URL(url);
      const port = Number(u.port || (u.protocol === 'https:' ? 443 : 8080));
      const hostname = u.hostname || '0.0.0.0';
      return { hostname, port };
    } catch {
      // Fallback to EDEN_PORT if EDEN_URL is malformed
    }
  }
  const port = Number(process.env.EDEN_PORT || 8080);
  const hostname = process.env.EDEN_HOST || '0.0.0.0';
  return { hostname, port };
}

const { hostname, port } = parseFromEnv();

const server = app.listen({ hostname, port }, () => {
  const addr = `http://${hostname}:${port}`;
  console.warn(`Eden (Elysia) running at ${addr}`);
});

process.on('SIGINT', () => {
  server.stop?.();
  process.exit(0);
});
