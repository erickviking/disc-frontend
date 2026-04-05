const fs = require('fs');
const path = require('path');

function w(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('OK:', filePath);
}

// 1. Profile labels mapping (usado no backend e frontend)
w('../backend/src/data/disc-profiles.js', `// Mapeamento de perfis DISC para nomenclatura Vanessa Rocha
export const profileLabels = {
  D: { name: 'Executor', description: 'Focado em resultados, decisivo e direto' },
  I: { name: 'Comunicador', description: 'Sociavel, entusiasmado e persuasivo' },
  S: { name: 'Planejador', description: 'Estavel, paciente e colaborativo' },
  C: { name: 'Analista', description: 'Preciso, analitico e criterioso' },
};

export const profileColors = {
  D: '#E63946',
  I: '#F4A261',
  S: '#2A9D8F',
  C: '#264653',
};
`);

// 2. Update scoring to include profile labels
w('../backend/src/services/disc-scoring.js', `import { discQuestions } from '../data/disc-questions.js';
import { profileLabels } from '../data/disc-profiles.js';

export function calculateDiscScores(responses) {
  if (!responses || responses.length !== 28) {
    throw new Error('Sao necessarias exatamente 28 respostas');
  }

  const rawScores = { D: 0, I: 0, S: 0, C: 0 };

  for (const response of responses) {
    const question = discQuestions[response.groupIndex];
    if (!question) throw new Error('Grupo invalido: ' + response.groupIndex);

    const mostWord = question.words.find(w => w.id === response.most);
    const leastWord = question.words.find(w => w.id === response.least);

    if (!mostWord || !leastWord) throw new Error('Palavra invalida no grupo ' + response.groupIndex);
    if (mostWord.id === leastWord.id) throw new Error('MAIS e MENOS nao podem ser a mesma palavra no grupo ' + response.groupIndex);

    rawScores[mostWord.factor] += 2;
    rawScores[leastWord.factor] -= 1;
  }

  const minPossible = -28;
  const maxPossible = 56;
  const range = maxPossible - minPossible;

  const scores = {};
  for (const factor of ['D', 'I', 'S', 'C']) {
    scores[factor] = Math.round(((rawScores[factor] - minPossible) / range) * 100);
    scores[factor] = Math.max(0, Math.min(100, scores[factor]));
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const profilePrimary = sorted[0][0];
  const profileSecondary = sorted[1][0];

  return {
    scores,
    rawScores,
    profilePrimary,
    profileSecondary,
    profilePrimaryLabel: profileLabels[profilePrimary].name,
    profileSecondaryLabel: profileLabels[profileSecondary].name,
  };
}

export function validateResponses(responses) {
  if (!Array.isArray(responses)) return 'Respostas devem ser um array';
  if (responses.length !== 28) return 'Sao necessarias exatamente 28 respostas';
  const seenGroups = new Set();
  for (let i = 0; i < responses.length; i++) {
    const r = responses[i];
    if (typeof r.groupIndex !== 'number' || r.groupIndex < 0 || r.groupIndex > 27) return 'groupIndex invalido na resposta ' + i;
    if (seenGroups.has(r.groupIndex)) return 'Grupo duplicado: ' + r.groupIndex;
    seenGroups.add(r.groupIndex);
    if (!r.most || !r.least) return 'most e least sao obrigatorios na resposta ' + i;
    if (r.most === r.least) return 'most e least nao podem ser iguais na resposta ' + i;
  }
  return null;
}
`);

