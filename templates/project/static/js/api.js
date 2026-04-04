/* ================================================================
   api.js — HTTP client with JWT injection
   ================================================================ */

const API_BASE = '';

export async function request(method, path, body) {
  const token = Auth.token();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return {};
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json.message || json.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return json;
}

export const get    = (path)        => request('GET',    path);
export const post   = (path, body)  => request('POST',   path, body);
export const put    = (path, body)  => request('PUT',    path, body);
export const del    = (path)        => request('DELETE', path);
