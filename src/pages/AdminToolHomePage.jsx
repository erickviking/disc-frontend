import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import {
  ArrowLeft, Users, Target, Heart, Compass, Rocket, Shield, BookOpen,
  ToggleLeft, ToggleRight, Star, UserPlus, UserMinus,
  Eye, FileText, Unlock, Trash2, Loader2, ChevronDown, ChevronUp, Clock, Search, CheckCircle2, XCircle
} from 'lucide-react';

const iconMap = { Users, Target, Heart, Compass, Rocket, Shield, BookOpen };
const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };

const cardImages = {
  'disc': '/card-disc.jpg', 'roda-da-vida': '/card-roda.jpg', 'inteligencia-emocional': '/card-ie.jpg',
  'valores-pessoais': '/card-valores.jpg', 'metas-smart': '/card-metas.jpg',
  'sabotadores': '/card-sabotadores.jpg', 'diario': '/card-diario.jpg',
};
const cardFocusPoint = {
  'disc': 'center 15%', 'roda-da-vida': 'center 0%', 'inteligencia-emocional': 'center 40%',
  'valores-pessoais': 'center 45%', 'metas-smart': 'center 15%',
  'sabotadores': 'center 20%', 'diario': 'center 42%',
};

const statusLabels = {
  IN_PROGRESS: { text: 'Em andamento', color: 'bg-amber-500/15 text-amber-400' },
  COMPLETED: { text: 'Completado', color: 'bg-blue-500/15 text-blue-400' },
  REVIEWED: { text: 'Revisado', color: 'bg-purple-500/15 text-purple-400' },
  RELEASED: { text: 'Liberado', color: 'bg-emerald-500/15 text-emerald-400' },
  REPORT_GENERATED: { text: 'Relatório gerado', color: 'bg-primary/15 text-primary' },
};

