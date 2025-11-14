export async function api(path, opts = {}) {
  opts.credentials = 'include';
  opts.headers = opts.headers || {};
  if (opts.body && typeof opts.body === 'object') {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(opts.body);
  }
  const res = await fetch(path, opts);
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

export const login = (email, password) => api('/api/login', { method: 'POST', body: { email, password } });
export const logout = () => api('/api/logout', { method: 'POST' });
export const getStats = () => api('/api/stats');
export const getTasks = () => api('/api/tasks');
export const createTask = (body) => api('/api/tasks', { method: 'POST', body });
export const markDone = (id) => api(`/api/tasks/${id}/done`, { method: 'PUT' });
export const addJournal = (body) => api('/api/journal', { method: 'POST', body });
export const getJournals = (limit=6) => api(`/api/journal?limit=${limit}`);
export const getSuggestions = () => api('/api/suggestions');
