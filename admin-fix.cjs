const fs = require('fs');
const path = require('path');
function w(f, c) {
  const d = path.dirname(f);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(f, c, 'utf8');
  console.log('OK:', f);
}

// ============================================
// 1. BACKEND - Endpoint /tools/all returns ALL tools (even inactive)
// ============================================

// Update tools route to show all tools for locked display
w('../backend/src/routes/tools.js', `import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const prisma = new PrismaClient();

const userToolRouter = Router();
userToolRouter.use(authenticate);

userToolRouter.get('/', async (req, res) => {
  try {
    if (req.user.role === 'ADMIN') {
      const tools = await prisma.tool.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
      return res.json({ tools });
    }
    const access = await prisma.userToolAccess.findMany({ where: { userId: req.user.id }, include: { tool: true } });
    const tools = access.map(a => a.tool).filter(t => t.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
    return res.json({ tools });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

// Returns ALL tools regardless of active status (for showing locked cards)
userToolRouter.get('/all', async (req, res) => {
  try {
    const tools = await prisma.tool.findMany({
      select: { id: true, slug: true, name: true, description: true, icon: true, color: true, category: true, sortOrder: true, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return res.json({ tools });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

const adminToolRouter = Router();
adminToolRouter.use(authenticate, requireAdmin);

adminToolRouter.get('/', async (req, res) => {
  try {
    const tools = await prisma.tool.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { assessments: true, userAccess: true } } },
    });
    return res.json({
      tools: tools.map(t => ({ ...t, assessmentCount: t._count.assessments, userCount: t._count.userAccess, _count: undefined })),
    });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

adminToolRouter.patch('/:id', async (req, res) => {
  try {
    const schema = z.object({ isActive: z.boolean().optional(), isDefault: z.boolean().optional(), name: z.string().optional(), description: z.string().optional(), sortOrder: z.number().optional() });
    const data = schema.parse(req.body);
    const tool = await prisma.tool.update({ where: { id: req.params.id }, data });
    return res.json({ tool });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    console.error(err); return res.status(500).json({ error: 'Erro interno' });
  }
});

adminToolRouter.post('/:toolId/grant/:userId', async (req, res) => {
  try {
    const access = await prisma.userToolAccess.upsert({
      where: { userId_toolId: { userId: req.params.userId, toolId: req.params.toolId } },
      update: {}, create: { userId: req.params.userId, toolId: req.params.toolId, grantedBy: req.user.id },
    });
    return res.json({ access, message: 'Acesso concedido' });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

adminToolRouter.delete('/:toolId/revoke/:userId', async (req, res) => {
  try {
    await prisma.userToolAccess.delete({ where: { userId_toolId: { userId: req.params.userId, toolId: req.params.toolId } } });
    return res.json({ message: 'Acesso revogado' });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

adminToolRouter.get('/:toolId/users', async (req, res) => {
  try {
    const access = await prisma.userToolAccess.findMany({
      where: { toolId: req.params.toolId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { grantedAt: 'desc' },
    });
    return res.json({ users: access.map(a => ({ ...a.user, grantedAt: a.grantedAt })) });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

adminToolRouter.post('/:toolId/grant-all', async (req, res) => {
  try {
    const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
    let count = 0;
    for (const user of users) {
      try {
        await prisma.userToolAccess.upsert({
          where: { userId_toolId: { userId: user.id, toolId: req.params.toolId } },
          update: {}, create: { userId: user.id, toolId: req.params.toolId, grantedBy: req.user.id },
        });
        count++;
      } catch (e) {}
    }
    return res.json({ message: 'Acesso concedido a ' + count + ' usuarios' });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

export { userToolRouter, adminToolRouter };
`);

// ============================================
// 2. ADMIN DASHBOARD - Netflix cards with photos + metrics
// ============================================

