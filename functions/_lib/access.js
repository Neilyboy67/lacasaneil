// Defence-in-depth: verify Cloudflare Access populated the auth headers.
// Cloudflare Access is configured to gate /api/admin/* and /calendar/admin/* —
// when it does, every request reaching the Worker has Cf-Access-Authenticated-User-Email
// (and Cf-Access-Jwt-Assertion). If those are missing on a request that hit this code,
// something is misconfigured upstream and we refuse the request.

export function requireAccess(request) {
  const email = request.headers.get("Cf-Access-Authenticated-User-Email");
  const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!email || !jwt) {
    return new Response("unauthorized", { status: 401 });
  }
  return null; // ok
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
