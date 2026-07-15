// Serves the built static assets directly; falls back to index.html for any
// unmatched path so React Router's client-side routes (e.g. /admin, /kds)
// survive a hard refresh — done manually here instead of via the
// `not_found_handling` config option, which has open bugs around false
// "infinite loop" validation errors (cloudflare/workers-sdk#10992, #11824).
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const response = await env.ASSETS.fetch(request);
    if (response.status === 404) {
      return env.ASSETS.fetch(new URL('/index.html', url));
    }
    return response;
  },
};
