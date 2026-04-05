const fs = require('fs');
const path = require('path');
function w(f, c) {
  const d = path.dirname(f);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(f, c, 'utf8');
  console.log('OK:', f);
}

// ============================================
// 1. TAILWIND - Gold premium palette
// ============================================

w('../frontend/tailwind.config.js', `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0f0f0f',
          dim: '#0f0f0f',
          bright: '#2a2a2a',
          container: { DEFAULT: '#1a1a1a', low: '#151515', high: '#222222', highest: '#2d2d2d', lowest: '#0a0a0a' },
          variant: '#2d2d2d',
          tint: '#d4a853',
        },
        primary: { DEFAULT: '#d4a853', container: '#7a6230', fixed: '#f0d48a', 'fixed-dim': '#d4a853' },
        secondary: { DEFAULT: '#c4b99a', container: '#4a4535' },
        tertiary: { DEFAULT: '#a8b8d8', container: '#4a5570' },
        outline: { DEFAULT: '#6b6355', variant: '#3d3830' },
        on: {
          surface: '#ededed', 'surface-variant': '#bfb5a8', background: '#ededed',
          primary: '#1a1200', 'primary-container': '#fff8e8', 'primary-fixed': '#2c1f00',
          secondary: '#2d2a22', 'secondary-container': '#d4cbb5',
          tertiary: '#1a2440', 'tertiary-container': '#e8eeff',
          error: '#690005',
        },
        error: { DEFAULT: '#ffb4ab', container: '#93000a' },
        disc: { d: '#E63946', i: '#F4A261', s: '#2A9D8F', c: '#264653' },
        gold: {
          50: '#fdf9ef', 100: '#f9f0d5', 200: '#f0d48a', 300: '#e8c060',
          400: '#d4a853', 500: '#c4942e', 600: '#a67624', 700: '#7a5a20',
          800: '#5c4318', 900: '#3d2d10', 950: '#1a1200',
        },
      },
      fontFamily: {
        headline: ['"Noto Serif"', 'serif'],
        body: ['"Manrope"', 'sans-serif'],
        label: ['"Manrope"', 'sans-serif'],
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem' },
    },
  },
  plugins: [],
};
`);

// ============================================
// 2. CSS - Gold accents
// ============================================