function normalize(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function AccessUserRow({ user, hasAccess, loading, onGrant, onRevoke }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant/15 bg-surface-container-low px-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-on-surface">{user.name}</p>
          {user.isAdmin && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">Admin</span>}
          <span className={"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider " + (hasAccess ? 'bg-emerald-500/15 text-emerald-400' : 'bg-surface-container-highest text-on-surface-variant')}>
            {hasAccess ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
            {hasAccess ? 'Com acesso' : 'Sem acesso'}
          </span>
        </div>
        {user.email && <p className="mt-0.5 truncate text-xs text-on-surface-variant/60">{user.email}</p>}
      </div>
      {hasAccess ? (
        <button onClick={() => onRevoke(user.id)} disabled={loading} className="inline-flex min-w-[112px] items-center justify-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50">
          {loading ? <Loader2 size={13} className="animate-spin" /> : <UserMinus size={13} />}
          Remover
        </button>
      ) : (
        <button onClick={() => onGrant(user.id)} disabled={loading} className="inline-flex min-w-[112px] items-center justify-center gap-1.5 rounded-lg bg-primary/15 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/25 disabled:opacity-50">
          {loading ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
          Liberar
        </button>
      )}
    </div>
  );
}

export default function AdminToolHomePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [tool, setTool] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [toolUsers, setToolUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [releasing, setReleasing] = useState(null);
  const [generating, setGenerating] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showAccess, setShowAccess] = useState(true);
  const [accessSearch, setAccessSearch] = useState('');
  const [accessFilter, setAccessFilter] = useState('with');
  const [accessAction, setAccessAction] = useState(null);
  const [bulkAction, setBulkAction] = useState(null);
  const [accessMessage, setAccessMessage] = useState('');

  const load = async () => {
    try {
      const [toolsData, assessData, usersData] = await Promise.all([
        api.get('/admin/tools'),
        api.get('/admin/assessments?toolSlug=' + slug + '&limit=100'),
        api.get('/admin/users?limit=500'),
      ]);
      const found = (toolsData.tools || []).find(t => t.slug === slug);
      setTool(found || null);
      setAssessments(assessData.assessments || []);
      setAllUsers(usersData.users || []);
      if (found) {
        try {
          const td = await api.get('/admin/tools/' + found.id + '/users');
          setToolUsers(td.users || []);
        } catch (e) { console.error(e); }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [slug]);

  const accessIds = useMemo(() => new Set(toolUsers.map(u => u.id)), [toolUsers]);
  const grantableUsers = useMemo(() => allUsers.filter(u => !accessIds.has(u.id)), [allUsers, accessIds]);
  const query = normalize(accessSearch);
  const filteredWithAccess = useMemo(() => toolUsers.filter(u => normalize(u.name + ' ' + (u.email || '')).includes(query)), [toolUsers, query]);
  const filteredWithoutAccess = useMemo(() => grantableUsers.filter(u => normalize(u.name + ' ' + (u.email || '')).includes(query)), [grantableUsers, query]);

  const toggleTool = async () => {
    if (!tool) return;
    setToggling(true);
    try { await api.patch('/admin/tools/' + tool.id, { isActive: !tool.isActive }); await load(); }
    catch (e) { alert(e.message); }
    finally { setToggling(false); }
  };

  const toggleDefault = async () => {
    if (!tool) return;
    try { await api.patch('/admin/tools/' + tool.id, { isDefault: !tool.isDefault }); await load(); }
    catch (e) { alert(e.message); }
  };

  const grantAccess = async (userId) => {
    setAccessAction('grant:' + userId);
    setAccessMessage('');
    try { await api.post('/admin/tools/' + tool.id + '/grant/' + userId, {}); setAccessMessage('Acesso liberado com sucesso.'); await load(); }
    catch (e) { alert(e.message); }
    finally { setAccessAction(null); }
  };

  const revokeAccess = async (userId) => {
    setAccessAction('revoke:' + userId);
    setAccessMessage('');
    try { await api.delete('/admin/tools/' + tool.id + '/revoke/' + userId); setAccessMessage('Acesso removido com sucesso.'); await load(); }
    catch (e) { alert(e.message); }
    finally { setAccessAction(null); }
  };

  const grantAll = async () => {
    setBulkAction('grant-all');
    setAccessMessage('');
    try { const r = await api.post('/admin/tools/' + tool.id + '/grant-all', {}); setAccessMessage(r.message || 'Acessos liberados.'); await load(); }
    catch (e) { alert(e.message); }
    finally { setBulkAction(null); }
  };

  const revokeAll = async () => {
    if (!confirm('Remover o acesso desta ferramenta para todos os usuários?')) return;
    setBulkAction('revoke-all');
    setAccessMessage('');
    try { const r = await api.delete('/admin/tools/' + tool.id + '/revoke-all'); setAccessMessage(r.message || 'Acessos removidos.'); await load(); }
    catch (e) { alert(e.message); }
    finally { setBulkAction(null); }
  };

  const release = async (id) => {
    setReleasing(id);
    try { await api.patch('/admin/assessments/' + id + '/release', { adminNotes: adminNotes || undefined }); setAdminNotes(''); await load(); }
    catch (e) { alert(e.message); }
    finally { setReleasing(null); }
  };

  const generateReport = async (id) => {
    setGenerating(id);
    try { const r = await api.post('/admin/assessments/' + id + '/generate-report', {}); alert(r.message || 'Relatório gerado!'); await load(); }
    catch (e) { alert('Erro: ' + e.message); }
    finally { setGenerating(null); }
  };

  const deleteAssessment = async (id) => {
    if (!confirm('Deletar este assessment?')) return;
    setDeleting(id);
    try { await api.delete('/admin/assessments/' + id); setExpanded(null); await load(); }
    catch (e) { alert(e.message); }
    finally { setDeleting(null); }
  };

  const getReportPath = (a) => {
    if (slug === 'disc') return '/report/' + a.id;
    if (slug === 'roda-da-vida') return '/roda-da-vida/report/' + a.id;
    return '/tools/' + slug + '/report/' + a.id;
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!tool) return <div className="card text-center py-16"><p className="text-on-surface-variant mb-4">Ferramenta não encontrada.</p><button onClick={() => navigate('/admin/tools')} className="btn-secondary gap-2"><ArrowLeft size={14} /> Voltar</button></div>;

  const Icon = iconMap[tool.icon] || Target;
  const bgImage = cardImages[slug];
  const focusPoint = tool.config?.imagePosition || cardFocusPoint[slug] || 'center 20%';

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/admin/tools')} className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors">
        <ArrowLeft size={14} /> Voltar às ferramentas
      </button>

      <div className="relative rounded-2xl overflow-hidden border border-outline-variant/20">
        <div className="relative h-48 md:h-56">
          {bgImage && <img src={bgImage} alt="" style={{ objectPosition: focusPoint }} className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container from-10% via-surface-container/80 via-50% to-surface-container/30" />
          <div className="absolute bottom-6 left-6 right-6 z-10 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl shadow-lg backdrop-blur-sm" style={{ backgroundColor: (tool.color || '#d4a853') + '44' }}>
                  <Icon size={22} style={{ color: tool.color || '#d4a853' }} />
                </div>
                <span className={"inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest " + (tool.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400')}>{tool.isActive ? 'Ativa' : 'Inativa'}</span>
                {tool.isDefault && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold"><Star size={10} /> Padrão</span>}
              </div>
              <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-surface tracking-tight">{tool.name}</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={toggleTool} disabled={toggling} className={"btn-secondary !py-2 !px-4 !text-xs gap-1.5 " + (tool.isActive ? '' : 'opacity-70')}>
                {toggling ? <Loader2 size={14} className="animate-spin" /> : tool.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}{tool.isActive ? 'Desativar' : 'Ativar'}
              </button>
              <button onClick={toggleDefault} className={"btn-secondary !py-2 !px-4 !text-xs gap-1.5 " + (tool.isDefault ? 'text-primary' : '')}><Star size={14} /> {tool.isDefault ? 'Padrão' : 'Tornar padrão'}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between"><h2 className="font-headline text-lg font-semibold text-on-surface">Assessments ({assessments.length})</h2></div>
          {assessments.length === 0 ? <div className="card text-center py-12"><p className="text-on-surface-variant/50">Nenhum assessment para esta ferramenta.</p></div> : <div className="space-y-3">{assessments.map(a => {
            const st = statusLabels[a.status] || statusLabels.IN_PROGRESS;
            const isExpanded2 = expanded === a.id;
            const canRelease = a.status === 'COMPLETED' || a.status === 'REVIEWED';
            const canGenerate = (a.status === 'RELEASED' || a.status === 'COMPLETED' || a.status === 'REVIEWED') && !a.report;
            const hasReport = !!a.report;
            const reportPath = getReportPath(a);
            return <div key={a.id} className="card !p-0 overflow-hidden"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-5 cursor-pointer hover:bg-surface-container-high/50 transition-colors" onClick={() => setExpanded(isExpanded2 ? null : a.id)}><div className="flex-1"><div className="flex items-center gap-3 mb-1"><span className="font-semibold text-on-surface">{a.user?.name}</span><span className={"rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider " + st.color}>{st.text}</span></div><div className="flex flex-wrap gap-x-4 text-xs text-on-surface-variant/40"><span>{a.user?.email}</span><span>Criado: {fmtDate(a.createdAt)}</span>{a.completedAt && <span>Completado: {fmtDate(a.completedAt)}</span>}</div></div><div className="flex items-center gap-2">{hasReport && <span className="text-xs text-primary font-medium">Relatório pronto</span>}{isExpanded2 ? <ChevronUp size={16} className="text-on-surface-variant/40" /> : <ChevronDown size={16} className="text-on-surface-variant/40" />}</div></div>{isExpanded2 && <div className="border-t border-outline-variant/10 p-5 bg-surface-container-low/50 space-y-4"><div className="flex flex-wrap gap-3">{hasReport && reportPath && <button onClick={() => navigate(reportPath)} className="btn-primary gap-2"><Eye size={14} />Ver Relatório</button>}{canGenerate && <button onClick={() => generateReport(a.id)} disabled={generating === a.id} className="btn-primary gap-2">{generating === a.id ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}Gerar Relatório</button>}</div>{canRelease && <div className="border-t border-outline-variant/10 pt-4"><h4 className="text-sm font-semibold text-on-surface mb-2">Liberar Assessment</h4><textarea className="input-field mb-3" rows={2} placeholder="Nota para a IA (opcional)..." value={adminNotes} onChange={e => setAdminNotes(e.target.value)} /><button onClick={() => release(a.id)} disabled={releasing === a.id} className="btn-primary gap-2">{releasing === a.id ? <Loader2 size={14} className="animate-spin" /> : <Unlock size={14} />}Liberar</button></div>}{a.releasedAt && <p className="text-xs text-emerald-400">Liberado em {fmtDate(a.releasedAt)}</p>}{a.adminNotes && <p className="text-xs text-on-surface-variant/50">Nota: {a.adminNotes}</p>}<div className="border-t border-outline-variant/10 pt-4"><button onClick={() => deleteAssessment(a.id)} disabled={deleting === a.id} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30">{deleting === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}Deletar Assessment</button></div></div>}</div>;
          })}</div>}
        </div>

        <div className="space-y-4">
          <div className="card"><h3 className="font-headline text-base font-semibold text-on-surface mb-2">Sobre</h3><p className="text-xs text-on-surface-variant leading-relaxed">{tool.description}</p><div className="flex gap-4 mt-4 text-xs text-on-surface-variant"><span><strong className="text-on-surface">{toolUsers.length}</strong> usuários</span><span><strong className="text-on-surface">{assessments.length}</strong> assessments</span></div></div>

          <div className="card">
            <div className="flex items-center justify-between mb-3"><div><h3 className="font-headline text-base font-semibold text-on-surface">Controle de acesso</h3><p className="mt-1 text-xs text-on-surface-variant">Gerencie quem pode usar esta ferramenta.</p></div><button onClick={() => setShowAccess(!showAccess)} className="text-xs text-primary hover:text-gold-200">{showAccess ? 'Esconder' : 'Mostrar'}</button></div>
            {showAccess && <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-3"><p className="text-2xl font-bold text-emerald-400">{toolUsers.length}</p><p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Com acesso</p></div><div className="rounded-xl bg-surface-container-low border border-outline-variant/15 p-3"><p className="text-2xl font-bold text-on-surface">{grantableUsers.length}</p><p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Sem acesso</p></div></div>
              <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" /><input value={accessSearch} onChange={e => setAccessSearch(e.target.value)} placeholder="Buscar usuário..." className="input-field pl-9 text-sm" /></div>
              <div className="grid grid-cols-2 gap-2"><button onClick={() => setAccessFilter('with')} className={'rounded-lg px-3 py-2 text-xs font-semibold transition-colors ' + (accessFilter === 'with' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface')}>Com acesso ({filteredWithAccess.length})</button><button onClick={() => setAccessFilter('without')} className={'rounded-lg px-3 py-2 text-xs font-semibold transition-colors ' + (accessFilter === 'without' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface')}>Sem acesso ({filteredWithoutAccess.length})</button></div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><button onClick={grantAll} disabled={bulkAction === 'grant-all'} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary/15 px-3 py-2.5 text-xs font-semibold text-primary hover:bg-primary/25 disabled:opacity-50">{bulkAction === 'grant-all' ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}Liberar todos</button><button onClick={revokeAll} disabled={bulkAction === 'revoke-all' || toolUsers.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50">{bulkAction === 'revoke-all' ? <Loader2 size={14} className="animate-spin" /> : <UserMinus size={14} />}Remover todos</button></div>
              {accessMessage && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">{accessMessage}</div>}
              <div className="max-h-[430px] space-y-2 overflow-y-auto pr-1">
                {accessFilter === 'with' && (filteredWithAccess.length === 0 ? <div className="rounded-xl bg-surface-container-low p-4 text-center text-xs text-on-surface-variant">Nenhum usuário com acesso encontrado.</div> : filteredWithAccess.map(u => <AccessUserRow key={u.id} user={u} hasAccess loading={accessAction === 'revoke:' + u.id} onGrant={grantAccess} onRevoke={revokeAccess} />))}
                {accessFilter === 'without' && (filteredWithoutAccess.length === 0 ? <div className="rounded-xl bg-surface-container-low p-4 text-center text-xs text-on-surface-variant">Nenhum usuário sem acesso encontrado.</div> : filteredWithoutAccess.map(u => <AccessUserRow key={u.id} user={u} hasAccess={false} loading={accessAction === 'grant:' + u.id} onGrant={grantAccess} onRevoke={revokeAccess} />))}
              </div>
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
}
