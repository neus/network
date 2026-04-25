import { createNeusMockCore } from '../scripts/neus-mock-core.mjs';

export function installNeusApiBrowserMock() {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;

  const core = createNeusMockCore();
  const orig = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const req = input instanceof Request ? input : new Request(input, init);
    const method = (init?.method || req.method || 'GET').toUpperCase();
    const url = req.url;

    let path;
    let origin;
    try {
      const u = new URL(url);
      path = u.pathname;
      origin = u.origin;
    } catch {
      return orig(input, init);
    }

    if (origin !== window.location.origin || !path.startsWith('/api/')) {
      return orig(input, init);
    }

    let bodyText = '';
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      try {
        bodyText = await req.clone().text();
      } catch {
        bodyText = '';
      }
    }

    const out = core.handle(method, path, '', bodyText);
    if (!out) {
      return new Response(JSON.stringify({ success: false, error: { message: 'Not found' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(out.json), {
      status: out.status,
      headers: { 'Content-Type': 'application/json' }
    });
  };
}

const useLiveApi =
  typeof import.meta.env.VITE_NEUS_API_URL === 'string' && import.meta.env.VITE_NEUS_API_URL.trim() !== '';

if (!useLiveApi) {
  installNeusApiBrowserMock();
}