w('../frontend/src/index.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    font-family: 'Manrope', sans-serif;
    background-color: #0f0f0f;
    color: #ededed;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

@layer components {
  .btn-primary {
    @apply inline-flex items-center justify-center rounded-xl bg-primary text-on-primary px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all hover:bg-gold-300 disabled:opacity-40 disabled:cursor-not-allowed;
  }
  .btn-secondary {
    @apply inline-flex items-center justify-center rounded-xl border border-outline-variant/30 bg-surface-container px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-on-surface-variant transition-all hover:bg-surface-container-high hover:border-outline-variant/50;
  }
  .btn-ghost {
    @apply inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-primary transition-all hover:bg-surface-container;
  }
  .input-field {
    @apply block w-full rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all;
  }
  .card {
    @apply rounded-3xl border border-outline-variant/15 bg-surface-container p-6;
  }
  .bg-glow {
    background: radial-gradient(circle at top right, rgba(212, 168, 83, 0.03), transparent 50%),
                radial-gradient(circle at bottom left, rgba(168, 184, 216, 0.02), transparent 50%);
  }
}

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  vertical-align: middle;
}
`);

// ============================================
// 3. LOGIN - Gold + Vanessa photo
// ============================================

w('../frontend/src/pages/LoginPage.jsx', `import { useState } from 'react';
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
    <div className="flex min-h-screen bg-surface">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-surface-container-lowest">
        <div className="absolute inset-0 bg-glow" />
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] overflow-hidden opacity-20">
          <img src="/vanessa-hero.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <p className="text-4xl font-headline text-primary tracking-tight mb-2">Vanessa Rocha</p>
          <p className="text-sm uppercase tracking-[0.25em] text-on-surface-variant/50 font-medium mb-12">Desenvolvimento Pessoal</p>

          <h1 className="text-4xl font-headline font-bold text-on-surface tracking-tighter leading-tight mb-4">
            Descubra seu perfil<br /><span className="italic font-normal text-primary">comportamental</span>
          </h1>
          <p className="text-on-surface-variant/70 text-sm leading-relaxed max-w-md">
            Uma plataforma premium de analise comportamental e desenvolvimento pessoal com inteligencia artificial.
          </p>

          <div className="mt-12 space-y-4 max-w-xs">
            {[{l:'Executor',w:'85%'},{l:'Comunicador',w:'65%'},{l:'Planejador',w:'70%'},{l:'Analista',w:'55%'}].map(b => (
              <div key={b.l} className="space-y-1.5">
                <span className="text-xs uppercase tracking-wider text-on-surface-variant/50 font-semibold">{b.l}</span>
                <div className="h-1.5 rounded-full bg-surface-container-high">
                  <div className="h-full rounded-full bg-primary/50" style={{width: b.w}} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden text-center">
            <img src="/vanessa-profile.jpg" alt="Vanessa Rocha" className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-primary/30" />
            <p className="text-2xl font-headline text-primary tracking-tight">Vanessa Rocha</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/50 mt-1">Desenvolvimento Pessoal</p>
          </div>

          <h2 className="text-3xl font-headline font-bold text-on-surface tracking-tight">Entrar</h2>
          <p className="mt-2 text-sm text-on-surface-variant/60">Acesse sua conta para continuar</p>

          {error && <div className="mt-4 rounded-xl bg-error-container/20 border border-error/20 px-4 py-3 text-sm text-error">{error}</div>}

          <div className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant/60">Email</label>
              <input type="email" className="input-field" placeholder="seu@email.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} onKeyDown={onKey} />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant/60">Senha</label>
              <div className="relative">
                <input type={showPw?'text':'password'} className="input-field pr-12" placeholder="********" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} onKeyDown={onKey} />
                <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant">{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button>
              </div>
            </div>
            <button onClick={submit} disabled={loading||!form.email||!form.password} className="btn-primary w-full gap-2 py-3.5">
              {loading?<div className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent"/>:<>Entrar <ArrowRight size={14}/></>}
            </button>
          </div>
          <p className="mt-8 text-center text-sm text-on-surface-variant/50">Nao tem uma conta? <Link to="/register" className="font-semibold text-primary hover:text-gold-300">Cadastre-se</Link></p>
        </div>
      </div>
    </div>
  );
}
`);

// ============================================
// 4. SIDEBAR - Gold + Vanessa photo
// ============================================

w('../frontend/src/components/AppLayout.jsx', `import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { LayoutDashboard, Users, Wrench, Link2, ClipboardList, LogOut, Menu, X, ChevronRight } from 'lucide-react';

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'Usuarios' },
  { to: '/admin/tools', icon: Wrench, label: 'Ferramentas' },
  { to: '/admin/invites', icon: Link2, label: 'Convites' },
  { to: '/admin/assessments', icon: ClipboardList, label: 'Assessments' },
];
const userNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio', end: true },
  { to: '/dashboard/assessments', icon: ClipboardList, label: 'Minhas Avaliacoes' },
];

export function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const nav = isAdmin ? adminNav : userNav;
  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = (user?.name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-surface">
      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}

      <aside className={"fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-surface-container-lowest border-r border-outline-variant/10 py-8 px-6 transition-transform lg:static lg:translate-x-0 " + (open ? "translate-x-0" : "-translate-x-full")}>
        {/* Brand with Vanessa photo */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <img src="/vanessa-profile.jpg" alt="Vanessa Rocha" className="w-11 h-11 rounded-full border-2 border-primary/30 object-cover" />
            <div>
              <p className="text-lg font-headline text-primary tracking-tight leading-tight">Vanessa Rocha</p>
              <p className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant/40 font-medium">Desenvolvimento Pessoal</p>
            </div>
          </div>
          <button className="lg:hidden ml-auto absolute top-6 right-6 p-1 rounded-lg text-on-surface-variant/50 hover:bg-surface-container" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>

        <nav className="flex-1 space-y-1.5">
          {nav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)}
              className={({ isActive }) => "group flex items-center gap-3.5 py-2.5 px-4 rounded-xl text-sm transition-all duration-200 " + (isActive ? "text-primary font-semibold bg-primary/10 border-l-2 border-primary" : "text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container")}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="pt-5 border-t border-outline-variant/10">
            <button onClick={handleLogout} className="flex items-center gap-3.5 w-full py-2.5 px-4 rounded-xl text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          </div>
          <div className="flex items-center gap-3 px-2 pt-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-on-surface">{user?.name}</p>
              <p className="truncate text-[11px] text-on-surface-variant/40">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 h-16 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/10 lg:hidden">
          <button onClick={() => setOpen(true)} className="p-2 rounded-xl hover:bg-surface-container"><Menu size={20} className="text-on-surface-variant" /></button>
          <span className="text-lg font-headline text-primary">Vanessa Rocha</span>
          <img src="/vanessa-profile.jpg" alt="" className="w-9 h-9 rounded-full border border-primary/20 object-cover" />
        </header>

        <main className="flex-1 overflow-y-auto bg-glow">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-8 lg:pt-14 pb-24 lg:pb-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
