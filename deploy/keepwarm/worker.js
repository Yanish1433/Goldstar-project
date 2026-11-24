// Keeps the free Render API awake: Render spins a free instance down after ~15 min without traffic, and the next
// visitor then waits 20-50 s. A cron ping every 10 min keeps it warm (one always-on free service ~720 h of 750 h/month).
// Deploy: cd deploy/keepwarm && npx wrangler@4 deploy
export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(ping(env));
  },
  // GET on the worker URL runs one ping by hand and shows the result.
  async fetch(_req, env) {
    return new Response(await ping(env), { headers: { 'Content-Type': 'text/plain' } });
  },
};

async function ping(env) {
  const url = `${env.API_ORIGIN || 'https://goldstar-api.onrender.com'}/api/health`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'goldstar-keepwarm' }, signal: AbortSignal.timeout(60_000) });
    return `${res.status} ${await res.text()}`;
  } catch (e) {
    return `error: ${e.message}`;
  }
}
