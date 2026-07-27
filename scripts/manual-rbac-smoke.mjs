// scripts/manual-rbac-smoke.js
// Manual RBAC smoke test: log in as ADMIN and EMPLOYEE, verify session.role mapping
// Then we exercise the same code path that the unit tests cover, but through the live
// server's session endpoint, to confirm the role plumbed through real NextAuth.

const BASE = 'http://localhost:3000';

async function getCsrf() {
  const r = await fetch(`${BASE}/api/auth/csrf`, { redirect: 'manual' });
  const setCookies = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
  const csrfCookie = setCookies.find(c => c.startsWith('csrf-token=')) || setCookies.find(c => c.includes('csrf'));
  const csrfTokenCookie = csrfCookie ? csrfCookie.split(';')[0].split('=')[1] : null;
  const body = await r.json();
  // Decode the percent-encoded cookie value
  const decoded = csrfTokenCookie ? decodeURIComponent(csrfTokenCookie) : null;
  return { csrfToken: body.csrfToken, csrfCookieValue: decoded, allCookies: setCookies };
}

async function login(email, password) {
  const { csrfToken, allCookies } = await getCsrf();
  // Build Cookie header from all cookies
  const cookieHeader = allCookies.map(c => c.split(';')[0]).join('; ');
  const params = new URLSearchParams({
    email,
    password,
    csrfToken,
    callbackUrl: `${BASE}/`,
    json: 'true',
  });
  const r = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieHeader,
    },
    body: params.toString(),
    redirect: 'manual',
  });
  const setCookies2 = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
  return { status: r.status, setCookies: setCookies2, csrfCookieValue: cookieHeader, loginEmail: email };
}

async function getSession(allCookies) {
  const cookieHeader = allCookies.map(c => c.split(';')[0]).join('; ');
  const r = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: cookieHeader },
  });
  return r.json();
}

(async () => {
  console.log('=== Manual RBAC smoke (session.role verification) ===\n');
  for (const account of [
    { email: 'admin@congty.com', password: 'password123', expected: 'ADMIN' },
    { email: 'nhanvien@congty.com', password: 'password123', expected: 'EMPLOYEE' },
  ]) {
    const loginResult = await login(account.email, account.password);
    // Merge cookies: csrf cookies + session cookies
    const allCookies = loginResult.setCookies; // After login, cookies include session-token
    const session = await getSession(allCookies);
    const ok = session && session.user && session.user.role === account.expected;
    console.log(`Login ${account.email}:`);
    console.log(`  HTTP status: ${loginResult.status}`);
    console.log(`  Session user:`, JSON.stringify(session?.user ?? null));
    console.log(`  Expected role=${account.expected}, got role=${session?.user?.role}, OK=${ok}`);
    if (!ok) process.exitCode = 1;
  }
})();
