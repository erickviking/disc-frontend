const fs = require('fs');
const path = require('path');
function w(f, c) {
  const dir = path.dirname(f);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(f, c, 'utf8');
  console.log('✓', f);
}

// ============================================
// 1. ADMIN TOOLS PAGE — Cards Netflix com fotos
// ============================================

w('src/pages/AdminToolsPage.jsx', `import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import {
  Users, Target, Heart, Compass, Rocket, Shield, BookOpen,
  ToggleLeft, ToggleRight, UserPlus, UserMinus, ChevronDown, ChevronUp,
  Lock, Unlock, Star, BarChart3
} from 'lucide-react';

const iconMap = { Users, Target, Heart, Compass, Rocket, Shield, BookOpen };

const cardImages = {
  'disc': '/card-disc.jpg',
  'roda-da-vida': '/card-roda.jpg',
  'inteligência-emocional': '/card-ie.jpg',
  'inteligencia-emocional': '/card-ie.jpg',
  'valores-pessoais': '/card-valores.jpg',
  'metas-smart': '/card-metas.jpg',
  'sabotadores': '/card-sabotadores.jpg',
  'diário': '/card-diario.jpg',
  'diario': '/card-diario.jpg',
};

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
      setTools(toolsData.tools || []);
      setAllUsers(usersData.users || []);
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
      alert(result.message || 'Acesso concedido a todos');
      await loadToolUsers(toolId);
      await load();
    } catch (e) { alert(e.message); }
  };

  const handleExpand = async (toolId) => {
    if (expanded === toolId) { setExpanded(null); return; }
    setExpanded(toolId);
    if (!toolUsers[toolId]) await loadToolUsers(toolId);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">Ferramentas</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Gerencie as ferramentas da plataforma e controle o acesso dos usuários.
        </p>
      </div>

      {/* Resumo */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2">
          <BarChart3 size={16} className="text-primary" />
          <span className="text-sm text-on-surface-variant">
            {tools.filter(t => t.isActive).length} de {tools.length} ativas
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2">
          <Star size={16} className="text-primary" />
          <span className="text-sm text-on-surface-variant">
            {tools.filter(t => t.isDefault).length} padrão
          </span>
        </div>
      </div>

      {/* Cards Grid — Netflix style */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {tools.sort((a, b) => a.sortOrder - b.sortOrder).map(tool => {
          const Icon = iconMap[tool.icon] || Target;
          const bgImage = cardImages[tool.slug];
          const users = toolUsers[tool.id] || [];
          const usersWithout = allUsers.filter(u => !u.isAdmin && !users.find(tu => tu.id === u.id));
          const isExpanded = expanded === tool.id;
          const userCount = tool._count?.userAccess || 0;
          const assessmentCount = tool._count?.assessments || 0;

          return (
            <div key={tool.id} className="group flex flex-col rounded-2xl overflow-hidden bg-surface-container border border-outline-variant/30 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
              
              {/* Card Image Header */}
              <div className="relative h-44 overflow-hidden">
                {bgImage ? (
                  <img
                    src={bgImage}
                    alt=""
                    className={\`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 \${!tool.isActive ? 'grayscale opacity-50' : ''}\`}
                  />
                ) : (
                  <div className="absolute inset-0" style={{ background: \`linear-gradient(135deg, \${tool.color}33, \${tool.color}11)\` }} />
                )}
                
                {/* Overlay gradiente */}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/60 to-transparent" />
                
                {/* Status badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  {tool.isActive ? (
                    <span className="flex items-center gap-1 rounded-full bg-green-500/20 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-green-400 border border-green-500/20">
                      <Unlock size={10} /> Ativa
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-red-500/20 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-red-400 border border-red-500/20">
                      <Lock size={10} /> Inativa
                    </span>
                  )}
                </div>

                {/* Default badge */}
                {tool.isDefault && (
                  <div className="absolute top-3 left-3">
                    <span className="flex items-center gap-1 rounded-full bg-primary/20 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-primary border border-primary/20">
                      <Star size={10} /> Padrão
                    </span>
                  </div>
                )}

                {/* Icon floating */}
                <div className="absolute bottom-3 left-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg"
                    style={{ backgroundColor: tool.color + '33', borderColor: tool.color + '44', borderWidth: 1 }}
                  >
                    <Icon size={20} style={{ color: tool.color }} />
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex-1 p-4 pt-2 space-y-3">
                <div>
                  <h3 className="font-headline text-lg font-bold text-on-surface">{tool.name}</h3>
                  <p className="mt-1 text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                    {tool.description}
                  </p>
                </div>

                {/* Métricas */}
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <Users size={12} className="text-on-surface-variant" />
                    <span className="text-xs text-on-surface-variant">
                      <span className="font-semibold text-on-surface">{userCount}</span> usuários
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BarChart3 size={12} className="text-on-surface-variant" />
                    <span className="text-xs text-on-surface-variant">
                      <span className="font-semibold text-on-surface">{assessmentCount}</span> avaliações
                    </span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => toggleTool(tool)}
                    disabled={toggling === tool.id}
                    className={\`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors \${
                      tool.isActive
                        ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }\`}
                  >
                    {toggling === tool.id ? (
                      <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                    ) : tool.isActive ? (
                      <ToggleRight size={14} />
                    ) : (
                      <ToggleLeft size={14} />
                    )}
                    {tool.isActive ? 'Ativa' : 'Ativar'}
                  </button>

                  <button
                    onClick={() => toggleDefault(tool)}
                    className={\`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors \${
                      tool.isDefault
                        ? 'bg-primary/10 text-primary'
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }\`}
                  >
                    <Star size={12} />
                    {tool.isDefault ? 'Padrão' : 'Tornar padrão'}
                  </button>

                  <button
                    onClick={() => handleExpand(tool.id)}
                    className="ml-auto flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                  >
                    <Users size={12} />
                    Acesso
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>
              </div>

              {/* Expandido: controle de acesso por usuário */}
              {isExpanded && (
                <div className="border-t border-outline-variant/20 bg-surface-container-low p-4 space-y-4">
                  {/* Ações em massa */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-on-surface uppercase tracking-wider">Controle de acesso</p>
                    <button
                      onClick={() => grantAll(tool.id)}
                      className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                    >
                      <UserPlus size={12} /> Liberar todos
                    </button>
                  </div>

                  {/* Usuários com acesso */}
                  {users.length > 0 && (
                    <div>
                      <p className="text-xs text-on-surface-variant mb-2">
                        Com acesso ({users.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {users.map(u => (
                          <div key={u.id} className="flex items-center gap-2 rounded-lg bg-surface-container px-3 py-1.5 border border-outline-variant/20">
                            <span className="text-xs font-medium text-on-surface">{u.name}</span>
                            <button
                              onClick={() => revokeAccess(tool.id, u.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Revogar acesso"
                            >
                              <UserMinus size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Usuários sem acesso */}
                  {usersWithout.length > 0 && (
                    <div>
                      <p className="text-xs text-on-surface-variant mb-2">
                        Sem acesso ({usersWithout.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {usersWithout.map(u => (
                          <div key={u.id} className="flex items-center gap-2 rounded-lg bg-surface-container-lowest px-3 py-1.5 border border-outline-variant/10">
                            <span className="text-xs text-on-surface-variant">{u.name}</span>
                            <button
                              onClick={() => grantAccess(tool.id, u.id)}
                              className="text-green-400 hover:text-green-300 transition-colors"
                              title="Conceder acesso"
                            >
                              <UserPlus size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {users.length === 0 && usersWithout.length === 0 && (
                    <p className="text-xs text-on-surface-variant text-center py-2">
                      Nenhum usuário cadastrado ainda.
                    </p>
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
// 2. USER DASHBOARD — Mostra TODAS as ferramentas (bloqueadas com cadeado)
//    + Acentuação corrigida em todos os textos
// ============================================

w('src/pages/UserDashboard.jsx', `import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { ArrowRight, Lock, CheckCircle2, Clock, Users, Target, Heart, Compass, Rocket, Shield, BookOpen } from 'lucide-react';

const iconMap = { Users, Target, Heart, Compass, Rocket, Shield, BookOpen };
const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };

