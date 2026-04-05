const fs = require('fs');
const path = require('path');

function w(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('OK:', filePath);
}

// vite.config.js
w('vite.config.js', `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
});
`);

// tailwind.config.js
w('tailwind.config.js', `export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        disc: { d: '#E63946', i: '#F4A261', s: '#2A9D8F', c: '#264653' },
        brand: {
          50: '#f0f4ff', 100: '#dbe4ff', 200: '#bac8ff', 300: '#91a7ff',
          400: '#748ffc', 500: '#5c7cfa', 600: '#4c6ef5', 700: '#4263eb',
          800: '#3b5bdb', 900: '#364fc7', 950: '#1e2a5e',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
`);

// postcss.config.js
w('postcss.config.js', `export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
`);

// index.html
w('index.html', `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DISC Analysis</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`);

// src/index.css
w('src/index.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900 antialiased;
  }
}

@layer components {
  .btn-primary {
    @apply inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
  }
  .btn-secondary {
    @apply inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2;
  }
  .input-field {
    @apply block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all;
  }
  .card {
    @apply rounded-xl border border-gray-200 bg-white p-6 shadow-sm;
  }
}
`);

// src/main.jsx
w('src/main.jsx', `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`);

// src/lib/api.js
w('src/lib/api.js', `const API_BASE = '/api';

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
    if (res.status === 401) { this.setToken(null); window.location.href = '/login'; throw new Error('Sessao expirada'); }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro inesperado');
    return data;
  }
  get(path) { return this.request(path); }
  post(path, body) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }); }
  patch(path, body) { return this.request(path, { method: 'PATCH', body: JSON.stringify(body) }); }
  delete(path) { return this.request(path, { method: 'DELETE' }); }
}

export const api = new ApiClient();
`);

// src/contexts/AuthContext.jsx
w('src/contexts/AuthContext.jsx', `import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = api.getToken();
    if (!token) { setLoading(false); return; }
    try { const data = await api.get('/auth/me'); setUser(data.user); }
    catch (err) { api.setToken(null); setUser(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    api.setToken(data.token); setUser(data.user); return data.user;
  };
  const register = async (payload) => {
    const data = await api.post('/auth/register', payload);
    api.setToken(data.token); setUser(data.user); return data.user;
  };
  const logout = () => { api.setToken(null); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin: user?.role === 'ADMIN', isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
`);

// src/components/ProtectedRoute.jsx
w('src/components/ProtectedRoute.jsx', `import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}
`);

// src/components/AppLayout.jsx
w('src/components/AppLayout.jsx', `import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { LayoutDashboard, Users, Link2, ClipboardList, LogOut, Menu, X, ChevronRight } from 'lucide-react';

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'Usuarios' },
  { to: '/admin/invites', icon: Link2, label: 'Convites' },
  { to: '/admin/assessments', icon: ClipboardList, label: 'Assessments' },
];
const userNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio', end: true },
  { to: '/dashboard/assessments', icon: ClipboardList, label: 'Meus Testes' },
];