w('../frontend/src/pages/AdminDashboard.jsx', `import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { Users, ClipboardList, Link2, FileText, ArrowRight, Wrench } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [usersData, assessmentsData, invitesData] = await Promise.all([
          api.get('/admin/users?limit=1'),
          api.get('/admin/assessments?limit=100'),
          api.get('/admin/invites').catch(() => ({ invites: [] })),
        ]);
        const activeInvites = invitesData.invites.filter(i => i.isActive && !i.isExpired && !i.isExhausted).length;
        const reportsCount = assessmentsData.assessments.filter(a => a.report).length;
        const pendingCount = assessmentsData.assessments.filter(a => a.status === 'COMPLETED').length;
        setStats({ totalUsers: usersData.pagination.total, totalAssessments: assessmentsData.pagination.total, activeInvites, totalReports: reportsCount, pendingRelease: pendingCount });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };

  const cards = [
    { label: 'Usuarios', value: stats?.totalUsers || 0, icon: Users, img: '/card-roda.jpg', route: '/admin/users', desc: 'Gerenciar usuarios e acessos' },
    { label: 'Assessments', value: stats?.totalAssessments || 0, icon: ClipboardList, img: '/card-disc.jpg', route: '/admin/assessments', desc: 'Testes comportamentais realizados' },
    { label: 'Relatorios', value: stats?.totalReports || 0, icon: FileText, img: '/card-ie.jpg', route: '/admin/assessments', desc: 'Relatorios gerados por IA' },
    { label: 'Ferramentas', value: '7', icon: Wrench, img: '/card-valores.jpg', route: '/admin/tools', desc: 'Gerenciar ferramentas e acesso' },
  ];

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"/></div>;

  return (
    <div>
      {/* Hero */}
      <section className="mb-14">
        <span className="text-primary text-xs font-semibold uppercase tracking-widest mb-3 block">Painel Administrativo</span>
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-on-surface tracking-tighter leading-tight">
          {greeting()}, <span className="italic font-normal text-primary">{(user?.name||'').split(' ')[0]}</span>
        </h1>
        <p className="text-on-surface-variant/60 text-base mt-4 max-w-xl font-light leading-relaxed">
          Visao geral da plataforma de desenvolvimento pessoal.
        </p>
      </section>

      {/* Metric Cards with photos */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {cards.map(c => (
          <div key={c.label} onClick={() => navigate(c.route)}
            className="group relative rounded-3xl overflow-hidden border border-outline-variant/10 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer min-h-[220px]">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: 'url(' + c.img + ')' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,15,15,0.95) 0%, rgba(15,15,15,0.7) 50%, rgba(15,15,15,0.4) 100%)' }} />

            <div className="relative p-6 flex flex-col justify-between h-full z-10">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/15 backdrop-blur-sm">
                  <c.icon size={18} className="text-primary" />
                </div>
                <ArrowRight size={16} className="text-white/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-auto">
                <p className="text-4xl font-bold text-white mb-1 drop-shadow-md">{c.value}</p>
                <p className="text-sm font-semibold text-white/90 drop-shadow-sm">{c.label}</p>
                <p className="text-xs text-white/50 mt-1">{c.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Quick Actions */}
      {stats?.pendingRelease > 0 && (
        <div className="relative rounded-3xl overflow-hidden border border-primary/15 min-h-[120px]" style={{background:'linear-gradient(135deg, rgba(122,98,48,0.4) 0%, rgba(15,15,15,0.9) 100%)'}}>
          <div className="p-8 flex items-center justify-between">
            <div>
              <p className="text-primary text-xs font-bold uppercase tracking-widest mb-2">Atencao</p>
              <p className="text-lg font-headline text-on-surface">{stats.pendingRelease} assessment{stats.pendingRelease > 1 ? 's' : ''} aguardando liberacao</p>
              <p className="text-sm text-on-surface-variant/60 mt-1">Revise e libere para gerar os relatorios.</p>
            </div>
            <button onClick={() => navigate('/admin/assessments')} className="btn-primary gap-2">
              Revisar <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
`);

// ============================================
// 3. ADMIN USERS PAGE - Fix contrast
// ============================================