// 3. Update frontend - Login page branding
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
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-brand-950">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 h-64 w-64 rounded-full bg-disc-d blur-[100px]" />
          <div className="absolute top-1/2 right-20 h-48 w-48 rounded-full bg-disc-i blur-[80px]" />
          <div className="absolute bottom-20 left-1/3 h-56 w-56 rounded-full bg-disc-s blur-[90px]" />
          <div className="absolute top-1/3 left-1/2 h-40 w-40 rounded-full bg-disc-c blur-[70px]" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="mb-8">
            <p className="font-display text-3xl text-white">Vanessa Rocha</p>
            <p className="text-sm font-medium text-white/50 mt-1">Analise Comportamental DISC</p>
          </div>
          <h1 className="font-display text-4xl leading-tight text-white/90">Descubra seu perfil<br /><span className="italic text-white">comportamental</span></h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/50">Uma ferramenta profissional de analise comportamental com inteligencia artificial para interpretacao personalizada do seu perfil.</p>
          <div className="mt-12 space-y-3 max-w-xs">
            {[{l:'Executor',c:'bg-disc-d',w:'w-[85%]'},{l:'Comunicador',c:'bg-disc-i',w:'w-[65%]'},{l:'Planejador',c:'bg-disc-s',w:'w-[70%]'},{l:'Analista',c:'bg-disc-c',w:'w-[55%]'}].map(b=>(
              <div key={b.l}><div className="flex justify-between text-xs text-white/40 mb-1"><span>{b.l}</span></div><div className="h-1.5 rounded-full bg-white/10"><div className={"h-full rounded-full "+b.c+" "+b.w} /></div></div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 font-display text-xl text-white">VR</div>
            <div><p className="font-display text-xl text-brand-950">Vanessa Rocha</p><p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Analise DISC</p></div>
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

// 4. Update AppLayout branding
w('../frontend/src/components/AppLayout.jsx', `import { useState } from 'react';
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-display text-sm text-white">VR</div>
          <div>
            <p className="font-display text-base leading-none text-brand-950">Vanessa Rocha</p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Analise DISC</p>
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
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 font-display text-[10px] text-white">VR</div>
            <span className="font-display text-sm text-brand-950">Vanessa Rocha</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
`);

// 5. Update index.html title
w('../frontend/index.html', `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vanessa Rocha - Analise Comportamental DISC</title>
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

// 6. Update UserAssessmentsPage with profile labels
w('../frontend/src/pages/UserAssessmentsPage.jsx', `import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ClipboardList, Clock, CheckCircle2, Eye, Plus } from 'lucide-react';

const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };
const statusLabels = {
  IN_PROGRESS: { text: 'Em andamento', color: 'bg-amber-50 text-amber-700' },
  COMPLETED: { text: 'Aguardando liberacao', color: 'bg-blue-50 text-blue-700' },
  REVIEWED: { text: 'Em revisao', color: 'bg-purple-50 text-purple-700' },
  RELEASED: { text: 'Liberado', color: 'bg-green-50 text-green-700' },
  REPORT_GENERATED: { text: 'Relatorio pronto', color: 'bg-brand-50 text-brand-700' },
};

export default function UserAssessmentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justCompleted = searchParams.get('completed') === 'true';
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const d = await api.get('/assessments/mine'); setAssessments(d.assessments); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const startNew = () => navigate('/quiz');
  const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' });

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div><h1 className="font-display text-2xl text-gray-900">Meus Testes</h1><p className="mt-1 text-sm text-gray-500">Acompanhe seus assessments comportamentais</p></div>
        <button onClick={startNew} className="btn-primary gap-2"><Plus size={16}/>Novo Teste</button>
      </div>

      {justCompleted && (
        <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 border border-green-100 flex items-center gap-2">
          <CheckCircle2 size={16}/> Teste concluido com sucesso! Aguarde a liberacao para ver seu relatorio completo.
        </div>
      )}

      {loading ? (
        <div className="card flex items-center justify-center py-12 text-gray-400"><div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent mr-2"/>Carregando...</div>
      ) : assessments.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="mb-4 rounded-xl bg-brand-50 p-4 text-brand-600"><ClipboardList size={32}/></div>
          <h3 className="font-display text-lg text-gray-900">Nenhum teste realizado</h3>
          <p className="mt-2 max-w-xs text-sm text-gray-500">Clique em "Novo Teste" para iniciar seu questionario.</p>
          <button onClick={startNew} className="btn-primary mt-6 gap-2"><Plus size={16}/>Iniciar Teste</button>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map(a => {
            const st = statusLabels[a.status] || statusLabels.IN_PROGRESS;
            const scores = a.scoresRaw?.normalized;
            return (
              <div key={a.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium " + st.color}>{st.text}</span>
                    <span className="text-xs text-gray-400">{fmtDate(a.createdAt)}</span>
                  </div>
                  {scores && (
                    <div className="flex gap-3 mt-2">
                      {['D','I','S','C'].map(f => (
                        <div key={f} className="text-center">
                          <div className={"text-xs font-bold " + (f==='D'?'text-disc-d':f==='I'?'text-disc-i':f==='S'?'text-disc-s':'text-disc-c')}>{profileNames[f]}</div>
                          <div className="text-sm font-semibold text-gray-900">{scores[f]}%</div>
                        </div>
                      ))}
                      {a.profilePrimary && <div className="ml-2 text-xs text-gray-500 self-center">Perfil: <span className="font-semibold">{profileNames[a.profilePrimary]}/{profileNames[a.profileSecondary]}</span></div>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {a.status === 'IN_PROGRESS' && <button onClick={startNew} className="btn-secondary !py-1.5 !px-3 !text-xs gap-1"><Clock size={12}/>Continuar</button>}
                  {a.report && <button className="btn-primary !py-1.5 !px-3 !text-xs gap-1"><Eye size={12}/>Ver Relatorio</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
`);

// 7. Update AdminAssessmentsPage with profile labels
w('../frontend/src/pages/AdminAssessmentsPage.jsx', `import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { ClipboardList, Eye, Unlock, ChevronDown, ChevronUp } from 'lucide-react';

const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };
const statusLabels = {
  IN_PROGRESS: { text: 'Em andamento', color: 'bg-amber-50 text-amber-700' },
  COMPLETED: { text: 'Completado', color: 'bg-blue-50 text-blue-700' },
  REVIEWED: { text: 'Revisado', color: 'bg-purple-50 text-purple-700' },
  RELEASED: { text: 'Liberado', color: 'bg-green-50 text-green-700' },
  REPORT_GENERATED: { text: 'Relatorio gerado', color: 'bg-brand-50 text-brand-700' },
};

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [releasing, setReleasing] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  const load = async () => {
    try { const d = await api.get('/admin/assessments'); setAssessments(d.assessments); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const release = async (id) => {
    setReleasing(id);
    try {
      await api.patch('/admin/assessments/' + id + '/release', { adminNotes: adminNotes || undefined });
      setAdminNotes(''); setExpanded(null); await load();
    } catch (e) { alert(e.message); }
    finally { setReleasing(null); }
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-2xl text-gray-900">Assessments</h1><p className="mt-1 text-sm text-gray-500">Gerencie os testes comportamentais de todos os usuarios</p></div>

      {loading ? (
        <div className="card flex items-center justify-center py-12 text-gray-400"><div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent mr-2"/>Carregando...</div>
      ) : assessments.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="mb-4 rounded-xl bg-gray-100 p-4 text-gray-400"><ClipboardList size={32}/></div>
          <h3 className="font-display text-lg text-gray-500">Nenhum assessment</h3>
          <p className="mt-2 max-w-xs text-sm text-gray-400">Quando usuarios completarem testes, eles apareceram aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map(a => {
            const st = statusLabels[a.status] || statusLabels.IN_PROGRESS;
            const scores = a.scoresRaw?.normalized;
            const isExpanded = expanded === a.id;
            const canRelease = a.status === 'COMPLETED' || a.status === 'REVIEWED';

            return (
              <div key={a.id} className="card !p-0 overflow-hidden">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 cursor-pointer hover:bg-gray-50/50" onClick={() => setExpanded(isExpanded ? null : a.id)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-gray-900">{a.user?.name}</span>
                      <span className={"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium " + st.color}>{st.text}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 text-xs text-gray-400">
                      <span>{a.user?.email}</span>
                      <span>Criado: {fmtDate(a.createdAt)}</span>
                      {a.completedAt && <span>Completado: {fmtDate(a.completedAt)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {scores && (
                      <div className="flex gap-2">
                        {['D','I','S','C'].map(f => (
                          <div key={f} className="text-center">
                            <div className={"text-[10px] font-bold " + (f==='D'?'text-disc-d':f==='I'?'text-disc-i':f==='S'?'text-disc-s':'text-disc-c')}>{profileNames[f][0]}</div>
                            <div className="text-xs font-semibold text-gray-700">{scores[f]}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50/30">
                    {scores && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Perfil Comportamental</h4>
                        <div className="grid grid-cols-4 gap-3">
                          {['D','I','S','C'].map(f => {
                            const colors = { D:'bg-disc-d', I:'bg-disc-i', S:'bg-disc-s', C:'bg-disc-c' };
                            return (
                              <div key={f}>
                                <div className="flex justify-between text-xs mb-1"><span className="text-gray-600">{profileNames[f]}</span><span className="font-semibold">{scores[f]}%</span></div>
                                <div className="h-2 rounded-full bg-gray-200"><div className={"h-full rounded-full " + colors[f]} style={{width: scores[f] + '%'}}/></div>
                              </div>
                            );
                          })}
                        </div>
                        {a.profilePrimary && <p className="mt-3 text-sm text-gray-600">Perfil: <span className="font-semibold">{profileNames[a.profilePrimary]} / {profileNames[a.profileSecondary]}</span></p>}
                      </div>
                    )}

                    {canRelease && (
                      <div className="border-t border-gray-100 pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Liberar Assessment</h4>
                        <textarea className="input-field mb-3" rows={2} placeholder="Nota para a IA (opcional) - ex: foco em lideranca, contexto de transicao de carreira..."
                          value={adminNotes} onChange={e => setAdminNotes(e.target.value)}/>
                        <button onClick={() => release(a.id)} disabled={releasing === a.id} className="btn-primary gap-2">
                          {releasing === a.id ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"/> : <Unlock size={14}/>}
                          Liberar
                        </button>
                      </div>
                    )}

                    {a.releasedAt && <p className="text-xs text-green-600 mt-2">Liberado em {fmtDate(a.releasedAt)}</p>}
                    {a.adminNotes && <p className="text-xs text-gray-500 mt-1">Nota: {a.adminNotes}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
`);

// 8. Update RegisterPage branding
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 font-display text-sm text-white">VR</div>
          <div><p className="font-display text-xl text-brand-950">Vanessa Rocha</p><p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Analise DISC</p></div>
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

console.log('\\n============================================');
console.log('  Branding Vanessa Rocha + Perfis aplicados!');
console.log('============================================');
console.log('\\nPerfis: D=Executor, I=Comunicador, S=Planejador, C=Analista');
console.log('Reinicie o backend (Ctrl+C e npm run dev)');