export function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const nav = isAdmin ? adminNav : userNav;
  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = (user?.name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {open && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={"fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform lg:static lg:translate-x-0 " + (open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-display text-lg text-white">D</div>
          <div>
            <p className="font-display text-lg leading-none text-brand-950">DISC</p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Analysis</p>
          </div>
          <button className="ml-auto rounded-lg p-1 text-gray-400 hover:bg-gray-100 lg:hidden" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {nav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)}
              className={({ isActive }) => "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all " + (isActive ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900")}>
              <item.icon size={18} />{item.label}
              <ChevronRight size={14} className="ml-auto opacity-0 transition-opacity group-hover:opacity-50" />
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="truncate text-xs text-gray-400">{user?.email}</p>
            </div>
            <button onClick={handleLogout} title="Sair" className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"><Menu size={20} /></button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 font-display text-sm text-white">D</div>
            <span className="font-display text-base text-brand-950">DISC</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
`);

// src/pages/LoginPage.jsx
w('src/pages/LoginPage.jsx', `import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(''); setLoading(true);
    try { const u = await login(form.email, form.password); navigate(u.role === 'ADMIN' ? '/admin' : '/dashboard'); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  const onKey = (e) => { if (e.key === 'Enter') submit(); };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-brand-950">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 h-64 w-64 rounded-full bg-disc-d blur-[100px]" />
          <div className="absolute top-1/2 right-20 h-48 w-48 rounded-full bg-disc-i blur-[80px]" />
          <div className="absolute bottom-20 left-1/3 h-56 w-56 rounded-full bg-disc-s blur-[90px]" />
          <div className="absolute top-1/3 left-1/2 h-40 w-40 rounded-full bg-disc-c blur-[70px]" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 font-display text-2xl text-white backdrop-blur">D</div>
            <div><p className="font-display text-2xl text-white">DISC</p><p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">Analise Comportamental</p></div>
          </div>
          <h1 className="font-display text-4xl leading-tight text-white/90">Descubra seu perfil<br /><span className="italic text-white">comportamental</span></h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/50">Uma ferramenta profissional de analise comportamental DISC com inteligencia artificial.</p>
          <div className="mt-12 space-y-3 max-w-xs">
            {[{l:'Dominancia',c:'bg-disc-d',w:'w-[85%]'},{l:'Influencia',c:'bg-disc-i',w:'w-[65%]'},{l:'Estabilidade',c:'bg-disc-s',w:'w-[70%]'},{l:'Conformidade',c:'bg-disc-c',w:'w-[55%]'}].map(b=>(
              <div key={b.l}><div className="flex justify-between text-xs text-white/40 mb-1"><span>{b.l}</span></div><div className="h-1.5 rounded-full bg-white/10"><div className={"h-full rounded-full "+b.c+" "+b.w} /></div></div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 font-display text-xl text-white">D</div>
            <div><p className="font-display text-xl text-brand-950">DISC</p><p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Analysis</p></div>
          </div>
          <h2 className="font-display text-2xl text-gray-900">Entrar</h2>
          <p className="mt-1 text-sm text-gray-500">Acesse sua conta para continuar</p>
          {error && <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">{error}</div>}
          <div className="mt-6 space-y-4">
            <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label><input type="email" className="input-field" placeholder="seu@email.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} onKeyDown={onKey} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Senha</label>
              <div className="relative"><input type={showPw?'text':'password'} className="input-field pr-10" placeholder="********" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} onKeyDown={onKey} />
              <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button></div>
            </div>
            <button onClick={submit} disabled={loading||!form.email||!form.password} className="btn-primary w-full gap-2">{loading?<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"/>:<>Entrar <ArrowRight size={16}/></>}</button>
          </div>
          <p className="mt-6 text-center text-sm text-gray-500">Nao tem uma conta? <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">Cadastre-se</Link></p>
        </div>
      </div>
    </div>
  );
}
`);

// src/pages/RegisterPage.jsx
w('src/pages/RegisterPage.jsx', `import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { Eye, EyeOff, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', inviteCode: searchParams.get('invite')||'' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [invSt, setInvSt] = useState(null);
  const [invMsg, setInvMsg] = useState('');

  useEffect(() => {
    const c = form.inviteCode.trim();
    if (!c) { setInvSt(null); setInvMsg(''); return; }
    if (c.length < 5) return;
    const t = setTimeout(async () => {
      try { const d = await api.get('/invites/'+c+'/validate'); setInvSt(d.valid?'valid':'invalid'); setInvMsg(d.valid?'Convite valido':d.reason); }
      catch(e) { setInvSt('invalid'); setInvMsg('Erro ao validar'); }
    }, 500);
    return () => clearTimeout(t);
  }, [form.inviteCode]);

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      const p = { name:form.name, email:form.email, password:form.password };
      if (form.phone) p.phone = form.phone;
      if (form.inviteCode) p.inviteCode = form.inviteCode;
      const u = await register(p);
      navigate(u.role==='ADMIN'?'/admin':'/dashboard');
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 font-display text-xl text-white">D</div>
          <div><p className="font-display text-xl text-brand-950">DISC</p><p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Analysis</p></div>
        </div>
        <div className="card">
          <h2 className="font-display text-2xl text-gray-900">Criar conta</h2>
          <p className="mt-1 text-sm text-gray-500">Preencha seus dados para se cadastrar</p>
          {error && <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">{error}</div>}
          <div className="mt-6 space-y-4">
            <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Nome completo</label><input className="input-field" placeholder="Seu nome" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label><input type="email" className="input-field" placeholder="seu@email.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Telefone <span className="text-gray-400">(opcional)</span></label><input type="tel" className="input-field" placeholder="(11) 99999-9999" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Senha</label>
              <div className="relative"><input type={showPw?'text':'password'} className="input-field pr-10" placeholder="Minimo 6 caracteres" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
              <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button></div>
            </div>
            <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Codigo de convite <span className="text-gray-400">(opcional)</span></label>
              <div className="relative"><input className={"input-field pr-10 "+(invSt==='valid'?'border-green-400':invSt==='invalid'?'border-red-400':'')} placeholder="Cole seu codigo aqui" value={form.inviteCode} onChange={e=>setForm({...form,inviteCode:e.target.value})} />
              {invSt==='valid'&&<CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"/>}
              {invSt==='invalid'&&<XCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500"/>}</div>
              {invMsg&&<p className={"mt-1 text-xs "+(invSt==='valid'?'text-green-600':'text-red-600')}>{invMsg}</p>}
            </div>
            <button onClick={submit} disabled={loading||!form.name||!form.email||!form.password} className="btn-primary w-full gap-2">{loading?<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"/>:<>Criar conta <ArrowRight size={16}/></>}</button>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-gray-500">Ja tem uma conta? <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">Entrar</Link></p>
      </div>
    </div>
  );
}
`);

// src/pages/AdminDashboard.jsx
w('src/pages/AdminDashboard.jsx', `import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { Users, ClipboardList, Link2, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const d = await api.get('/admin/users?limit=1'); setStats({ totalUsers: d.pagination.total }); }
      catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };
  const cards = [
    { label: 'Usuarios', value: stats?.totalUsers || 0, icon: Users, color: 'text-brand-600 bg-brand-50' },
    { label: 'Assessments', value: '--', icon: ClipboardList, color: 'text-disc-s bg-emerald-50', note: 'Sprint 2' },
    { label: 'Convites', value: '--', icon: Link2, color: 'text-disc-i bg-amber-50', note: 'Em breve' },
    { label: 'Relatorios', value: '--', icon: TrendingUp, color: 'text-disc-d bg-red-50', note: 'Sprint 3' },
  ];

  return (
    <div>
      <div className="mb-8"><h1 className="font-display text-2xl text-gray-900">{greeting()}, {(user?.name||'').split(' ')[0]}</h1><p className="mt-1 text-sm text-gray-500">Visao geral do sistema DISC</p></div>
      {loading ? <div className="flex items-center gap-2 text-sm text-gray-400"><div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />Carregando...</div> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(c => (
            <div key={c.label} className="card"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-gray-500">{c.label}</p><p className="mt-2 text-3xl font-semibold text-gray-900">{c.value}</p>{c.note && <p className="mt-1 text-xs text-gray-400">{c.note}</p>}</div><div className={"rounded-lg p-2.5 "+c.color}><c.icon size={20} /></div></div></div>
          ))}
        </div>
      )}
    </div>
  );
}
`);

// src/pages/AdminUsersPage.jsx
w('src/pages/AdminUsersPage.jsx', `import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';
import { Search, Plus, MoreVertical, Shield, User as UserIcon, X, Check, Ban } from 'lucide-react';

function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', role:'USER' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setError(''); setLoading(true);
    try { await api.post('/admin/users', form); onCreated(); onClose(); }
    catch(e) { setError(e.message); } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5"><h3 className="font-display text-xl text-gray-900">Novo Usuario</h3><button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={18}/></button></div>
        {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">{error}</div>}
        <div className="space-y-4">
          <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Nome</label><input className="input-field" placeholder="Nome completo" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label><input type="email" className="input-field" placeholder="email@exemplo.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
          <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Telefone</label><input className="input-field" placeholder="(11) 99999-9999" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
          <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Senha</label><input type="password" className="input-field" placeholder="Minimo 6 caracteres" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div>
          <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Papel</label>
            <div className="flex gap-3">{['USER','ADMIN'].map(r=>(<button key={r} onClick={()=>setForm({...form,role:r})} className={"flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all "+(form.role===r?'border-brand-500 bg-brand-50 text-brand-700':'border-gray-200 text-gray-600 hover:bg-gray-50')}>{r==='ADMIN'?<Shield size={14}/>:<UserIcon size={14}/>}{r==='ADMIN'?'Admin':'Usuario'}</button>))}</div>
          </div>
        </div>
        <div className="mt-6 flex gap-3 justify-end"><button onClick={onClose} className="btn-secondary">Cancelar</button><button onClick={submit} disabled={loading||!form.name||!form.email||!form.password} className="btn-primary">{loading?'Criando...':'Criar Usuario'}</button></div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [pag, setPag] = useState({ total:0, page:1, pages:1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [menu, setMenu] = useState(null);

  const load = useCallback(async (page=1) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) p.set('search', search);
      const d = await api.get('/admin/users?'+p.toString());
      setUsers(d.users); setPag(d.pagination);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { const t = setTimeout(()=>load(1), 300); return ()=>clearTimeout(t); }, [load]);

  const toggleActive = async (id, active) => { try { await api.patch('/admin/users/'+id, {isActive:!active}); load(pag.page); } catch(e){alert(e.message);} setMenu(null); };
  const toggleRole = async (id, role) => { try { await api.patch('/admin/users/'+id, {role:role==='ADMIN'?'USER':'ADMIN'}); load(pag.page); } catch(e){alert(e.message);} setMenu(null); };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div><h1 className="font-display text-2xl text-gray-900">Usuarios</h1><p className="mt-1 text-sm text-gray-500">{pag.total} usuario{pag.total!==1?'s':''} cadastrado{pag.total!==1?'s':''}</p></div>
        <button onClick={()=>setShowCreate(true)} className="btn-primary gap-2"><Plus size={16}/>Novo Usuario</button>
      </div>
      <div className="relative mb-4 max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" className="input-field pl-9" placeholder="Buscar por nome ou email..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <div className="card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50"><th className="px-4 py-3 text-left font-medium text-gray-500">Nome</th><th className="px-4 py-3 text-left font-medium text-gray-500">Email</th><th className="px-4 py-3 text-left font-medium text-gray-500">Papel</th><th className="px-4 py-3 text-left font-medium text-gray-500">Status</th><th className="px-4 py-3 text-left font-medium text-gray-500">Testes</th><th className="px-4 py-3 text-right font-medium text-gray-500">Acoes</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400"><div className="flex items-center justify-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"/>Carregando...</div></td></tr>
              : users.length===0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Nenhum usuario encontrado</td></tr>
              : users.map(u=>(
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">{(u.name||'?')[0].toUpperCase()}</div><span className="font-medium text-gray-900">{u.name}</span></div></td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3"><span className={"inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium "+(u.role==='ADMIN'?'bg-purple-50 text-purple-700':'bg-gray-100 text-gray-600')}>{u.role==='ADMIN'?<Shield size={10}/>:<UserIcon size={10}/>}{u.role==='ADMIN'?'Admin':'Usuario'}</span></td>
                  <td className="px-4 py-3"><span className={"inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium "+(u.isActive?'bg-green-50 text-green-700':'bg-red-50 text-red-700')}>{u.isActive?<Check size={10}/>:<Ban size={10}/>}{u.isActive?'Ativo':'Inativo'}</span></td>
                  <td className="px-4 py-3 text-gray-600">{u.assessmentCount}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-block">
                      <button onClick={()=>setMenu(menu===u.id?null:u.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><MoreVertical size={16}/></button>
                      {menu===u.id&&(<><div className="fixed inset-0 z-10" onClick={()=>setMenu(null)}/><div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"><button onClick={()=>toggleRole(u.id,u.role)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Shield size={14}/>{u.role==='ADMIN'?'Remover Admin':'Tornar Admin'}</button><button onClick={()=>toggleActive(u.id,u.isActive)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Ban size={14}/>{u.isActive?'Desativar':'Reativar'}</button></div></>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pag.pages>1&&<div className="flex items-center justify-between border-t border-gray-100 px-4 py-3"><p className="text-sm text-gray-500">Pagina {pag.page} de {pag.pages}</p><div className="flex gap-2"><button onClick={()=>load(pag.page-1)} disabled={pag.page<=1} className="btn-secondary !py-1.5 !px-3 !text-xs disabled:opacity-40">Anterior</button><button onClick={()=>load(pag.page+1)} disabled={pag.page>=pag.pages} className="btn-secondary !py-1.5 !px-3 !text-xs disabled:opacity-40">Proxima</button></div></div>}
      </div>
      {showCreate&&<CreateUserModal onClose={()=>setShowCreate(false)} onCreated={()=>load(1)}/>}
    </div>
  );
}
`);

// src/pages/AdminInvitesPage.jsx
w('src/pages/AdminInvitesPage.jsx', `import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { Plus, Copy, Check, Trash2, Link2, Clock, AlertCircle } from 'lucide-react';

export default function AdminInvitesPage() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [maxUses, setMaxUses] = useState(1);
  const [expDays, setExpDays] = useState(7);
  const [copied, setCopied] = useState(null);

  const load = async () => { try { const d = await api.get('/admin/invites'); setInvites(d.invites); } catch(e){console.error(e);} finally{setLoading(false);} };
  useEffect(() => { load(); }, []);

  const create = async () => {
    setCreating(true);
    try {
      const d = await api.post('/admin/invites', { maxUses, expiresInDays: expDays||undefined });
      await load();
      try { await navigator.clipboard.writeText(d.invite.url); setCopied(d.invite.id); setTimeout(()=>setCopied(null),2000); } catch(e){}
    } catch(e){alert(e.message);} finally{setCreating(false);}
  };
  const copyLink = async (code) => { try { await navigator.clipboard.writeText(window.location.origin+'/register?invite='+code); setCopied(code); setTimeout(()=>setCopied(null),2000); } catch(e){} };
  const deactivate = async (id) => { try { await api.delete('/admin/invites/'+id); load(); } catch(e){alert(e.message);} };
  const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-2xl text-gray-900">Convites</h1><p className="mt-1 text-sm text-gray-500">Gere links de convite para novos usuarios</p></div>
      <div className="card mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Gerar novo convite</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div><label className="mb-1.5 block text-xs font-medium text-gray-500">Max. de usos</label><input type="number" min={1} max={100} className="input-field w-24" value={maxUses} onChange={e=>setMaxUses(Number(e.target.value))}/></div>
          <div><label className="mb-1.5 block text-xs font-medium text-gray-500">Expira em (dias)</label><input type="number" min={1} max={90} className="input-field w-24" value={expDays} onChange={e=>setExpDays(Number(e.target.value))}/></div>
          <button onClick={create} disabled={creating} className="btn-primary gap-2">{creating?<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"/>:<Plus size={16}/>}Gerar Convite</button>
        </div>
      </div>
      <div className="space-y-3">
        {loading?<div className="card flex items-center justify-center py-12 text-gray-400"><div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent mr-2"/>Carregando...</div>
        :invites.length===0?<div className="card flex flex-col items-center py-12 text-gray-400"><Link2 size={32} className="mb-2 opacity-40"/><p>Nenhum convite criado</p></div>
        :invites.map(inv=>{
          const ok=inv.isActive&&!inv.isExpired&&!inv.isExhausted;
          return(
            <div key={inv.id} className={"card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between "+(!ok?'opacity-60':'')}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className="rounded bg-gray-100 px-2 py-0.5 text-sm font-mono text-brand-700">{inv.code}</code>
                  {!inv.isActive&&<span className="text-xs text-red-500 font-medium flex items-center gap-1"><AlertCircle size={12}/>Desativado</span>}
                  {inv.isExpired&&<span className="text-xs text-amber-600 font-medium flex items-center gap-1"><Clock size={12}/>Expirado</span>}
                  {inv.isExhausted&&<span className="text-xs text-gray-500 font-medium">Esgotado</span>}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400"><span>Usos: {inv.usedCount}/{inv.maxUses}</span><span>Criado: {fmtDate(inv.createdAt)}</span>{inv.expiresAt&&<span>Expira: {fmtDate(inv.expiresAt)}</span>}</div>
              </div>
              <div className="flex items-center gap-2">
                {ok&&<button onClick={()=>copyLink(inv.code)} className="btn-secondary !py-1.5 !px-3 !text-xs gap-1.5">{copied===inv.code?<><Check size={12} className="text-green-500"/>Copiado!</>:<><Copy size={12}/>Copiar Link</>}</button>}
                {inv.isActive&&<button onClick={()=>deactivate(inv.id)} title="Desativar" className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={14}/></button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
`);

// src/pages/AdminAssessmentsPage.jsx
w('src/pages/AdminAssessmentsPage.jsx', `import { ClipboardList } from 'lucide-react';

export default function AdminAssessmentsPage() {
  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-2xl text-gray-900">Assessments</h1><p className="mt-1 text-sm text-gray-500">Gerencie os testes DISC de todos os usuarios</p></div>
      <div className="card flex flex-col items-center py-16 text-center">
        <div className="mb-4 rounded-xl bg-gray-100 p-4 text-gray-400"><ClipboardList size={32}/></div>
        <h3 className="font-display text-lg text-gray-500">Sprint 2</h3>
        <p className="mt-2 max-w-xs text-sm text-gray-400">A listagem e gerenciamento de assessments sera implementada no proximo sprint.</p>
      </div>
    </div>
  );
}
`);

// src/pages/UserDashboard.jsx
w('src/pages/UserDashboard.jsx', `import { useAuth } from '../contexts/AuthContext.jsx';
import { ClipboardList, Clock } from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();
  const greeting = () => { const h = new Date().getHours(); return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'; };

  return (
    <div>
      <div className="mb-8"><h1 className="font-display text-2xl text-gray-900">{greeting()}, {(user?.name||'').split(' ')[0]}</h1><p className="mt-1 text-sm text-gray-500">Bem-vindo a plataforma de analise comportamental DISC</p></div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card flex flex-col items-center py-10 text-center">
          <div className="mb-4 rounded-xl bg-brand-50 p-4 text-brand-600"><ClipboardList size={32}/></div>
          <h3 className="font-display text-lg text-gray-900">Questionario DISC</h3>
          <p className="mt-2 max-w-xs text-sm text-gray-500">Responda o questionario para descobrir seu perfil comportamental. Leva cerca de 10 minutos.</p>
          <button disabled className="btn-primary mt-6 gap-2 opacity-60 cursor-not-allowed"><Clock size={16}/>Disponivel em breve</button>
          <p className="mt-2 text-xs text-gray-400">Sprint 2</p>
        </div>
        <div className="card flex flex-col items-center py-10 text-center">
          <div className="mb-4 rounded-xl bg-gray-100 p-4 text-gray-400">
            <svg width="32" height="32" viewBox="0 0 100 100"><polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="currentColor" strokeWidth="2"/><polygon points="50,20 80,35 80,65 50,80 20,65 20,35" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1"/></svg>
          </div>
          <h3 className="font-display text-lg text-gray-900">Meus Relatorios</h3>
          <p className="mt-2 max-w-xs text-sm text-gray-500">Apos completar o questionario e a liberacao do seu coach, seu relatorio personalizado ficara disponivel aqui.</p>
        </div>
      </div>
    </div>
  );
}
`);

// src/App.jsx
w('src/App.jsx', `import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AppLayout } from './components/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import AdminInvitesPage from './pages/AdminInvitesPage.jsx';
import AdminAssessmentsPage from './pages/AdminAssessmentsPage.jsx';
import UserDashboard from './pages/UserDashboard.jsx';

function RootRedirect() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"/></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AppLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="invites" element={<AdminInvitesPage />} />
            <Route path="assessments" element={<AdminAssessmentsPage />} />
          </Route>
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<UserDashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
`);

console.log('\n✓ Todos os arquivos do frontend criados com sucesso!');
console.log('Rode: npm run dev');
