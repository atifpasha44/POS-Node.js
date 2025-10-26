// Lightweight API helper to centralize fetch options and error handling
const handleResponse = async (resp) => {
  const text = await resp.text().catch(() => '');
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (e) { json = null; }

  if (!resp.ok) {
    const message = (json && (json.message || json.error)) || text || `HTTP ${resp.status}`;
    const err = new Error(message);
    err.status = resp.status;
    err.body = json || text;
    throw err;
  }

  return json;
};

const defaultHeaders = () => ({ 'Content-Type': 'application/json' });

const request = async (url, opts = {}) => {
  const options = {
    credentials: 'include',
    headers: { ...defaultHeaders(), ...(opts.headers || {}) },
    ...opts
  };

  const resp = await fetch(url, options);
  return handleResponse(resp);
};

export default {
  get: (url, opts) => request(url, { method: 'GET', ...opts }),
  post: (url, body, opts) => request(url, { method: 'POST', body: JSON.stringify(body), ...opts }),
  put: (url, body, opts) => request(url, { method: 'PUT', body: JSON.stringify(body), ...opts }),
  delete: (url, opts) => request(url, { method: 'DELETE', ...opts })
};
