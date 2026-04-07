/**
 * Login/register JSON responses must include ok: true. Do not redirect on HTTP 200 alone
 * (misconfigured proxies or bugs could otherwise send users through as "logged in").
 */
function apiJsonOk(res, data) {
  return !!(res && res.ok && data && data.ok === true);
}

/**
 * Human-readable login error when HTTP status and JSON disagree (e.g. 200 with empty body).
 */
function loginErrorMessage(res, data) {
  if (data && data.message) return data.message;
  if (res && res.ok && (!data || data.ok !== true)) {
    return (
      'Login did not complete: server returned HTTP ' +
      res.status +
      ' but not { ok: true }. In DevTools → Network → POST /api/login, check the Response. ' +
      'Use your Node app URL (not a static site); confirm /api/health shows the database.'
    );
  }
  return 'Login failed (' + (res ? res.status : '?') + ').';
}

async function getSession() {
  const res = await fetch('/api/session', { credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return null;
  return data.user || null;
}

function redirectIfGuest() {
  return getSession().then((user) => {
    if (!user) {
      window.location.href = '/';
      return null;
    }
    return user;
  });
}

async function apiJson(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  let data = {};
  try {
    data = await res.json();
  } catch (_) {}

  if (res.status === 401) {
    window.location.href = '/';
    return { res, data: null };
  }

  return { res, data };
}

function showNav(user) {
  const maintenanceLink = document.getElementById('nav-maintenance');
  if (maintenanceLink && user.role !== 'admin') {
    maintenanceLink.classList.add('hidden');
  }
  const vendorPortalLink = document.getElementById('nav-vendor-portal');
  if (vendorPortalLink) {
    vendorPortalLink.classList.toggle('hidden', user.role !== 'vendor');
  }
  const userPortalLink = document.getElementById('nav-user-portal');
  if (userPortalLink) {
    userPortalLink.classList.toggle('hidden', user.role !== 'user');
  }
}