const cardImages = {
  'disc': '/card-disc.jpg',
  'roda-da-vida': '/card-roda.jpg',
  'inteligência-emocional': '/card-ie.jpg',
  'inteligencia-emocional': '/card-ie.jpg',
  'valores-pessoais': '/card-valores.jpg',
  'metas-smart': '/card-metas.jpg',
  'sabotadores': '/card-sabotadores.jpg',
  'diário': '/card-diario.jpg',
  'diario': '/card-diario.jpg',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tools, setTools] = useState([]);
  const [allTools, setAllTools] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const firstName = user?.name?.split(' ')[0] || 'Usuário';

  useEffect(() => {
    const load = async () => {
      try {
        // Busca ferramentas do usuário (com acesso) E todas as ferramentas ativas
        const [userTools, allToolsData, assessData] = await Promise.all([
          api.get('/tools/my').catch(() => ({ tools: [] })),
          api.get('/tools/all').catch(() => ({ tools: [] })),
          api.get('/assessments/my').catch(() => ({ assessments: [] })),
        ]);

        const myTools = userTools.tools || [];
        const every = allToolsData.tools || [];
        const myToolIds = new Set(myTools.map(t => t.id));

        // Combina: ferramentas com acesso + ferramentas sem acesso (bloqueadas)
        const combined = [
          ...myTools.map(t => ({ ...t, hasAccess: true })),
          ...every.filter(t => !myToolIds.has(t.id)).map(t => ({ ...t, hasAccess: false })),
        ].sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));

        setTools(combined);
        setAllTools(every);
        setAssessments(assessData.assessments || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const getAssessment = (toolSlug) => {
    return assessments.find(a => a.tool?.slug === toolSlug);
  };

  const getToolStatus = (tool) => {
    if (!tool.hasAccess) return 'locked';
    const assessment = getAssessment(tool.slug);
    if (!assessment) return 'available';
    if (assessment.status === 'completed' && assessment.report) return 'completed';
    if (assessment.status === 'completed') return 'awaiting_report';
    return 'in_progress';
  };

  const handleToolAction = (tool) => {
    const status = getToolStatus(tool);
    const assessment = getAssessment(tool.slug);
    switch (status) {
      case 'available':
        if (tool.slug === 'disc') navigate('/dashboard/disc/start');
        break;
      case 'in_progress':
        if (tool.slug === 'disc') navigate('/dashboard/disc/quiz');
        break;
      case 'completed':
        if (assessment) navigate('/dashboard/disc/report/' + assessment.id);
        break;
      default:
        break;
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Hero greeting */}
      <div className="relative rounded-2xl overflow-hidden bg-surface-container border border-outline-variant/20 p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-transparent to-transparent" />
        <div className="relative">
          <p className="text-sm text-primary font-label font-medium uppercase tracking-widest">
            {getGreeting()}
          </p>
          <h1 className="mt-1 font-headline text-3xl font-bold text-on-surface">
            {firstName}
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant max-w-md">
            Explore suas ferramentas de desenvolvimento pessoal e descubra mais sobre você.
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div>
        <h2 className="font-headline text-lg font-semibold text-on-surface mb-4">
          Suas ferramentas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tools.map(tool => {
            const Icon = iconMap[tool.icon] || Target;
            const bgImage = cardImages[tool.slug];
            const status = getToolStatus(tool);
            const assessment = getAssessment(tool.slug);
            const isLocked = status === 'locked';
            const isCompleted = status === 'completed';
            const scores = assessment?.scoresRaw?.normalized;

            return (
              <div
                key={tool.id}
                className={\`group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 \${
                  isLocked
                    ? 'bg-surface-container-lowest border border-outline-variant/10 opacity-70'
                    : 'bg-surface-container border border-outline-variant/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 cursor-pointer'
                }\`}
                onClick={() => !isLocked && handleToolAction(tool)}
              >
                {/* Card image */}
                <div className="relative h-40 overflow-hidden">
                  {bgImage ? (
                    <img
                      src={bgImage}
                      alt=""
                      className={\`absolute inset-0 w-full h-full object-cover transition-transform duration-500 \${
                        isLocked ? 'grayscale blur-[2px] opacity-40' : 'group-hover:scale-105'
                      }\`}
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{ background: \`linear-gradient(135deg, \${tool.color}33, \${tool.color}11)\` }}
                    />
                  )}

                  {/* Overlay */}
                  <div className={\`absolute inset-0 \${
                    isLocked
                      ? 'bg-surface/80'
                      : 'bg-gradient-to-t from-surface-container via-surface-container/50 to-transparent'
                  }\`} />

                  {/* Lock overlay */}
                  {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high/80 backdrop-blur-sm border border-outline-variant/30">
                          <Lock size={20} className="text-on-surface-variant" />
                        </div>
                        <span className="text-xs font-medium text-on-surface-variant bg-surface-container/80 backdrop-blur-sm px-3 py-1 rounded-full">
                          Em breve
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Status badge */}
                  {!isLocked && (
                    <div className="absolute top-3 right-3">
                      {isCompleted ? (
                        <span className="flex items-center gap-1 rounded-full bg-green-500/20 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-green-400 border border-green-500/20">
                          <CheckCircle2 size={10} /> Concluído
                        </span>
                      ) : status === 'awaiting_report' ? (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500/20 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
                          <Clock size={10} /> Aguardando relatório
                        </span>
                      ) : status === 'in_progress' ? (
                        <span className="flex items-center gap-1 rounded-full bg-blue-500/20 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-blue-400 border border-blue-500/20">
                          <Clock size={10} /> Em andamento
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-primary/20 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-primary border border-primary/20">
                          Disponível
                        </span>
                      )}
                    </div>
                  )}

                  {/* Icon */}
                  {!isLocked && (
                    <div className="absolute bottom-3 left-4">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
                        style={{ backgroundColor: tool.color + '33', borderColor: tool.color + '44', borderWidth: 1 }}
                      >
                        <Icon size={18} style={{ color: tool.color }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="flex-1 p-4 pt-2 space-y-3">
                  <div>
                    <h3 className={\`font-headline text-base font-bold \${isLocked ? 'text-on-surface-variant' : 'text-on-surface'}\`}>
                      {tool.name}
                    </h3>
                    <p className="mt-1 text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                      {tool.description}
                    </p>
                  </div>

                  {/* DISC scores preview */}
                  {isCompleted && scores && tool.slug === 'disc' && (
                    <div className="grid grid-cols-4 gap-2">
                      {['D', 'I', 'S', 'C'].map(dim => (
                        <div key={dim} className="text-center">
                          <div className="text-xs font-medium text-on-surface-variant mb-1">
                            {profileNames[dim]}
                          </div>
                          <div className="relative h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 rounded-full"
                              style={{
                                width: \`\${scores[dim] || 0}%\`,
                                backgroundColor: dim === 'D' ? '#E63946' : dim === 'I' ? '#F4A261' : dim === 'S' ? '#2A9D8F' : '#264653'
                              }}
                            />
                          </div>
                          <div className="mt-0.5 text-xs font-semibold text-on-surface">
                            {scores[dim] || 0}%
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action button */}
                  {!isLocked && (
                    <div className="pt-1">
                      {status === 'available' && (
                        <button className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors w-full justify-center">
                          Iniciar <ArrowRight size={14} />
                        </button>
                      )}
                      {status === 'in_progress' && (
                        <button className="flex items-center gap-2 rounded-xl bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-500/20 transition-colors w-full justify-center">
                          Continuar <ArrowRight size={14} />
                        </button>
                      )}
                      {status === 'completed' && (
                        <button className="flex items-center gap-2 rounded-xl bg-green-500/10 px-4 py-2 text-xs font-semibold text-green-400 hover:bg-green-500/20 transition-colors w-full justify-center">
                          Ver relatório <ArrowRight size={14} />
                        </button>
                      )}
                      {status === 'awaiting_report' && (
                        <div className="flex items-center gap-2 rounded-xl bg-amber-500/5 px-4 py-2 text-xs text-amber-400/70 w-full justify-center">
                          <Clock size={12} /> Seu relatório está sendo preparado
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Card */}
      <div className="relative rounded-2xl overflow-hidden bg-surface-container border border-outline-variant/20 p-8">
        <div className="absolute inset-0">
          <img
            src="/card-cta.jpg"
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-container via-surface-container/90 to-surface-container/70" />
        </div>
        <div className="relative max-w-lg">
          <h3 className="font-headline text-xl font-bold text-on-surface">
            Quer ir mais fundo?
          </h3>
          <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
            Que tal agendar uma sessão de devolutiva para explorar seus resultados?
          </p>
          <button className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-on-primary uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-lg">
            Solicitar sessão <ArrowRight size={14} />
          </button>
        </div>
        <div className="absolute right-8 bottom-0 hidden lg:block">
          <img
            src="/vanessa-hero.jpg"
            alt=""
            className="h-52 object-cover object-top opacity-40 mix-blend-luminosity"
          />
        </div>
      </div>
    </div>
  );
}
`);


// ============================================
// 3. FIX ACENTUAÇÃO — Seed de ferramentas
// ============================================

w('prisma/fix-acentuacao.cjs', [
  "const { PrismaClient } = require('@prisma/client');",
  "",
  "async function main() {",
  "  const prisma = new PrismaClient();",
  "",
  "  const updates = [",
  "    { slug: 'disc', name: 'An\\u00e1lise DISC', description: 'Descubra seu perfil comportamental DISC e entenda como voc\\u00ea se comunica, lidera e toma decis\\u00f5es.' },",
  "    { slug: 'roda-da-vida', name: 'Roda da Vida', description: 'Avalie sua satisfa\\u00e7\\u00e3o em 8 \\u00e1reas fundamentais da vida e identifique prioridades de desenvolvimento.' },",
  "    { slug: 'inteligencia-emocional', name: 'Intelig\\u00eancia Emocional', description: 'Avalie seus 5 pilares de intelig\\u00eancia emocional e receba um plano de desenvolvimento personalizado.' },",
  "    { slug: 'valores-pessoais', name: 'Valores Pessoais', description: 'Identifique e priorize seus valores fundamentais para tomar decis\\u00f5es mais alinhadas.' },",
  "    { slug: 'metas-smart', name: 'Metas SMART', description: 'Defina metas claras com apoio de IA e acompanhe seu progresso com plano de a\\u00e7\\u00e3o personalizado.' },",
  "    { slug: 'sabotadores', name: 'Sabotadores Internos', description: 'Identifique seus sabotadores internos e aprenda estrat\\u00e9gias para neutraliz\\u00e1-los.' },",
  "    { slug: 'diario', name: 'Di\\u00e1rio de Autoconhecimento', description: 'Journaling guiado com an\\u00e1lise de padr\\u00f5es por IA para acelerar seu autoconhecimento.' },",
  "  ];",
  "",
  "  for (const u of updates) {",
  "    try {",
  "      await prisma.tool.update({",
  "        where: { slug: u.slug },",
  "        data: { name: u.name, description: u.description },",
  "      });",
  "      console.log('OK:', u.slug, '-', u.name);",
  "    } catch (e) {",
  "      console.log('FAIL:', u.slug, '-', e.message);",
  "    }",
  "  }",
  "",
  "  await prisma.$disconnect();",
  "  console.log('Acentuacao corrigida!');",
  "}",
  "",
  "main();",
].join('\n'));


// ============================================
// 4. FIX ACENTUAÇÃO — Sidebar / AppLayout
// ============================================

// Read existing AppLayout and fix accents if possible
const layoutPath = 'src/components/AppLayout.jsx';
if (fs.existsSync(layoutPath)) {
  let content = fs.readFileSync(layoutPath, 'utf8');
  
  // Fix common accent issues
  content = content
    .replace(/Usuarios/g, 'Usuários')
    .replace(/Analise/g, 'Análise')
    .replace(/Relatorio/g, 'Relatório')
    .replace(/Relatorios/g, 'Relatórios')
    .replace(/Convites/g, 'Convites')
    .replace(/Ferramentas/g, 'Ferramentas')
    .replace(/Disponivel/g, 'Disponível')
    .replace(/Sessao/g, 'Sessão')
    .replace(/Padrao/g, 'Padrão')
    .replace(/Acao/g, 'Ação')
    .replace(/Informacao/g, 'Informação')
    .replace(/Questionario/g, 'Questionário')
    .replace(/Diario/g, 'Diário')
    .replace(/Inteligencia/g, 'Inteligência')
    .replace(/Avaliacao/g, 'Avaliação')
    .replace(/Avaliacoes/g, 'Avaliações');
  
  fs.writeFileSync(layoutPath, content, 'utf8');
  console.log('✓ AppLayout.jsx — acentuação corrigida');
} else {
  console.log('⚠ AppLayout.jsx não encontrado — corrija a acentuação manualmente');
}

// Fix accents in other admin pages
const adminPages = [
  'src/pages/AdminDashboard.jsx',
  'src/pages/AdminUsersPage.jsx',
  'src/pages/AdminAssessmentsPage.jsx',
  'src/pages/AdminInvitesPage.jsx',
];

for (const page of adminPages) {
  if (fs.existsSync(page)) {
    let content = fs.readFileSync(page, 'utf8');
    content = content
      .replace(/Usuarios/g, 'Usuários')
      .replace(/Analise DISC/g, 'Análise DISC')
      .replace(/Relatorio/g, 'Relatório')
      .replace(/Relatorios/g, 'Relatórios')
      .replace(/Avaliacoes/g, 'Avaliações')
      .replace(/Avaliacao/g, 'Avaliação')
      .replace(/Informacoes/g, 'Informações')
      .replace(/Informacao/g, 'Informação')
      .replace(/Questionario/g, 'Questionário')
      .replace(/Acao/g, 'Ação')
      .replace(/acoes/g, 'ações')
      .replace(/Nenhum usuario/g, 'Nenhum usuário')
      .replace(/usuario/g, 'usuário')
      .replace(/Disponivel/g, 'Disponível')
      .replace(/Numero/g, 'Número')
      .replace(/codigo/g, 'código')
      .replace(/convite valido/g, 'convite válido')
      .replace(/Sessao/g, 'Sessão')
      .replace(/sessao/g, 'sessão');
    fs.writeFileSync(page, content, 'utf8');
    console.log('✓', page, '— acentuação corrigida');
  }
}


console.log('\\n============================================');
console.log('  DISC Update — Concluído!');
console.log('============================================');
console.log('\\nArquivos atualizados:');
console.log('  ✓ AdminToolsPage.jsx — Cards Netflix com fotos');
console.log('  ✓ UserDashboard.jsx — Ferramentas bloqueadas com cadeado');
console.log('  ✓ Acentuação corrigida em todas as páginas');
console.log('\\nPróximos passos:');
console.log('');
console.log('  1. FRONTEND — Rode o script:');
console.log('     cd C:\\disc-system\\frontend');
console.log('     node disc-update.cjs');
console.log('');
console.log('  2. BACKEND — Corrija acentuação no banco:');
console.log('     cd C:\\disc-system\\backend');
console.log('     node prisma/fix-acentuacao.cjs');
console.log('');
console.log('  3. DEPLOY:');
console.log('     cd C:\\disc-system\\frontend');
console.log('     Remove-Item *.cjs');
console.log('     git add . && git commit -m "feat: admin cards netflix + ferramentas bloqueadas + acentuação" && git push');
console.log('');
console.log('     cd C:\\disc-system\\backend');
console.log('     git add . && git commit -m "fix: acentuação ferramentas" && git push');
