const fs = require('fs');
const path = require('path');
function w(f, c) {
  const d = path.dirname(f);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(f, c, 'utf8');
  console.log('OK:', f);
}

// ============================================
// 1. INDEX.HTML - New fonts
// ============================================

w('../frontend/index.html', `<!DOCTYPE html>
<html lang="pt-BR" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vanessa Rocha - Desenvolvimento Pessoal</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`);

// ============================================
// 2. TAILWIND CONFIG - Dark premium palette
// ============================================

w('../frontend/tailwind.config.js', `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#131313',
          dim: '#131313',
          bright: '#393939',
          container: { DEFAULT: '#20201f', low: '#1c1b1b', high: '#2a2a2a', highest: '#353535', lowest: '#0e0e0e' },
          variant: '#353535',
          tint: '#e7beae',
        },
        primary: { DEFAULT: '#e7beae', container: '#8c6a5d', fixed: '#ffdbce', 'fixed-dim': '#e7beae' },
        secondary: { DEFAULT: '#cec5c0', container: '#4c4642' },
        tertiary: { DEFAULT: '#b8c6eb', container: '#637192' },
        outline: { DEFAULT: '#9c8e88', variant: '#504440' },
        on: {
          surface: '#e5e2e1', 'surface-variant': '#d4c3bd', background: '#e5e2e1',
          primary: '#442a20', 'primary-container': '#fff6f3', 'primary-fixed': '#2c160c',
          secondary: '#352f2d', 'secondary-container': '#bcb3af',
          tertiary: '#22304e', 'tertiary-container': '#f6f6ff',
          error: '#690005',
        },
        error: { DEFAULT: '#ffb4ab', container: '#93000a' },
        disc: { d: '#E63946', i: '#F4A261', s: '#2A9D8F', c: '#264653' },
      },
      fontFamily: {
        headline: ['"Noto Serif"', 'serif'],
        body: ['"Manrope"', 'sans-serif'],
        label: ['"Manrope"', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
`);

// ============================================
// 3. CSS - Dark premium styles
// ============================================

w('../frontend/src/index.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    font-family: 'Manrope', sans-serif;
    background-color: #131313;
    color: #e5e2e1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

@layer components {
  .btn-primary {
    @apply inline-flex items-center justify-center rounded-xl bg-primary text-on-primary px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed;
  }
  .btn-secondary {
    @apply inline-flex items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-on-surface-variant transition-all hover:bg-surface-container-high;
  }
  .btn-ghost {
    @apply inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-primary transition-all hover:bg-surface-container;
  }
  .input-field {
    @apply block w-full rounded-xl border border-outline-variant/20 bg-surface-container px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all;
  }
  .card {
    @apply rounded-3xl border border-outline-variant/10 bg-surface-container p-6;
  }
  .bg-glow {
    background: radial-gradient(circle at top right, rgba(231, 190, 174, 0.04), transparent 50%),
                radial-gradient(circle at bottom left, rgba(99, 113, 146, 0.03), transparent 50%);
  }
}

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  vertical-align: middle;
}
`);

// ============================================
// 4. APP LAYOUT - Dark sidebar
// ============================================

w('../frontend/src/components/AppLayout.jsx', `import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { LayoutDashboard, Users, Wrench, Link2, ClipboardList, LogOut, Menu, X, ChevronRight, MessageCircle, Settings } from 'lucide-react';

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
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={"fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-surface-container-lowest border-r border-outline-variant/10 py-8 px-6 transition-transform lg:static lg:translate-x-0 " + (open ? "translate-x-0" : "-translate-x-full")}>
        {/* Brand */}
        <div className="mb-12">
          <p className="text-3xl font-headline text-primary tracking-tight">Vanessa Rocha</p>
          <p className="text-[10px] uppercase tracking-[0.25em] text-on-surface-variant/60 mt-1.5 font-medium">Desenvolvimento Pessoal</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-2">
          {nav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)}
              className={({ isActive }) => "group flex items-center gap-4 py-3 px-4 rounded-xl text-sm transition-all duration-300 " + (isActive ? "text-primary font-semibold bg-surface-container-high" : "text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-container")}>
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-auto space-y-4">
          <div className="pt-6 border-t border-outline-variant/10 space-y-1">
            <button onClick={handleLogout} className="flex items-center gap-4 w-full py-2.5 px-4 rounded-xl text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut size={18} />
              <span>Sair</span>
            </button>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-container text-xs font-bold text-on-tertiary-container">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-on-surface">{user?.name}</p>
              <p className="truncate text-xs text-on-surface-variant/60">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center justify-between px-6 h-20 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 lg:hidden">
          <button onClick={() => setOpen(true)} className="p-2 rounded-xl hover:bg-surface-container"><Menu size={20} className="text-on-surface-variant" /></button>
          <span className="text-xl font-headline text-primary">Vanessa Rocha</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-container text-xs font-bold text-on-tertiary-container">{initials}</div>
        </header>

        <main className="flex-1 overflow-y-auto bg-glow">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-8 lg:pt-16 pb-24 lg:pb-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
