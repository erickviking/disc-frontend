const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiClient {
  constructor() {
    this.token = null;
    try { this.token = window.localStorage.getItem('disc_token') || null; } catch (e) {}
  }
  setToken(token) {
    this.token = token;
    try {
      if (token) window.localStorage.setItem('disc_token', token);
      else window.localStorage.removeItem('disc_token');
    } catch (e) {}
  }
  getToken() { return this.token; }
  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = 'Bearer ' + this.token;
    if (options.headers) Object.assign(headers, options.headers);

    const res = await fetch(API_BASE + path, { ...options, headers });

    if (res.status === 401) {
      this.setToken(null);
      window.location.href = '/login';
      throw new Error('Sessao expirada');
    }

    const contentType = res.headers.get('content-type') || '';
    const hasJson = contentType.includes('application/json');
    const data = hasJson ? await res.json() : null;

    if (!res.ok) {
      throw new Error(data?.error || 'Erro inesperado');
    }

    return data;
  }
  get(path) { return this.request(path); }
  post(path, body) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }); }
  patch(path, body) { return this.request(path, { method: 'PATCH', body: JSON.stringify(body) }); }
  delete(path) { return this.request(path, { method: 'DELETE' }); }
}

export const api = new ApiClient();