w('../frontend/src/pages/AdminUsersPage.jsx', `import { useState, useEffect, useCallback } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-3xl bg-surface-container border border-outline-variant/20 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5"><h3 className="text-xl font-headline text-on-surface">Novo Usuario</h3><button onClick={onClose} className="p-1.5 rounded-lg text-on-surface-variant/50 hover:bg-surface-container-high"><X size={18}/></button></div>
        {error && <div className="mb-4 rounded-xl bg-error-container/20 border border-error/20 px-4 py-3 text-sm text-error">{error}</div>}
        <div className="space-y-4">
          <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant/60">Nome</label><input className="input-field" placeholder="Nome completo" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant/60">Email</label><input type="email" className="input-field" placeholder="email@exemplo.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
          <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant/60">Telefone</label><input className="input-field" placeholder="(11) 99999-9999" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
          <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant/60">Senha</label><input type="password" className="input-field" placeholder="Minimo 6 caracteres" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div>
          <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant/60">Papel</label>
            <div className="flex gap-3">{['USER','ADMIN'].map(r=>(<button key={r} onClick={()=>setForm({...form,role:r})} className={"flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all "+(form.role===r?'border-primary/50 bg-primary/10 text-primary':'border-outline-variant/20 text-on-surface-variant/60 hover:bg-surface-container-high')}>{r==='ADMIN'?<Shield size={14}/>:<UserIcon size={14}/>}{r==='ADMIN'?'Admin':'Usuario'}</button>))}</div>
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight">Usuarios</h1>
          <p className="mt-1 text-sm text-on-surface-variant/60">{pag.total} usuario{pag.total!==1?'s':''} cadastrado{pag.total!==1?'s':''}</p>
        </div>
        <button onClick={()=>setShowCreate(true)} className="btn-primary gap-2"><Plus size={16}/>Novo Usuario</button>
      </div>
      <div className="relative mb-6 max-w-sm"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40"/><input type="text" className="input-field pl-11" placeholder="Buscar por nome ou email..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-outline-variant/10"><th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant/50">Nome</th><th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant/50">Email</th><th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant/50">Papel</th><th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant/50">Status</th><th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant/50">Testes</th><th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-on-surface-variant/50">Acoes</th></tr></thead>
            <tbody className="divide-y divide-outline-variant/5">
              {loading ? <tr><td colSpan={6} className="px-5 py-12 text-center text-on-surface-variant/40"><div className="flex items-center justify-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"/>Carregando...</div></td></tr>
              : users.length===0 ? <tr><td colSpan={6} className="px-5 py-12 text-center text-on-surface-variant/40">Nenhum usuario encontrado</td></tr>
              : users.map(u=>(
                <tr key={u.id} className="hover:bg-surface-container-high/50 transition-colors">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{(u.name||'?')[0].toUpperCase()}</div><span className="font-medium text-on-surface">{u.name}</span></div></td>
                  <td className="px-5 py-4 text-on-surface-variant/70">{u.email}</td>
                  <td className="px-5 py-4"><span className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider "+(u.role==='ADMIN'?'bg-primary/15 text-primary':'bg-surface-container-high text-on-surface-variant/60')}>{u.role==='ADMIN'?<Shield size={10}/>:<UserIcon size={10}/>}{u.role==='ADMIN'?'Admin':'Usuario'}</span></td>
                  <td className="px-5 py-4"><span className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider "+(u.isActive?'bg-emerald-500/15 text-emerald-400':'bg-red-500/15 text-red-400')}>{u.isActive?<Check size={10}/>:<Ban size={10}/>}{u.isActive?'Ativo':'Inativo'}</span></td>
                  <td className="px-5 py-4 text-on-surface-variant/70">{u.assessmentCount}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="relative inline-block">
                      <button onClick={()=>setMenu(menu===u.id?null:u.id)} className="p-1.5 rounded-lg text-on-surface-variant/40 hover:bg-surface-container-high hover:text-on-surface-variant"><MoreVertical size={16}/></button>
                      {menu===u.id&&(<><div className="fixed inset-0 z-10" onClick={()=>setMenu(null)}/><div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-outline-variant/20 bg-surface-container-high py-1 shadow-xl"><button onClick={()=>toggleRole(u.id,u.role)} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-highest"><Shield size={14}/>{u.role==='ADMIN'?'Remover Admin':'Tornar Admin'}</button><button onClick={()=>toggleActive(u.id,u.isActive)} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10"><Ban size={14}/>{u.isActive?'Desativar':'Reativar'}</button></div></>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pag.pages>1&&<div className="flex items-center justify-between border-t border-outline-variant/10 px-5 py-3"><p className="text-sm text-on-surface-variant/50">Pagina {pag.page} de {pag.pages}</p><div className="flex gap-2"><button onClick={()=>load(pag.page-1)} disabled={pag.page<=1} className="btn-secondary !py-1.5 !px-3 !text-xs disabled:opacity-30">Anterior</button><button onClick={()=>load(pag.page+1)} disabled={pag.page>=pag.pages} className="btn-secondary !py-1.5 !px-3 !text-xs disabled:opacity-30">Proxima</button></div></div>}
      </div>
      {showCreate&&<CreateUserModal onClose={()=>setShowCreate(false)} onCreated={()=>load(1)}/>}
    </div>
  );
}
`);

