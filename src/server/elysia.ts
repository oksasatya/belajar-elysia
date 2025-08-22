import { Elysia, t } from 'elysia';
import { prisma } from './db';

// ====== Logger util ======
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 50 } as const;
type Level = keyof typeof LEVELS;
const CURRENT: Level = (process.env.LOG_LEVEL?.toLowerCase() as Level) || 'info';

function should(level: Level) {
  return LEVELS[level] >= LEVELS[CURRENT];
}
function log(level: Level, msg: string, meta?: Record<string, any>) {
  if (!should(level)) return;
  const line =
    meta && Object.keys(meta).length
      ? `${msg} ${Object.entries(meta).map(([k, v]) => `${k}=${String(v)}`).join(' ')}`
      : msg;
  const ts = new Date().toISOString();
  const out =
    level === 'error'
      ? console.error
      : level === 'warn'
        ? console.warn
        : level === 'debug'
          ? console.debug
          : console.info;
  out(`[api][${level}] ${ts} ${line}`);
}

// ====== timeout helper ======
async function withTimeout<T>(p: Promise<T>, ms = 5000) {
  return (await Promise.race([
    p,
    new Promise<never>((_, r) => setTimeout(() => r(new Error('Request timed out')), ms)),
  ])) as T;
}

// ====== per-request context ======
const starts = new WeakMap<Request, number>();
const ids = new WeakMap<Request, string>();

function reqId(req: Request) {
  return (
    req.headers.get('x-request-id') ||
    req.headers.get('cf-ray') ||
    crypto.randomUUID()
  );
}

// ====== App ======
export const app = new Elysia({ prefix: '/api' })
  .onRequest(({ request }) => {
    starts.set(request, Date.now());
    ids.set(request, reqId(request));
    log('debug', 'incoming', {
      id: ids.get(request),
      ip:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('cf-connecting-ip') ||
        undefined,
      ua: request.headers.get('user-agent') || undefined,
      method: request.method,
      path: new URL(request.url).pathname,
    });
  })
  .get('/health', () => ({ ok: true }))
  .get('/', () => 'Hello Next + Elysia 🚀')
  .get('/users', () => withTimeout(prisma.user.findMany()))
  .post(
    '/users',
    ({ body }) => withTimeout(prisma.user.create({ data: body })),
    {
      body: t.Object({
        name: t.String(),
        email: t.String({ format: 'email' }),
      }),
    }
  )
  .onAfterHandle(({ request, set, path, response }) => {
    const start = starts.get(request) ?? Date.now();
    const dur = Date.now() - start;
    const status =
      set.status ?? (response instanceof Response ? response.status : 200);
    const method = request.method;
    const pathname = path ?? new URL(request.url).pathname;
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('cf-connecting-ip') ||
      undefined;
    const ua = request.headers.get('user-agent') || undefined;
    const id = ids.get(request);
    
    // expose request id to client
    set.headers['x-request-id'] = id ?? '';
    
    // health → turunkan ke debug, lainnya info
    const level: Level = pathname.startsWith('/api/health') ? 'debug' : 'info';
    log(level, `${status} ${method} ${pathname}`, { dur: `${dur}ms`, ip, ua, id });
  })
  .onError(({ request, path, error }) => {
    const method = request.method;
    const pathname = path ?? new URL(request.url).pathname;
    const id = ids.get(request);
    log('error', `${method} ${pathname}: ${error?.message ?? String(error)}`, { id });
  });

export type App = typeof app;
