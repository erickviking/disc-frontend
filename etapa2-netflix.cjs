const fs = require('fs');
const path = require('path');
function w(f, c) {
  const d = path.dirname(f);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(f, c, 'utf8');
  console.log('OK:', f);
}

// ============================================
// 1. USER DASHBOARD - Netflix-style tool catalog
// ============================================

w('../frontend/src/pages/UserDashboard.jsx', `import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { Users, Target, Heart, Compass, Rocket, Shield, BookOpen, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

const iconMap = { Users, Target, Heart, Compass, Rocket, Shield, BookOpen };
const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };

function ToolCard({ tool, assessments, onStart }) {
  const Icon = iconMap[tool.icon] || Users;
  const toolAssessments = assessments.filter(a => a.toolId === tool.id);
  const latest = toolAssessments[0];
  const hasReport = !!latest?.report;
  const isCompleted = latest && latest.status !== 'IN_PROGRESS';
  const isInProgress = latest?.status === 'IN_PROGRESS';

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1">
      {/* Color bar */}
      <div className="h-1.5" style={{ background: tool.color || '#4c6ef5' }} />

      <div className="p-6">
        {/* Icon + Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ background: (tool.color || '#4c6ef5') + '15', color: tool.color || '#4c6ef5' }}>
            <Icon size={24} />
          </div>
          {isCompleted && (
            <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-semibold text-green-700 uppercase tracking-wide">
              <CheckCircle2 size={10} /> Concluido
            </span>
          )}
          {isInProgress && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 uppercase tracking-wide">
              Em andamento
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-display text-lg text-gray-900 mb-2">{tool.name}</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-5 line-clamp-2">{tool.description}</p>

        {/* Scores preview if available */}
        {isCompleted && latest.scoresRaw?.normalized && tool.slug === 'disc' && (
          <div className="flex gap-2 mb-4 p-3 rounded-lg bg-gray-50">
            {['D','I','S','C'].map(f => (
              <div key={f} className="flex-1 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: f==='D'?'#E63946':f==='I'?'#F4A261':f==='S'?'#2A9D8F':'#264653' }}>{profileNames[f]}</div>
                <div className="text-sm font-bold text-gray-900">{latest.scoresRaw.normalized[f]}%</div>
              </div>
            ))}
          </div>
        )}

        {/* Action */}
        <div className="flex gap-2">
          {hasReport ? (
            <button onClick={() => onStart(tool, 'report', latest.id)} className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: tool.color || '#4c6ef5' }}>
              Ver Relatorio
            </button>
          ) : isInProgress ? (
            <button onClick={() => onStart(tool, 'continue')} className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-semibold transition-all hover:opacity-80" style={{ borderColor: tool.color, color: tool.color }}>
              Continuar <ArrowRight size={14} />
            </button>
          ) : isCompleted ? (
            <button disabled className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-400 cursor-default">
              Aguardando liberacao
            </button>
          ) : (
            <button onClick={() => onStart(tool, 'start')} className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg" style={{ background: tool.color || '#4c6ef5' }}>
              Iniciar <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function LockedToolCard({ tool }) {
  const Icon = iconMap[tool.icon] || Users;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/40 bg-gray-50/50 opacity-60">
      <div className="h-1.5 bg-gray-300" />
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-200 text-gray-400">
            <Icon size={24} />
          </div>
          <Lock size={16} className="text-gray-400" />
        </div>
        <h3 className="font-display text-lg text-gray-500 mb-2">{tool.name}</h3>
        <p className="text-sm text-gray-400 leading-relaxed mb-5 line-clamp-2">{tool.description}</p>
        <div className="flex items-center justify-center gap-2 rounded-xl bg-gray-200 py-2.5 text-sm font-medium text-gray-500">
          <Lock size={14} /> Em breve
        </div>
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

        // Try to get all tools for locked display
        try {
          const allData = await api.get('/tools/all');
          setAllTools(allData.tools || []);
        } catch (e) {
          setAllTools([]);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const greeting = () => { const h = new Date().getHours(); return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'; };

  const handleToolAction = (tool, action, assessmentId) => {
    if (action === 'report') navigate('/report/' + assessmentId);
    else if (tool.slug === 'disc') navigate('/quiz');
    else navigate('/tool/' + tool.slug);
  };

  // Tools user has access to
  const accessibleSlugs = new Set(tools.map(t => t.slug));
  // Tools user doesn't have (show as locked)
  const lockedTools = allTools.filter(t => !accessibleSlugs.has(t.slug) && t.isActive);

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"/></div>;

  return (
    <div>
      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-display text-3xl text-gray-900">{greeting()}, {(user?.name||'').split(' ')[0]}</h1>
        <p className="mt-2 text-gray-500">Explore suas ferramentas de desenvolvimento pessoal</p>
      </div>

      {/* Active Tools */}
      {tools.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Suas Ferramentas</h2>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map(tool => (
              <ToolCard key={tool.id} tool={tool} assessments={assessments} onStart={handleToolAction} />
            ))}
          </div>
        </div>
      )}

      {/* Locked Tools */}
      {lockedTools.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Em Breve</h2>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lockedTools.map(tool => (
              <LockedToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      )}

      {tools.length === 0 && lockedTools.length === 0 && (
        <div className="card flex flex-col items-center py-16 text-center">
          <Lock size={48} className="text-gray-300 mb-4" />
          <h3 className="font-display text-xl text-gray-500">Nenhuma ferramenta disponivel</h3>
          <p className="mt-2 text-sm text-gray-400">Entre em contato com sua mentora para liberar o acesso.</p>
        </div>
      )}
    </div>
  );
}
`);