// ============================================
// 4. ADMIN TOOLS PAGE - Fix contrast
// ============================================

w('../frontend/src/pages/AdminToolsPage.jsx', `import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { Users, Target, Heart, Compass, Rocket, Shield, BookOpen, ToggleLeft, ToggleRight, UserPlus, UserMinus, ChevronDown, ChevronUp } from 'lucide-react';

const iconMap = { Users, Target, Heart, Compass, Rocket, Shield, BookOpen };

export default function AdminToolsPage() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [toolUsers, setToolUsers] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [toggling, setToggling] = useState(null);

  const load = async () => {
    try {
      const [td, ud] = await Promise.all([api.get('/admin/tools'), api.get('/admin/users?limit=100')]);
      setTools(td.tools); setAllUsers(ud.users);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const loadToolUsers = async (toolId) => { try { const d = await api.get('/admin/tools/'+toolId+'/users'); setToolUsers(prev=>({...prev,[toolId]:d.users})); } catch(e){console.error(e);} };
  const toggleTool = async (tool) => { setToggling(tool.id); try { await api.patch('/admin/tools/'+tool.id, {isActive:!tool.isActive}); await load(); } catch(e){alert(e.message);} finally{setToggling(null);} };
  const toggleDefault = async (tool) => { try { await api.patch('/admin/tools/'+tool.id, {isDefault:!tool.isDefault}); await load(); } catch(e){alert(e.message);} };
  const grantAccess = async (toolId, userId) => { try { await api.post('/admin/tools/'+toolId+'/grant/'+userId, {}); await loadToolUsers(toolId); await load(); } catch(e){alert(e.message);} };
  const revokeAccess = async (toolId, userId) => { try { await api.delete('/admin/tools/'+toolId+'/revoke/'+userId); await loadToolUsers(toolId); await load(); } catch(e){alert(e.message);} };
  const grantAll = async (toolId) => { try { const r = await api.post('/admin/tools/'+toolId+'/grant-all', {}); alert(r.message); await loadToolUsers(toolId); await load(); } catch(e){alert(e.message);} };
  const handleExpand = async (toolId) => { if (expanded===toolId) { setExpanded(null); return; } setExpanded(toolId); if (!toolUsers[toolId]) await loadToolUsers(toolId); };

  if (loading) return <div className="flex items-center justify-center py-12 text-on-surface-variant/40"><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"/>Carregando...</div>;

  return (
    <div>
      <div className="mb-8"><h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight">Ferramentas</h1><p className="mt-1 text-sm text-on-surface-variant/60">Gerencie as ferramentas e o acesso dos usuarios</p></div>
      <div className="space-y-3">
        {tools.map(tool => {
          const Icon = iconMap[tool.icon] || Users;
          const isExpanded = expanded === tool.id;
          const users = toolUsers[tool.id] || [];
          const userIds = new Set(users.map(u => u.id));
          const usersWithout = allUsers.filter(u => !userIds.has(u.id) && u.role !== 'ADMIN');
          return (
            <div key={tool.id} className="card !p-0 overflow-hidden">
              <div className="flex items-center gap-4 p-5 cursor-pointer hover:bg-surface-container-high/50 transition-colors" onClick={() => handleExpand(tool.id)}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: (tool.color || '#d4a853') + '20', color: tool.color || '#d4a853' }}><Icon size={20}/></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-on-surface">{tool.name}</span>
                    <span className={"rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider "+(tool.isActive?'bg-emerald-500/15 text-emerald-400':'bg-surface-container-highest text-on-surface-variant/50')}>{tool.isActive?'Ativo':'Inativo'}</span>
                    {tool.isDefault && <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">Padrao</span>}
                  </div>
                  <div className="flex gap-4 text-xs text-on-surface-variant/50 mt-1"><span>{tool.userCount} usuarios</span><span>{tool.assessmentCount} assessments</span><span>{tool.category}</span></div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); toggleTool(tool); }} disabled={toggling===tool.id}
                    className={"p-1 rounded-lg transition-colors "+(tool.isActive?'text-emerald-400 hover:bg-emerald-500/10':'text-on-surface-variant/40 hover:bg-surface-container-high')}>
                    {tool.isActive ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                  </button>
                  {isExpanded ? <ChevronUp size={16} className="text-on-surface-variant/40"/> : <ChevronDown size={16} className="text-on-surface-variant/40"/>}
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-outline-variant/10 p-5 bg-surface-container-low/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-on-surface">Controle de Acesso</h4>
                    <div className="flex gap-2">
                      <button onClick={()=>toggleDefault(tool)} className={"btn-secondary !py-1.5 !px-3 !text-xs "+(tool.isDefault?'bg-primary/10 border-primary/30 text-primary':'')}>{tool.isDefault?'Padrao: Sim':'Tornar Padrao'}</button>
                      <button onClick={()=>grantAll(tool.id)} className="btn-secondary !py-1.5 !px-3 !text-xs gap-1"><UserPlus size={12}/>Liberar Todos</button>
                    </div>
                  </div>
                  <div className="mb-4"><p className="text-xs font-medium text-on-surface-variant/50 mb-2">Com acesso ({users.length})</p>
                    {users.length===0?<p className="text-xs text-on-surface-variant/30">Nenhum usuario</p>:(
                      <div className="flex flex-wrap gap-2">{users.map(u=>(<div key={u.id} className="flex items-center gap-2 rounded-xl bg-surface-container border border-outline-variant/15 px-3 py-1.5"><span className="text-xs font-medium text-on-surface">{u.name}</span><button onClick={()=>revokeAccess(tool.id,u.id)} className="text-red-400/60 hover:text-red-400"><UserMinus size={12}/></button></div>))}</div>
                    )}
                  </div>
                  {usersWithout.length>0&&(<div><p className="text-xs font-medium text-on-surface-variant/50 mb-2">Sem acesso ({usersWithout.length})</p><div className="flex flex-wrap gap-2">{usersWithout.map(u=>(<div key={u.id} className="flex items-center gap-2 rounded-xl bg-surface-container-lowest border border-outline-variant/10 px-3 py-1.5"><span className="text-xs text-on-surface-variant/50">{u.name}</span><button onClick={()=>grantAccess(tool.id,u.id)} className="text-emerald-500/60 hover:text-emerald-400"><UserPlus size={12}/></button></div>))}</div></div>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
`);