`);

// ============================================
// 5. DASHBOARD - Gold accents
// ============================================

w('../frontend/src/pages/UserDashboard.jsx', `import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { ArrowRight, Lock, CheckCircle2, Users, Target, Heart, Compass, Rocket, Shield, BookOpen } from 'lucide-react';

const iconMap = { Users, Target, Heart, Compass, Rocket, Shield, BookOpen };
const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };

function HeroCard({ tool, assessment, onAction }) {
  const scores = assessment?.scoresRaw?.normalized;
  const hasReport = !!assessment?.report;
  const sorted = scores ? Object.entries(scores).sort((a,b) => b[1] - a[1]) : [];

  return (
    <div className="lg:col-span-4 md:col-span-2 group relative rounded-3xl overflow-hidden border border-outline-variant/10 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/90 to-surface/50" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/6 to-transparent" />
      <div className="relative p-8 lg:p-10 flex flex-col justify-between min-h-[380px]">
        <div>
          <div className="flex justify-between items-start mb-10">
            <div>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Concluido
              </span>
              <h3 className="text-2xl lg:text-3xl font-headline font-semibold text-on-surface tracking-tight">{tool.name}</h3>
            </div>
            <CheckCircle2 size={36} className="text-primary" />
          </div>
          {scores && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-5 max-w-3xl">
              {['D','I','S','C'].map((f, i) => {
                const isTop = sorted[0]?.[0] === f || sorted[1]?.[0] === f;
                return (
                  <div key={f} className="space-y-2">
                    <div className="flex justify-between text-xs uppercase tracking-wider font-semibold">
                      <span className={"text-on-surface" + (isTop ? '' : '/60')}>{profileNames[f]}</span>
                      <span className={isTop ? 'text-primary font-bold' : 'text-on-surface/50'}>{scores[f]}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden ring-1 ring-white/5">
                      <div className={"h-full rounded-full transition-all " + (isTop ? 'bg-primary shadow-[0_0_12px_rgba(212,168,83,0.4)]' : 'bg-secondary-container')}
                        style={{ width: scores[f] + '%' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-xs text-on-surface-variant/50 font-medium italic">
            Perfil: {assessment?.profilePrimary && profileNames[assessment.profilePrimary]} / {assessment?.profileSecondary && profileNames[assessment.profileSecondary]}
          </p>
          <button onClick={() => onAction(hasReport ? 'report' : 'view')}
            className="text-primary text-xs font-bold uppercase tracking-widest hover:text-gold-300 flex items-center gap-2 transition-colors">
            {hasReport ? 'Ver Relatorio Completo' : 'Aguardando Liberacao'}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AvailableCard({ tool, onStart }) {
  return (
    <div className="lg:col-span-2 group relative rounded-3xl overflow-hidden border border-outline-variant/10 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer flex flex-col"
      onClick={() => onStart(tool)}>
      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface-container to-surface-container" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      <div className="relative p-8 lg:p-9 flex flex-col flex-1 min-h-[340px]">
        <div className="flex justify-between items-start mb-12">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-tertiary/15 text-tertiary text-xs font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            Disponivel
          </span>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-surface/60 group-hover:translate-x-1 transition-transform">
            <ArrowRight size={16} className="text-primary" />
          </div>
        </div>
        <div className="mt-auto">
          <h3 className="text-2xl font-headline font-semibold text-on-surface mb-3 tracking-tight">{tool.name}</h3>
          <p className="text-sm text-on-surface-variant/70 leading-relaxed font-medium max-w-xs">{tool.description}</p>
          <button className="mt-8 w-full py-3.5 bg-white/5 hover:bg-primary border border-white/10 group-hover:border-primary rounded-xl text-xs font-bold uppercase tracking-widest group-hover:text-on-primary transition-all duration-300">
            Comecar Agora
          </button>
        </div>
      </div>
    </div>
  );
}

function LockedCardLarge({ tool }) {
  return (
    <div className="lg:col-span-2 relative rounded-3xl overflow-hidden border border-outline-variant/5 flex flex-col min-h-[300px] group">
      <div className="absolute inset-0 bg-surface-container" />
      <div className="relative p-8 flex flex-col flex-1 opacity-50 group-hover:opacity-70 transition-opacity">
        <div className="flex justify-between items-start mb-10">
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-secondary-container/40 text-secondary text-xs font-bold uppercase tracking-widest">Brevemente</span>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-surface/40"><Lock size={16} className="text-on-surface-variant/50" /></div>
        </div>
        <div className="mt-auto">
          <h3 className="text-2xl font-headline font-medium text-on-surface mb-2 tracking-tight">{tool.name}</h3>
          <p className="text-sm text-on-surface-variant/60 max-w-xs">{tool.description}</p>
        </div>
      </div>
    </div>
  );
}

function LockedCardCompact({ tool }) {
  const Icon = iconMap[tool.icon] || Shield;
  return (
    <div className="lg:col-span-3 bg-surface-container-low rounded-3xl p-7 border border-outline-variant/5 opacity-60 hover:opacity-90 transition-opacity flex items-center gap-5">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container text-on-surface-variant/30 shrink-0"><Icon size={26} /></div>
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <h3 className="text-lg font-headline font-medium text-on-surface tracking-tight">{tool.name}</h3>
          <Lock size={12} className="text-on-surface-variant/40" />
        </div>
        <p className="text-sm text-on-surface-variant/50 font-medium">{tool.description}</p>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tools, setTools] = useState([]);
  const [allTools, setAllTools] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [td, ad] = await Promise.all([api.get('/tools'), api.get('/assessments/mine')]);
        setTools(td.tools); setAssessments(ad.assessments);
        try { setAllTools((await api.get('/tools/all')).tools || []); } catch(e) { setAllTools([]); }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const greeting = () => { const h = new Date().getHours(); return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'; };
  const accessibleSlugs = new Set(tools.map(t => t.slug));
  const lockedTools = allTools.filter(t => !accessibleSlugs.has(t.slug) && t.isActive);
  const discTool = tools.find(t => t.slug === 'disc');
  const discAssessment = assessments.find(a => a.status !== 'IN_PROGRESS' && a.scoresRaw);
  const otherTools = tools.filter(t => t.slug !== 'disc');
  const lockedLarge = lockedTools.slice(0, 4);
  const lockedCompact = lockedTools.slice(4);

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"/></div>;

  return (
    <div>
      <section className="mb-14">
        <span className="text-primary text-xs font-semibold uppercase tracking-widest mb-3 block">Painel de Evolucao Pessoal</span>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold text-on-surface tracking-tighter leading-tight">
          {greeting()}, <span className="italic font-normal text-primary">{(user?.name||'').split(' ')[0]}</span>
        </h1>
        <p className="text-on-surface-variant/60 text-base md:text-lg mt-5 max-w-2xl font-light leading-relaxed">
          Bem-vindo ao seu espaco de crescimento. Explore suas ferramentas de desenvolvimento pessoal.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-8">
        {discTool && discAssessment && <HeroCard tool={discTool} assessment={discAssessment} onAction={(a) => { if (a==='report' && discAssessment) navigate('/report/'+discAssessment.id); else navigate('/quiz'); }} />}
        {discTool && !discAssessment && <div className="lg:col-span-4 md:col-span-2"><AvailableCard tool={discTool} onStart={() => navigate('/quiz')} /></div>}
        {otherTools.map(t => <AvailableCard key={t.id} tool={t} onStart={() => navigate('/quiz')} />)}
        {lockedLarge.map(t => <LockedCardLarge key={t.id} tool={t} />)}
        {lockedCompact.map(t => <LockedCardCompact key={t.id} tool={t} />)}

        {discAssessment && (
          <div className="lg:col-span-6 md:col-span-2 relative rounded-3xl p-10 lg:p-12 overflow-hidden flex items-center border border-primary/15 mt-4" style={{background:'linear-gradient(135deg, #7a6230 0%, #5c4318 100%)'}}>
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute right-8 top-8 hidden lg:block">
              <img src="/vanessa-profile.jpg" alt="Vanessa Rocha" className="w-24 h-24 rounded-2xl border-2 border-white/10 object-cover opacity-80" />
            </div>
            <div className="relative z-10 max-w-2xl">
              <span className="inline-block px-3 py-1 rounded-full bg-black/20 text-gold-100 text-[10px] font-bold uppercase tracking-widest mb-4">Proximo Passo</span>
              <h3 className="text-2xl md:text-3xl font-headline font-semibold text-gold-50 mb-5 tracking-tight leading-tight">Aprofunde sua Jornada</h3>
              <p className="text-gold-100/80 mb-8 text-base font-medium leading-relaxed max-w-xl">
                Sua analise comportamental revela insights valiosos. Que tal agendar uma sessao de devolutiva para explorar seus resultados?
              </p>
              <button className="bg-surface text-primary px-10 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-surface-container-highest transition-colors shadow-lg flex items-center gap-2.5">
                Solicitar Sessao <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
`);

console.log('\\n============================================');
console.log('  Paleta Dourada Premium aplicada!');
console.log('============================================');
console.log('\\nIMPORTANTE: Copie as fotos para o frontend:');
console.log('  Copie vanessa-profile.jpg para C:\\disc-system\\frontend\\public\\');
console.log('  Copie vanessa-hero.jpg para C:\\disc-system\\frontend\\public\\');
console.log('\\nDepois: git add . && git commit -m "gold palette + vanessa photos" && git push');
