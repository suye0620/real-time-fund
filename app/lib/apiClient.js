const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export function isApiConfigured() {
  return typeof API_BASE === 'string';
}

async function apiFetch(p, options = {}) {
  const url = `${API_BASE}${p}`;
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

export async function fetchAllState() {
  return apiFetch('/api/state');
}

export async function fetchStateByKey(key) {
  return apiFetch(`/api/state/${encodeURIComponent(key)}`);
}

export async function uploadState(key, value) {
  return apiFetch(`/api/state/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  });
}

export async function uploadStateBatch(entries) {
  return apiFetch('/api/state', {
    method: 'POST',
    body: JSON.stringify({ entries }),
  });
}