// ============================================
// 5. ADMIN INVITES - Fix contrast
// ============================================

w('../frontend/src/pages/AdminInvitesPage.jsx', `import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { Plus, Copy, Check, Trash2, Link2, Clock, AlertCircle, Mail, Send } from 'lucide-react';

export default function AdminInvitesPage() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [maxUses, setMaxUses] = useState(1);
  const [expDays, setExpDays] = useState(7);
  const [sendEmail, setSendEmail] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailName, setEmailName] = useState('');
  const [copied, setCopied] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const load = async () => { try { const d = await api.get('/admin/invites'); setInvites(d.invites); } catch(e){console.error(e);} finally{setLoading(false);} };
  useEffect(() => { load(); }, []);

  const create = async () => {
    setCreating(true); setLastResult(null);
    try {
      const payload = { maxUses, expiresInDays: expDays || undefined };
      if (sendEmail && emailTo) { payload.sendEmail = true; payload.emailTo = emailTo; payload.emailName = emailName || undefined; }
      const d = await api.post('/admin/invites', payload);
      await load();
      try { await navigator.clipboard.writeText(d.invite.url); setCopied(d.invite.id); setTimeout(()=>setCopied(null),2000); } catch(e){}
      setLastResult(d.emailSent ? 'Convite criado e email enviado!' : 'Convite criado! Link copiado.');
      setEmailTo(''); setEmailName(''); setSendEmail(false);
    } catch(e){alert(e.message);} finally{setCreating(false);}
  };
  const copyLink = async (code) => { try { await navigator.clipboard.writeText(window.location.origin+'/register?invite='+code); setCopied(code); setTimeout(()=>setCopied(null),2000); } catch(e){} };
  const deactivate = async (id) => { try { await api.delete('/admin/invites/'+id); load(); } catch(e){alert(e.message);} };
  const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});

  return (
    <div>
      <div className="mb-8"><h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight">Convites</h1><p className="mt-1 text-sm text-on-surface-variant/60">Gere links de convite para novos usuarios</p></div>
      <div className="card mb-6">
        <h3 className="text-sm font-semibold text-on-surface mb-4">Gerar novo convite</h3>
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div><label className="mb-2 block text-xs font-medium text-on-surface-variant/50">Max. de usos</label><input type="number" min={1} max={100} className="input-field w-24" value={maxUses} onChange={e=>setMaxUses(Number(e.target.value))}/></div>
          <div><label className="mb-2 block text-xs font-medium text-on-surface-variant/50">Expira em (dias)</label><input type="number" min={1} max={90} className="input-field w-24" value={expDays} onChange={e=>setExpDays(Number(e.target.value))}/></div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer mb-4"><input type="checkbox" checked={sendEmail} onChange={e=>setSendEmail(e.target.checked)} className="h-4 w-4 rounded border-outline-variant/30 bg-surface-container text-primary focus:ring-primary/30"/><span className="text-sm text-on-surface-variant/70 flex items-center gap-1"><Mail size={14}/> Enviar por email</span></label>
        {sendEmail && (<div className="flex flex-wrap gap-4 mb-4 pl-6"><div className="flex-1 min-w-[200px]"><label className="mb-2 block text-xs font-medium text-on-surface-variant/50">Email</label><input type="email" className="input-field" placeholder="email@exemplo.com" value={emailTo} onChange={e=>setEmailTo(e.target.value)}/></div><div className="flex-1 min-w-[200px]"><label className="mb-2 block text-xs font-medium text-on-surface-variant/50">Nome (opcional)</label><input className="input-field" placeholder="Nome" value={emailName} onChange={e=>setEmailName(e.target.value)}/></div></div>)}
        <button onClick={create} disabled={creating||(sendEmail&&!emailTo)} className="btn-primary gap-2">{creating?<div className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent"/>:sendEmail?<Send size={16}/>:<Plus size={16}/>}{sendEmail?'Gerar e Enviar':'Gerar Convite'}</button>
        {lastResult && <div className="mt-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm text-emerald-400">{lastResult}</div>}
      </div>
      <div className="space-y-3">
        {loading?<div className="card flex items-center justify-center py-12 text-on-surface-variant/40"><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"/>Carregando...</div>
        :invites.length===0?<div className="card flex flex-col items-center py-12 text-on-surface-variant/40"><Link2 size={32} className="mb-2 opacity-40"/><p>Nenhum convite</p></div>
        :invites.map(inv=>{
          const ok=inv.isActive&&!inv.isExpired&&!inv.isExhausted;
          return(
            <div key={inv.id} className={"card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between "+(!ok?'opacity-50':'')}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className="rounded-lg bg-surface-container-high px-2.5 py-1 text-sm font-mono text-primary">{inv.code}</code>
                  {!inv.isActive&&<span className="text-xs text-red-400 font-medium flex items-center gap-1"><AlertCircle size={12}/>Desativado</span>}
                  {inv.isExpired&&<span className="text-xs text-amber-400 font-medium flex items-center gap-1"><Clock size={12}/>Expirado</span>}
                  {inv.isExhausted&&<span className="text-xs text-on-surface-variant/50 font-medium">Esgotado</span>}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant/40"><span>Usos: {inv.usedCount}/{inv.maxUses}</span><span>Criado: {fmtDate(inv.createdAt)}</span>{inv.expiresAt&&<span>Expira: {fmtDate(inv.expiresAt)}</span>}</div>
              </div>
              <div className="flex items-center gap-2">
                {ok&&<button onClick={()=>copyLink(inv.code)} className="btn-secondary !py-1.5 !px-3 !text-xs gap-1.5">{copied===inv.code?<><Check size={12} className="text-emerald-400"/>Copiado!</>:<><Copy size={12}/>Copiar Link</>}</button>}
                {inv.isActive&&<button onClick={()=>deactivate(inv.id)} title="Desativar" className="p-1.5 rounded-lg text-on-surface-variant/30 hover:bg-red-500/10 hover:text-red-400 transition-colors"><Trash2 size={14}/></button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
`);

