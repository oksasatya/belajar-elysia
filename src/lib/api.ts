import type { App } from '@/src/server/elysia';

// Client-side, we can use a relative URL since the client will always
// be served from the same origin as the API.
export async function getClientApi() {
  const { edenTreaty } = await import('@elysiajs/eden');
  return edenTreaty<App>('');
}

// Server-side, prefer a relative base URL as well to avoid issues with
// forwarded hosts or networking differences in dev and SSR.
export async function getServerApi() {
  const { edenTreaty } = await import('@elysiajs/eden');
  return edenTreaty<App>('');
}

export async function getApi() {
  return typeof window !== 'undefined' ? getClientApi() : getServerApi();
}