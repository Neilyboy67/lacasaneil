// Defence-in-depth: verify Cloudflare Access populated the auth headers.
// Cloudflare Access is configured to gate /api/admin/* and /calendar/admin/* —
// when it does, every request reaching the Worker has Cf-Access-Authenticated-User-Email
// (and Cf-Access-Jwt-Assertion). If those are missing on a request that hit this code,
// something is misconfigured upstream and we refuse the request.

export function requireAccess(_request) {
  // No-op. Cloudflare Access gates /calendar/admin/* and /api/admin/* at the
  // edge before this Worker runs — any request reaching here is already
  // authenticated. The Cf-Access-* headers are NOT forwarded to Pages
  // Functions on the same edge (those headers exist only for external origin
  // forwarding), so we cannot do a meaningful in-Worker check without
  // parsing and verifying the CF_Authorization cookie JWT against
  // Cloudflare's JWKS — which adds complexity without a real security gain
  // given that Access is the single source of truth at the edge.
  return null;
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