// ============================================
// 6. ADMIN ASSESSMENTS - Fix contrast
// ============================================

w('../frontend/src/pages/AdminAssessmentsPage.jsx', `import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ClipboardList, Eye, Unlock, FileText, ChevronDown, ChevronUp, Trash2, Loader2 } from 'lucide-react';

const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };
const statusLabels = {
  IN_PROGRESS: { text: 'Em andamento', color: 'bg-amber-500/15 text-amber-400' },
  COMPLETED: { text: 'Completado', color: 'bg-blue-500/15 text-blue-400' },
  REVIEWED: { text: 'Revisado', color: 'bg-purple-500/15 text-purple-400' },
  RELEASED: { text: 'Liberado', color: 'bg-emerald-500/15 text-emerald-400' },
  REPORT_GENERATED: { text: 'Relatorio gerado', color: 'bg-primary/15 text-primary' },
};

export default function AdminAssessmentsPage() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [releasing, setReleasing] = useState(null);
  const [generating, setGenerating] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  const load = async () => { try { const d = await api.get('/admin/assessments'); setAssessments(d.assessments); } catch(e){console.error(e);} finally{setLoading(false);} };
  useEffect(() => { load(); }, []);

  const release = async (id) => { setReleasing(id); try { await api.patch('/admin/assessments/'+id+'/release', {adminNotes:adminNotes||undefined}); setAdminNotes(''); await load(); } catch(e){alert(e.message);} finally{setReleasing(null);} };
  const generateReport = async (id) => { setGenerating(id); try { const r = await api.post('/admin/assessments/'+id+'/generate-report', {}); alert(r.message||'Relatorio gerado!'); await load(); } catch(e){alert('Erro: '+e.message);} finally{setGenerating(null);} };
  const deleteAssessment = async (id) => { if (!confirm('Deletar este assessment?')) return; setDeleting(id); try { await api.delete('/admin/assessments/'+id); setExpanded(null); await load(); } catch(e){alert(e.message);} finally{setDeleting(null);} };
  const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});

  return (
    <div>
      <div className="mb-8"><h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight">Assessments</h1><p className="mt-1 text-sm text-on-surface-variant/60">Gerencie os testes comportamentais</p></div>
      {loading?<div className="card flex items-center justify-center py-12 text-on-surface-variant/40"><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"/>Carregando...</div>
      :assessments.length===0?<div className="card flex flex-col items-center py-16 text-center"><ClipboardList size={32} className="text-on-surface-variant/30 mb-4"/><h3 className="text-lg font-headline text-on-surface-variant/50">Nenhum assessment</h3></div>
      :<div className="space-y-3">
        {assessments.map(a=>{
          const st = statusLabels[a.status]||statusLabels.IN_PROGRESS;
          const scores = a.scoresRaw?.normalized;
          const isExpanded = expanded===a.id;
          const canRelease = a.status==='COMPLETED'||a.status==='REVIEWED';
          const canGenerate = (a.status==='RELEASED'||a.status==='COMPLETED'||a.status==='REVIEWED')&&!a.report;
          const hasReport = !!a.report;
          return(
            <div key={a.id} className="card !p-0 overflow-hidden">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-5 cursor-pointer hover:bg-surface-container-high/50 transition-colors" onClick={()=>setExpanded(isExpanded?null:a.id)}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1"><span className="font-semibold text-on-surface">{a.user?.name}</span><span className={"rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider "+st.color}>{st.text}</span></div>
                  <div className="flex flex-wrap gap-x-4 text-xs text-on-surface-variant/40"><span>{a.user?.email}</span><span>Criado: {fmtDate(a.createdAt)}</span>{a.completedAt&&<span>Completado: {fmtDate(a.completedAt)}</span>}</div>
                </div>
                <div className="flex items-center gap-3">
                  {scores&&<div className="flex gap-2">{['D','I','S','C'].map(f=>(<div key={f} className="text-center"><div className={"text-[10px] font-bold "+(f==='D'?'text-disc-d':f==='I'?'text-disc-i':f==='S'?'text-disc-s':'text-disc-c')}>{profileNames[f][0]}</div><div className="text-xs font-semibold text-on-surface/80">{scores[f]}</div></div>))}</div>}
                  {isExpanded?<ChevronUp size={16} className="text-on-surface-variant/40"/>:<ChevronDown size={16} className="text-on-surface-variant/40"/>}
                </div>
              </div>
              {isExpanded&&(
                <div className="border-t border-outline-variant/10 p-5 bg-surface-container-low/50">
                  {scores&&(<div className="mb-5"><h4 className="text-sm font-semibold text-on-surface mb-3">Perfil Comportamental</h4><div className="grid grid-cols-4 gap-3">{['D','I','S','C'].map(f=>{const colors={D:'bg-disc-d',I:'bg-disc-i',S:'bg-disc-s',C:'bg-disc-c'};return(<div key={f}><div className="flex justify-between text-xs mb-1"><span className="text-on-surface-variant/70">{profileNames[f]}</span><span className="font-semibold text-on-surface">{scores[f]}%</span></div><div className="h-2 rounded-full bg-surface-container-highest"><div className={"h-full rounded-full "+colors[f]} style={{width:scores[f]+'%'}}/></div></div>);})}</div>{a.profilePrimary&&<p className="mt-3 text-sm text-on-surface-variant/70">Perfil: <span className="font-semibold text-on-surface">{profileNames[a.profilePrimary]} / {profileNames[a.profileSecondary]}</span></p>}</div>)}
                  <div className="flex flex-wrap gap-3 mb-4">
                    {hasReport&&<button onClick={(e)=>{e.stopPropagation();navigate('/report/'+a.id);}} className="btn-primary gap-2"><Eye size={14}/>Ver Relatorio</button>}
                    {canGenerate&&<button onClick={(e)=>{e.stopPropagation();generateReport(a.id);}} disabled={generating===a.id} className="btn-primary gap-2">{generating===a.id?<Loader2 size={14} className="animate-spin"/>:<FileText size={14}/>}Gerar Relatorio</button>}
                  </div>
                  {canRelease&&(<div className="border-t border-outline-variant/10 pt-4 mb-4"><h4 className="text-sm font-semibold text-on-surface mb-2">Liberar Assessment</h4><textarea className="input-field mb-3" rows={2} placeholder="Nota para a IA (opcional)..." value={adminNotes} onChange={e=>setAdminNotes(e.target.value)}/><button onClick={()=>release(a.id)} disabled={releasing===a.id} className="btn-primary gap-2">{releasing===a.id?<Loader2 size={14} className="animate-spin"/>:<Unlock size={14}/>}Liberar</button></div>)}
                  {a.releasedAt&&<p className="text-xs text-emerald-400 mt-2">Liberado em {fmtDate(a.releasedAt)}</p>}
                  {a.adminNotes&&<p className="text-xs text-on-surface-variant/50 mt-1">Nota: {a.adminNotes}</p>}
                  <div className="border-t border-outline-variant/10 pt-4 mt-4"><button onClick={(e)=>{e.stopPropagation();deleteAssessment(a.id);}} disabled={deleting===a.id} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30">{deleting===a.id?<Loader2 size={14} className="animate-spin"/>:<Trash2 size={14}/>}Deletar Assessment</button></div>
                </div>
              )}
            </div>
          );
        })}
      </div>}
    </div>
  );
}
`);

console.log('\\n============================================');
console.log('  Admin fix completo!');
console.log('============================================');
console.log('- Dashboard admin com cards Netflix + fotos');
console.log('- Todas as paginas com contraste corrigido');
console.log('- Endpoint /tools/all retorna todas as tools');
console.log('\\nReinicie o backend e faca git push.');
