
import { getServerBaseUrl } from '@/src/server/base-url';

export default async function Page() {
  try {
    const base = await getServerBaseUrl();
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${base}/api/users`, { cache: 'no-store', signal: controller.signal });
    clearTimeout(id);

    if (!res.ok) {
      return (
        <main style={{ padding: 24 }}>
          <h1>Eden Demo</h1>
          <pre style={{ color: 'red' }}>{`HTTP ${res.status}`}</pre>
        </main>
      );
    }

    const data = await res.json();

    return (
      <main style={{ padding: 24 }}>
        <h1>Eden Demo: Users</h1>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </main>
    );
  } catch (e) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Eden Demo</h1>
        <pre style={{ color: 'red' }}>{String(e instanceof Error ? e.stack ?? e.message : e)}</pre>
      </main>
    );
  }
}