`);

// ============================================
// 5. USER DASHBOARD - Netflix dark premium
// ============================================

w('../frontend/src/pages/UserDashboard.jsx', `import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { ArrowRight, Lock, CheckCircle2, Users, Target, Heart, Compass, Rocket, Shield, BookOpen } from 'lucide-react';

const iconMap = { Users, Target, Heart, Compass, Rocket, Shield, BookOpen };
const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };

// Tool accent colors for gradients
const toolGradients = {
  'disc': 'from-primary/20 to-primary/5',
  'roda-da-vida': 'from-disc-s/20 to-disc-s/5',
  'inteligencia-emocional': 'from-disc-d/20 to-disc-d/5',
  'valores-pessoais': 'from-disc-i/20 to-disc-i/5',
  'metas-smart': 'from-purple-500/20 to-purple-500/5',
  'sabotadores': 'from-disc-c/20 to-disc-c/5',
  'diario': 'from-emerald-500/20 to-emerald-500/5',
};

function HeroCard({ tool, assessment, onAction }) {
  const scores = assessment?.scoresRaw?.normalized;
  const hasReport = !!assessment?.report;

  return (
    <div className="lg:col-span-4 md:col-span-2 group relative rounded-3xl overflow-hidden border border-outline-variant/10 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-surface/40" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent" />
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
              {['D', 'I', 'S', 'C'].map((f, i) => (
                <div key={f} className="space-y-2">
                  <div className="flex justify-between text-xs uppercase tracking-wider font-semibold">
                    <span className={"text-on-surface" + (i >= 2 ? '/70' : '')}>{profileNames[f]}</span>
                    <span className={i < 2 ? 'text-primary font-bold' : 'text-on-surface/60'}>{scores[f]}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-black/50 rounded-full overflow-hidden ring-1 ring-white/10">
                    <div className={"h-full rounded-full " + (i < 2 ? 'bg-primary shadow-[0_0_12px_rgba(231,190,174,0.6)]' : 'bg-secondary-container')}
                      style={{ width: scores[f] + '%' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-xs text-on-surface-variant/60 font-medium italic">
            Perfil: {assessment?.profilePrimary && profileNames[assessment.profilePrimary]} / {assessment?.profileSecondary && profileNames[assessment.profileSecondary]}
          </p>
          <button onClick={() => onAction(hasReport ? 'report' : 'view')}
            className="text-primary text-xs font-bold uppercase tracking-widest hover:text-primary-fixed flex items-center gap-2 transition-colors">
            {hasReport ? 'Ver Relatorio Completo' : 'Aguardando Liberacao'}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AvailableCard({ tool, onStart }) {
  const gradient = toolGradients[tool.slug] || 'from-primary/20 to-primary/5';
  return (
    <div className="lg:col-span-2 group relative rounded-3xl overflow-hidden border border-outline-variant/10 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer flex flex-col"
      onClick={() => onStart(tool)}>
      <div className={"absolute inset-0 bg-gradient-to-t from-surface via-surface/90 to-surface/60"} />
      <div className={"absolute inset-0 bg-gradient-to-br " + gradient} />
      <div className="relative p-8 lg:p-9 flex flex-col flex-1 min-h-[340px]">
        <div className="flex justify-between items-start mb-12">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-tertiary/20 text-tertiary text-xs font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            Disponivel
          </span>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-surface/60 group-hover:translate-x-1 transition-transform">
            <ArrowRight size={16} className="text-primary" />
          </div>
        </div>
        <div className="mt-auto">
          <h3 className="text-2xl font-headline font-semibold text-on-surface mb-3 tracking-tight">{tool.name}</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed font-medium max-w-xs">{tool.description}</p>
          <button className="mt-8 w-full py-3.5 bg-white/5 hover:bg-primary border border-white/10 group-hover:border-primary rounded-xl text-xs font-bold uppercase tracking-widest group-hover:text-on-primary transition-all duration-300">
            Comecar Agora
          </button>
        </div>
      </div>
    </div>
  );
}

function LockedCardLarge({ tool }) {
  const gradient = toolGradients[tool.slug] || 'from-primary/10 to-transparent';
  return (
    <div className="lg:col-span-2 relative rounded-3xl overflow-hidden border border-outline-variant/5 flex flex-col min-h-[300px] group">
      <div className="absolute inset-0 bg-surface-container" />
      <div className={"absolute inset-0 bg-gradient-to-br " + gradient + " opacity-30"} />
      <div className="relative p-8 flex flex-col flex-1 opacity-60 group-hover:opacity-80 transition-opacity">
        <div className="flex justify-between items-start mb-10">
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-secondary-container/50 text-secondary text-xs font-bold uppercase tracking-widest">Brevemente</span>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-surface/40">
            <Lock size={16} className="text-on-surface-variant" />
          </div>
        </div>
        <div className="mt-auto">
          <h3 className="text-2xl font-headline font-medium text-on-surface mb-2 tracking-tight">{tool.name}</h3>
          <p className="text-sm text-on-surface-variant max-w-xs">{tool.description}</p>
        </div>
      </div>
    </div>
  );
}

function LockedCardCompact({ tool, icon: iconName }) {
  return (
    <div className="lg:col-span-3 bg-surface-container-low rounded-3xl p-8 border border-outline-variant/5 opacity-70 hover:opacity-100 transition-opacity flex items-center gap-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container text-outline/50 shrink-0">
        {iconMap[tool.icon] ? (() => { const Icon = iconMap[tool.icon]; return <Icon size={28} />; })() : <Shield size={28} />}
      </div>
      <div>
        <div className="flex items-center gap-3 mb-1.5">
          <h3 className="text-lg font-headline font-medium text-on-surface tracking-tight">{tool.name}</h3>
          <Lock size={12} className="text-on-surface-variant/60" />
        </div>
        <p className="text-sm text-on-surface-variant font-medium">{tool.description}</p>
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
        const [toolsData, assessData] = await Promise.all([
          api.get('/tools'),
          api.get('/assessments/mine'),
        ]);
        setTools(toolsData.tools);
        setAssessments(assessData.assessments);
        try { const allData = await api.get('/tools/all'); setAllTools(allData.tools || []); } catch(e) { setAllTools([]); }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const greeting = () => { const h = new Date().getHours(); return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'; };

  const accessibleSlugs = new Set(tools.map(t => t.slug));
  const lockedTools = allTools.filter(t => !accessibleSlugs.has(t.slug) && t.isActive);

  // Find DISC tool and its assessment
  const discTool = tools.find(t => t.slug === 'disc');
  const discAssessment = assessments.find(a => a.status !== 'IN_PROGRESS' && a.scoresRaw);
  const otherTools = tools.filter(t => t.slug !== 'disc');

  // Split locked tools: first 2-4 get large cards, rest get compact
  const lockedLarge = lockedTools.slice(0, 4);
  const lockedCompact = lockedTools.slice(4);

  const handleToolAction = (tool, action, assessmentId) => {
    if (action === 'report' && discAssessment) navigate('/report/' + discAssessment.id);
    else if (tool?.slug === 'disc') navigate('/quiz');
    else navigate('/quiz');
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"/></div>;

  return (
    <div>
      {/* Hero */}
      <section className="mb-16">
        <span className="text-primary text-xs font-semibold uppercase tracking-widest mb-3 block">Painel de Evolucao Pessoal</span>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold text-on-surface tracking-tighter leading-tight">
          {greeting()}, <span className="italic font-normal text-primary">{(user?.name||'').split(' ')[0]}</span>
        </h1>
        <p className="text-on-surface-variant text-base md:text-lg mt-5 max-w-2xl font-light leading-relaxed">
          Bem-vindo ao seu espaco de crescimento. Explore suas ferramentas de desenvolvimento pessoal.
        </p>
      </section>

      {/* Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-8">

        {/* DISC Hero Card */}
        {discTool && discAssessment && (
          <HeroCard tool={discTool} assessment={discAssessment} onAction={(action) => handleToolAction(discTool, action)} />
        )}

        {/* DISC not completed */}
        {discTool && !discAssessment && (
          <div className="lg:col-span-4 md:col-span-2">
            <AvailableCard tool={discTool} onStart={() => navigate('/quiz')} />
          </div>
        )}

        {/* Available tools */}
        {otherTools.map(tool => (
          <AvailableCard key={tool.id} tool={tool} onStart={() => navigate('/quiz')} />
        ))}

        {/* Locked large cards */}
        {lockedLarge.map(tool => (
          <LockedCardLarge key={tool.id} tool={tool} />
        ))}

        {/* Locked compact cards */}
        {lockedCompact.map(tool => (
          <LockedCardCompact key={tool.id} tool={tool} />
        ))}

        {/* CTA Card */}
        {discAssessment && (
          <div className="lg:col-span-6 md:col-span-2 relative bg-primary-container rounded-3xl p-10 lg:p-12 overflow-hidden flex items-center border border-primary/10 mt-4">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="relative z-10 max-w-2xl">
              <span className="inline-block px-3 py-1 rounded-full bg-surface/30 text-on-primary-container text-[10px] font-bold uppercase tracking-widest mb-4">Proximo Passo</span>
              <h3 className="text-2xl md:text-3xl font-headline font-semibold text-on-primary-container mb-5 tracking-tight leading-tight">Aprofunde sua Jornada</h3>
              <p className="text-on-primary-container/90 mb-8 text-base font-medium leading-relaxed max-w-xl">
                Sua analise comportamental revela insights valiosos sobre seu perfil. Que tal agendar uma sessao de devolutiva para explorar seus resultados?
              </p>
              <button className="bg-surface text-primary px-10 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-surface-container-highest transition-colors shadow-lg flex items-center gap-2.5">
                Solicitar Sessao
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
`);

// ============================================
// 6. LOGIN PAGE - Dark premium
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
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-tertiary/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <p className="text-4xl font-headline text-primary tracking-tight mb-2">Vanessa Rocha</p>
          <p className="text-sm uppercase tracking-[0.25em] text-on-surface-variant/60 font-medium mb-12">Desenvolvimento Pessoal</p>

          <h1 className="text-4xl font-headline font-bold text-on-surface tracking-tighter leading-tight mb-4">
            Descubra seu perfil<br /><span className="italic font-normal text-primary">comportamental</span>
          </h1>
          <p className="text-on-surface-variant text-sm leading-relaxed max-w-md">
            Uma plataforma premium de analise comportamental e desenvolvimento pessoal com inteligencia artificial.
          </p>

          <div className="mt-12 space-y-4 max-w-xs">
            {[{l:'Executor',w:'85%'},{l:'Comunicador',w:'65%'},{l:'Planejador',w:'70%'},{l:'Analista',w:'55%'}].map(b => (
              <div key={b.l} className="space-y-1.5">
                <span className="text-xs uppercase tracking-wider text-on-surface-variant/60 font-semibold">{b.l}</span>
                <div className="h-1.5 rounded-full bg-surface-container">
                  <div className="h-full rounded-full bg-primary/60" style={{width: b.w}} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <p className="text-2xl font-headline text-primary tracking-tight">Vanessa Rocha</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/60 mt-1">Desenvolvimento Pessoal</p>
          </div>

          <h2 className="text-3xl font-headline font-bold text-on-surface tracking-tight">Entrar</h2>
          <p className="mt-2 text-sm text-on-surface-variant/70">Acesse sua conta para continuar</p>

          {error && <div className="mt-4 rounded-xl bg-error-container/30 border border-error/20 px-4 py-3 text-sm text-error">{error}</div>}

          <div className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant/70">Email</label>
              <input type="email" className="input-field" placeholder="seu@email.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} onKeyDown={onKey} />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant/70">Senha</label>
              <div className="relative">
                <input type={showPw?'text':'password'} className="input-field pr-12" placeholder="********" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} onKeyDown={onKey} />
                <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant">{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button>
              </div>
            </div>
            <button onClick={submit} disabled={loading||!form.email||!form.password} className="btn-primary w-full gap-2 py-3.5">
              {loading?<div className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent"/>:<>Entrar <ArrowRight size={14}/></>}
            </button>
          </div>
          <p className="mt-8 text-center text-sm text-on-surface-variant/60">Nao tem uma conta? <Link to="/register" className="font-semibold text-primary hover:text-primary-fixed">Cadastre-se</Link></p>
        </div>
      </div>
    </div>
  );
}
`);

// ============================================
// 7. REGISTER PAGE - Dark premium
// ============================================

w('../frontend/src/pages/RegisterPage.jsx', `import { useState, useEffect } from 'react';
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
    <div className="flex min-h-screen items-center justify-center bg-surface px-6 py-12 bg-glow">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-2xl font-headline text-primary tracking-tight">Vanessa Rocha</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/60 mt-1">Desenvolvimento Pessoal</p>
        </div>
        <div className="card">
          <h2 className="text-2xl font-headline font-bold text-on-surface tracking-tight">Criar conta</h2>
          <p className="mt-2 text-sm text-on-surface-variant/70">Preencha seus dados para se cadastrar</p>
          {error && <div className="mt-4 rounded-xl bg-error-container/30 border border-error/20 px-4 py-3 text-sm text-error">{error}</div>}
          <div className="mt-6 space-y-4">
            <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant/70">Nome completo</label><input className="input-field" placeholder="Seu nome" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant/70">Email</label><input type="email" className="input-field" placeholder="seu@email.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
            <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant/70">Telefone <span className="opacity-50">(opcional)</span></label><input type="tel" className="input-field" placeholder="(11) 99999-9999" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
            <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant/70">Senha</label>
              <div className="relative"><input type={showPw?'text':'password'} className="input-field pr-12" placeholder="Minimo 6 caracteres" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
              <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant">{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button></div>
            </div>
            <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant/70">Codigo de convite <span className="opacity-50">(opcional)</span></label>
              <div className="relative"><input className={"input-field pr-12 "+(invSt==='valid'?'border-emerald-500/50':invSt==='invalid'?'border-error/50':'')} placeholder="Cole seu codigo" value={form.inviteCode} onChange={e=>setForm({...form,inviteCode:e.target.value})} />
              {invSt==='valid'&&<CheckCircle2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500"/>}
              {invSt==='invalid'&&<XCircle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-error"/>}</div>
              {invMsg&&<p className={"mt-1.5 text-xs "+(invSt==='valid'?'text-emerald-500':'text-error')}>{invMsg}</p>}
            </div>
            <button onClick={submit} disabled={loading||!form.name||!form.email||!form.password} className="btn-primary w-full gap-2 py-3.5">
              {loading?<div className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent"/>:<>Criar conta <ArrowRight size={14}/></>}
            </button>
          </div>
        </div>
        <p className="mt-8 text-center text-sm text-on-surface-variant/60">Ja tem uma conta? <Link to="/login" className="font-semibold text-primary hover:text-primary-fixed">Entrar</Link></p>
      </div>
    </div>
  );
}
`);

console.log('\\n============================================');
console.log('  Redesign Dark Premium aplicado!');
console.log('============================================');
console.log('\\nArquivos atualizados:');
console.log('  - index.html (fontes)');
console.log('  - tailwind.config.js (paleta dark)');
console.log('  - index.css (estilos dark)');
console.log('  - AppLayout.jsx (sidebar dark)');
console.log('  - UserDashboard.jsx (bento grid Netflix)');
console.log('  - LoginPage.jsx (dark premium)');
console.log('  - RegisterPage.jsx (dark premium)');
console.log('\\nReinicie o frontend e teste!');