// ============================================
// 2. ADMIN TOOLS PAGE - Manage tools + access
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
      const [toolsData, usersData] = await Promise.all([
        api.get('/admin/tools'),
        api.get('/admin/users?limit=100'),
      ]);
      setTools(toolsData.tools);
      setAllUsers(usersData.users);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const loadToolUsers = async (toolId) => {
    try {
      const d = await api.get('/admin/tools/' + toolId + '/users');
      setToolUsers(prev => ({ ...prev, [toolId]: d.users }));
    } catch (e) { console.error(e); }
  };

  const toggleTool = async (tool) => {
    setToggling(tool.id);
    try {
      await api.patch('/admin/tools/' + tool.id, { isActive: !tool.isActive });
      await load();
    } catch (e) { alert(e.message); }
    finally { setToggling(null); }
  };

  const toggleDefault = async (tool) => {
    try {
      await api.patch('/admin/tools/' + tool.id, { isDefault: !tool.isDefault });
      await load();
    } catch (e) { alert(e.message); }
  };

  const grantAccess = async (toolId, userId) => {
    try {
      await api.post('/admin/tools/' + toolId + '/grant/' + userId, {});
      await loadToolUsers(toolId);
      await load();
    } catch (e) { alert(e.message); }
  };

  const revokeAccess = async (toolId, userId) => {
    try {
      await api.delete('/admin/tools/' + toolId + '/revoke/' + userId);
      await loadToolUsers(toolId);
      await load();
    } catch (e) { alert(e.message); }
  };

  const grantAll = async (toolId) => {
    try {
      const result = await api.post('/admin/tools/' + toolId + '/grant-all', {});
      alert(result.message);
      await loadToolUsers(toolId);
      await load();
    } catch (e) { alert(e.message); }
  };

  const handleExpand = async (toolId) => {
    if (expanded === toolId) { setExpanded(null); return; }
    setExpanded(toolId);
    if (!toolUsers[toolId]) await loadToolUsers(toolId);
  };

  if (loading) return <div className="flex items-center justify-center py-12 text-gray-400"><div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent mr-2"/>Carregando...</div>;

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-2xl text-gray-900">Ferramentas</h1><p className="mt-1 text-sm text-gray-500">Gerencie as ferramentas disponiveis e o acesso dos usuarios</p></div>

      <div className="space-y-3">
        {tools.map(tool => {
          const Icon = iconMap[tool.icon] || Users;
          const isExpanded = expanded === tool.id;
          const users = toolUsers[tool.id] || [];
          const userIds = new Set(users.map(u => u.id));
          const usersWithout = allUsers.filter(u => !userIds.has(u.id) && u.role !== 'ADMIN');

          return (
            <div key={tool.id} className="card !p-0 overflow-hidden">
              <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50/50" onClick={() => handleExpand(tool.id)}>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: (tool.color || '#4c6ef5') + '15', color: tool.color }}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">{tool.name}</span>
                    <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide " + (tool.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {tool.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                    {tool.isDefault && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700 uppercase tracking-wide">Padrao</span>}
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400 mt-0.5">
                    <span>{tool.userCount} usuarios</span>
                    <span>{tool.assessmentCount} assessments</span>
                    <span>{tool.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); toggleTool(tool); }} disabled={toggling === tool.id}
                    className={"p-1 rounded-lg transition-colors " + (tool.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100')} title={tool.isActive ? 'Desativar' : 'Ativar'}>
                    {tool.isActive ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                  </button>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 p-4 bg-gray-50/30">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">Controle de Acesso</h4>
                    <div className="flex gap-2">
                      <button onClick={() => toggleDefault(tool)} className={"btn-secondary !py-1 !px-3 !text-xs " + (tool.isDefault ? 'bg-brand-50 border-brand-200 text-brand-700' : '')}>
                        {tool.isDefault ? 'Padrao: Sim' : 'Tornar Padrao'}
                      </button>
                      <button onClick={() => grantAll(tool.id)} className="btn-secondary !py-1 !px-3 !text-xs gap-1"><UserPlus size={12}/>Liberar Todos</button>
                    </div>
                  </div>

                  {/* Users with access */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Com acesso ({users.length})</p>
                    {users.length === 0 ? (
                      <p className="text-xs text-gray-400">Nenhum usuario com acesso</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {users.map(u => (
                          <div key={u.id} className="flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-1.5">
                            <span className="text-xs font-medium text-gray-700">{u.name}</span>
                            <button onClick={() => revokeAccess(tool.id, u.id)} className="text-red-400 hover:text-red-600" title="Revogar"><UserMinus size={12}/></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Users without access */}
                  {usersWithout.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Sem acesso ({usersWithout.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {usersWithout.map(u => (
                          <div key={u.id} className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5">
                            <span className="text-xs text-gray-500">{u.name}</span>
                            <button onClick={() => grantAccess(tool.id, u.id)} className="text-green-500 hover:text-green-700" title="Conceder"><UserPlus size={12}/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
// 3. ADD /api/tools/all route (public list of active tools)
// ============================================

w('../backend/src/routes/tools.js', `import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const prisma = new PrismaClient();

const userToolRouter = Router();
userToolRouter.use(authenticate);

// User's accessible tools
userToolRouter.get('/', async (req, res) => {
  try {
    if (req.user.role === 'ADMIN') {
      const tools = await prisma.tool.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
      return res.json({ tools });
    }
    const access = await prisma.userToolAccess.findMany({
      where: { userId: req.user.id },
      include: { tool: true },
    });
    const tools = access.map(a => a.tool).filter(t => t.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
    return res.json({ tools });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

// All active tools (for showing locked ones too)
userToolRouter.get('/all', async (req, res) => {
  try {
    const tools = await prisma.tool.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, name: true, description: true, icon: true, color: true, category: true, sortOrder: true },
      orderBy: { sortOrder: 'asc' },
    });
    return res.json({ tools });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

// Admin routes
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
// 4. UPDATE LAYOUTS - Add "Ferramentas" to admin nav
// ============================================

w('../frontend/src/components/AppLayout.jsx', `import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { LayoutDashboard, Users, Link2, ClipboardList, Wrench, LogOut, Menu, X, ChevronRight } from 'lucide-react';

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'Usuarios' },
  { to: '/admin/tools', icon: Wrench, label: 'Ferramentas' },
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
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Desenvolvimento Pessoal</p>
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

// ============================================
// 5. UPDATE APP.JSX - Add tools route
// ============================================

w('../frontend/src/App.jsx', `import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AppLayout } from './components/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import AdminInvitesPage from './pages/AdminInvitesPage.jsx';
import AdminAssessmentsPage from './pages/AdminAssessmentsPage.jsx';
import AdminToolsPage from './pages/AdminToolsPage.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import UserAssessmentsPage from './pages/UserAssessmentsPage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import ReportPage from './pages/ReportPage.jsx';

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
          <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
          <Route path="/report/:id" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AppLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="tools" element={<AdminToolsPage />} />
            <Route path="invites" element={<AdminInvitesPage />} />
            <Route path="assessments" element={<AdminAssessmentsPage />} />
          </Route>
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<UserDashboard />} />
            <Route path="assessments" element={<UserAssessmentsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
`);

console.log('\\n============================================');
console.log('  Etapa 2 - Area de Membros criada!');
console.log('============================================');
console.log('\\nReinicie o backend e faca deploy:');
console.log('  cd C:\\disc-system\\backend && npm run dev');
console.log('\\nDepois git push nos dois repos.');
