const fs = require('fs');
const path = require('path');
function w(f, c) {
  const d = path.dirname(f);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(f, c, 'utf8');
  console.log('OK:', f);
}

// 1. AdminDashboard - contagem real de relatórios
w('../frontend/src/pages/AdminDashboard.jsx', `import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { Users, ClipboardList, Link2, FileText } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
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
        setStats({
          totalUsers: usersData.pagination.total,
          totalAssessments: assessmentsData.pagination.total,
          activeInvites,
          totalReports: reportsCount,
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };
  const cards = [
    { label: 'Usuarios', value: stats?.totalUsers || 0, icon: Users, color: 'text-brand-600 bg-brand-50' },
    { label: 'Assessments', value: stats?.totalAssessments || 0, icon: ClipboardList, color: 'text-disc-s bg-emerald-50' },
    { label: 'Convites ativos', value: stats?.activeInvites || 0, icon: Link2, color: 'text-disc-i bg-amber-50' },
    { label: 'Relatorios', value: stats?.totalReports || 0, icon: FileText, color: 'text-disc-d bg-red-50' },
  ];

  return (
    <div>
      <div className="mb-8"><h1 className="font-display text-2xl text-gray-900">{greeting()}, {(user?.name||'').split(' ')[0]}</h1><p className="mt-1 text-sm text-gray-500">Visao geral do sistema</p></div>
      {loading ? <div className="flex items-center gap-2 text-sm text-gray-400"><div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />Carregando...</div> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(c => (
            <div key={c.label} className="card"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-gray-500">{c.label}</p><p className="mt-2 text-3xl font-semibold text-gray-900">{c.value}</p></div><div className={"rounded-lg p-2.5 "+c.color}><c.icon size={20} /></div></div></div>
          ))}
        </div>
      )}
    </div>
  );
}
`);

// 2. AdminAssessmentsPage - botão ver relatório para admin
w('../frontend/src/pages/AdminAssessmentsPage.jsx', `import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
            const hasReport = !!a.report;

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

                    {/* Botão ver relatório para admin */}
                    {hasReport && (
                      <div className="mb-4">
                        <button onClick={(e) => { e.stopPropagation(); navigate('/report/' + a.id); }} className="btn-primary gap-2">
                          <Eye size={14}/>Ver Relatorio Completo
                        </button>
                      </div>
                    )}

                    {canRelease && (
                      <div className="border-t border-gray-100 pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Liberar Assessment</h4>
                        <textarea className="input-field mb-3" rows={2} placeholder="Nota para a IA (opcional) - ex: foco em lideranca, contexto de transicao de carreira..."
                          value={adminNotes} onChange={e => setAdminNotes(e.target.value)}/>
                        <button onClick={() => release(a.id)} disabled={releasing === a.id} className="btn-primary gap-2">
                          {releasing === a.id ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"/> : <Unlock size={14}/>}
                          Liberar e Gerar Relatorio
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

// 3. UserDashboard - mostra link para relatório quando gerado
w('../frontend/src/pages/UserDashboard.jsx', `import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { ClipboardList, ArrowRight, CheckCircle2, Eye, FileText } from 'lucide-react';

const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const d = await api.get('/assessments/mine'); setAssessments(d.assessments); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const greeting = () => { const h = new Date().getHours(); return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'; };

  const latestCompleted = assessments.find(a => a.status !== 'IN_PROGRESS');
  const inProgress = assessments.find(a => a.status === 'IN_PROGRESS');
  const hasTest = !!latestCompleted;
  const hasReport = !!latestCompleted?.report;

  const statusText = {
    COMPLETED: 'Aguardando liberacao do coach',
    REVIEWED: 'Em revisao pelo coach',
    RELEASED: 'Liberado - relatorio disponivel',
    REPORT_GENERATED: 'Relatorio pronto para visualizacao',
  };

  return (
    <div>
      <div className="mb-8"><h1 className="font-display text-2xl text-gray-900">{greeting()}, {(user?.name||'').split(' ')[0]}</h1><p className="mt-1 text-sm text-gray-500">Bem-vindo a plataforma de analise comportamental</p></div>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card do Teste */}
        <div className="card flex flex-col items-center py-10 text-center">
          <div className={"mb-4 rounded-xl p-4 " + (hasTest ? "bg-green-50 text-green-600" : "bg-brand-50 text-brand-600")}>
            {hasTest ? <CheckCircle2 size={32}/> : <ClipboardList size={32}/>}
          </div>
          <h3 className="font-display text-lg text-gray-900">
            {hasTest ? 'Teste Concluido' : inProgress ? 'Teste em Andamento' : 'Questionario Comportamental'}
          </h3>
          {hasTest ? (
            <>
              <div className="flex gap-3 mt-3">
                {['D','I','S','C'].map(f => {
                  const scores = latestCompleted.scoresRaw?.normalized;
                  return scores ? (
                    <div key={f} className="text-center">
                      <div className={"text-xs font-bold " + (f==='D'?'text-disc-d':f==='I'?'text-disc-i':f==='S'?'text-disc-s':'text-disc-c')}>{profileNames[f]}</div>
                      <div className="text-sm font-semibold text-gray-900">{scores[f]}%</div>
                    </div>
                  ) : null;
                })}
              </div>
              {latestCompleted.profilePrimary && (
                <p className="mt-2 text-sm text-gray-600">Perfil: <span className="font-semibold">{profileNames[latestCompleted.profilePrimary]} / {profileNames[latestCompleted.profileSecondary]}</span></p>
              )}
              <p className="mt-2 text-xs text-gray-400">{statusText[latestCompleted.status] || latestCompleted.status}</p>
            </>
          ) : (
            <>
              <p className="mt-2 max-w-xs text-sm text-gray-500">
                {inProgress ? 'Voce tem um teste em andamento. Continue de onde parou.' : 'Responda o questionario para descobrir seu perfil comportamental. Leva cerca de 10 minutos.'}
              </p>
              <button onClick={() => navigate('/quiz')} className="btn-primary mt-6 gap-2">
                {inProgress ? 'Continuar Teste' : 'Iniciar Teste'} <ArrowRight size={16}/>
              </button>
            </>
          )}
        </div>

        {/* Card do Relatório */}
        <div className="card flex flex-col items-center py-10 text-center">
          <div className={"mb-4 rounded-xl p-4 " + (hasReport ? "bg-brand-50 text-brand-600" : "bg-gray-100 text-gray-400")}>
            {hasReport ? <FileText size={32}/> : (
              <svg width="32" height="32" viewBox="0 0 100 100"><polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="currentColor" strokeWidth="2"/><polygon points="50,20 80,35 80,65 50,80 20,65 20,35" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1"/></svg>
            )}
          </div>
          <h3 className="font-display text-lg text-gray-900">
            {hasReport ? 'Relatorio Disponivel' : 'Meu Relatorio'}
          </h3>
          {hasReport ? (
            <>
              <p className="mt-2 max-w-xs text-sm text-gray-500">Seu relatorio personalizado esta pronto! Clique abaixo para visualizar sua analise completa.</p>
              <button onClick={() => navigate('/report/' + latestCompleted.id)} className="btn-primary mt-6 gap-2"><Eye size={16}/>Ver Relatorio</button>
            </>
          ) : (
            <>
              <p className="mt-2 max-w-xs text-sm text-gray-500">
                {hasTest ? 'Aguarde a liberacao do seu coach para acessar seu relatorio personalizado.' : 'Apos completar o questionario e a liberacao do seu coach, seu relatorio ficara disponivel aqui.'}
              </p>
              <button onClick={() => navigate('/dashboard/assessments')} className="btn-secondary mt-6 gap-2">Ver Meus Testes <ArrowRight size={16}/></button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
`);

// 4. ReportPage - remover "Analise gerada por IA"
w('../frontend/src/pages/ReportPage.jsx', `import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { ArrowLeft, Star, AlertTriangle, MessageCircle, Briefcase, TrendingUp, Users } from 'lucide-react';

const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };
const profileColors = { D: '#E63946', I: '#F4A261', S: '#2A9D8F', C: '#264653' };

function RadarChart({ scores }) {
  const size = 280;
  const center = size / 2;
  const radius = 110;
  const factors = ['D', 'I', 'S', 'C'];
  const angles = factors.map((_, i) => (Math.PI * 2 * i) / 4 - Math.PI / 2);
  const getPoint = (angle, value) => ({
    x: center + Math.cos(angle) * (radius * value / 100),
    y: center + Math.sin(angle) * (radius * value / 100),
  });
  const dataPoints = factors.map((f, i) => getPoint(angles[i], scores[f]));
  const polygon = dataPoints.map(p => p.x + ',' + p.y).join(' ');

  return (
    <svg viewBox={"0 0 " + size + " " + size} className="w-full max-w-[280px] mx-auto">
      {[25, 50, 75, 100].map(v => (
        <polygon key={v} points={factors.map((_, i) => { const p = getPoint(angles[i], v); return p.x+','+p.y; }).join(' ')} fill="none" stroke="#e5e7eb" strokeWidth="1" />
      ))}
      {factors.map((_, i) => { const p = getPoint(angles[i], 100); return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#e5e7eb" strokeWidth="1" />; })}
      <polygon points={polygon} fill="rgba(76, 110, 245, 0.15)" stroke="#4c6ef5" strokeWidth="2.5" />
      {factors.map((f, i) => {
        const p = dataPoints[i];
        const lp = getPoint(angles[i], 120);
        return (
          <g key={f}>
            <circle cx={p.x} cy={p.y} r="5" fill={profileColors[f]} />
            <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill={profileColors[f]}>{profileNames[f]}</text>
            <text x={lp.x} y={lp.y + 14} textAnchor="middle" fontSize="10" fill="#6b7280">{scores[f]}%</text>
          </g>
        );
      })}
    </svg>
  );
}

function Section({ icon: Icon, title, children, color = 'text-brand-600 bg-brand-50' }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className={"rounded-lg p-1.5 " + color}><Icon size={16} /></div>
        <h3 className="font-display text-lg text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function ReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const endpoint = isAdmin ? '/admin/assessments/' + id + '/report' : '/assessments/' + id + '/report';
        const d = await api.get(endpoint);
        setData(d);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [id, isAdmin]);

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"/></div>;
  if (error) return <div className="p-8"><div className="card text-center py-12"><p className="text-red-600">{error}</p><button onClick={() => navigate(-1)} className="btn-secondary mt-4 gap-2"><ArrowLeft size={16}/>Voltar</button></div></div>;

  const { report, scores, profilePrimary, profileSecondary, userName } = data;
  const n = report.narrative;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="btn-secondary gap-1"><ArrowLeft size={16}/>Voltar</button>
        </div>

        {/* Title Card */}
        <div className="card mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-2">Analise Comportamental</p>
          <h1 className="font-display text-2xl text-gray-900 mb-1">{userName}</h1>
          <p className="text-sm text-gray-500">Perfil: <span className="font-semibold" style={{color: profileColors[profilePrimary]}}>{profileNames[profilePrimary]}</span> / <span className="font-semibold" style={{color: profileColors[profileSecondary]}}>{profileNames[profileSecondary]}</span></p>
          <div className="mt-6"><RadarChart scores={scores} /></div>
        </div>

        <div className="card mb-6">
          <h2 className="font-display text-xl text-gray-900 mb-3">Resumo do Perfil</h2>
          <p className="text-sm leading-relaxed text-gray-700">{n.resumoExecutivo}</p>
        </div>

        <div className="card mb-6">
          <h2 className="font-display text-xl text-gray-900 mb-3">Perfil Detalhado</h2>
          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{n.perfilDetalhado?.descricao}</p>
          {n.perfilDetalhado?.palavrasChave && (
            <div className="flex flex-wrap gap-2 mt-4">
              {n.perfilDetalhado.palavrasChave.map((p, i) => (
                <span key={i} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">{p}</span>
              ))}
            </div>
          )}
        </div>

        <div className="card mb-6">
          <Section icon={Star} title="Pontos Fortes" color="text-green-600 bg-green-50">
            <div className="space-y-3">
              {(n.pontosFortes || []).map((p, i) => (
                <div key={i} className="rounded-lg bg-green-50/50 border border-green-100 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">{p.titulo || p}</p>
                  {p.descricao && <p className="text-xs text-gray-600 mt-1">{p.descricao}</p>}
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="card mb-6">
          <Section icon={AlertTriangle} title="Areas de Atencao" color="text-amber-600 bg-amber-50">
            <div className="space-y-3">
              {(n.areasAtencao || []).map((a, i) => (
                <div key={i} className="rounded-lg bg-amber-50/50 border border-amber-100 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">{a.titulo || a}</p>
                  {a.descricao && <p className="text-xs text-gray-600 mt-1">{a.descricao}</p>}
                </div>
              ))}
            </div>
          </Section>
        </div>

        {n.estiloComunicacao && (
          <div className="card mb-6">
            <Section icon={MessageCircle} title="Estilo de Comunicacao" color="text-disc-i bg-orange-50">
              <div className="space-y-4 text-sm text-gray-700">
                <div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Como se expressa</p><p className="leading-relaxed">{n.estiloComunicacao.comoSeExprime}</p></div>
                <div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Como prefere receber informacoes</p><p className="leading-relaxed">{n.estiloComunicacao.comoPrefereceber}</p></div>
                {n.estiloComunicacao.dicasParaOutros && <div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Dicas para quem convive</p><p className="leading-relaxed">{n.estiloComunicacao.dicasParaOutros}</p></div>}
              </div>
            </Section>
          </div>
        )}

        {n.ambiente && (
          <div className="card mb-6">
            <Section icon={Briefcase} title="Ambiente e Trabalho" color="text-disc-s bg-teal-50">
              <div className="space-y-4 text-sm text-gray-700">
                <div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Ambiente ideal</p><p className="leading-relaxed">{n.ambiente.idealDeTrabalho}</p></div>
                <div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Fatores de estresse</p><p className="leading-relaxed">{n.ambiente.fatoresEstresse}</p></div>
                {n.ambiente.comoLidaComMudancas && <div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Relacao com mudancas</p><p className="leading-relaxed">{n.ambiente.comoLidaComMudancas}</p></div>}
              </div>
            </Section>
          </div>
        )}

        {n.lideranca && (
          <div className="card mb-6">
            <Section icon={Users} title="Lideranca" color="text-disc-d bg-red-50">
              <div className="space-y-4 text-sm text-gray-700">
                <div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Estilo de lideranca</p><p className="leading-relaxed">{n.lideranca.estilo}</p></div>
                {n.lideranca.comoMotiva && <div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Como motiva outros</p><p className="leading-relaxed">{n.lideranca.comoMotiva}</p></div>}
              </div>
            </Section>
          </div>
        )}

        {n.desenvolvimento && (
          <div className="card mb-6">
            <Section icon={TrendingUp} title="Desenvolvimento" color="text-purple-600 bg-purple-50">
              {n.desenvolvimento.recomendacoes && (
                <div className="mb-4">
                  <p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-2">Recomendacoes</p>
                  <ul className="space-y-2">
                    {n.desenvolvimento.recomendacoes.map((r, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700"><span className="text-brand-600 font-bold mt-0.5">•</span><span>{r}</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {n.desenvolvimento.acoesPraticas && (
                <div>
                  <p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-2">Acoes praticas</p>
                  <ul className="space-y-2">
                    {n.desenvolvimento.acoesPraticas.map((a, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700"><span className="text-green-600 font-bold mt-0.5">{i + 1}.</span><span>{a}</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>
          </div>
        )}

        {/* Footer - sem menção a IA */}
        <div className="text-center text-xs text-gray-400 py-4">
          <p>Vanessa Rocha - Analise Comportamental</p>
          <p className="mt-1">Gerado em {new Date(report.generatedAt).toLocaleDateString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );
}
`);

console.log('\\n============================================');
console.log('  Correcoes aplicadas!');
console.log('============================================');
console.log('- Dashboard admin: contagem real de relatorios');
console.log('- Admin Assessments: botao "Ver Relatorio Completo"');
console.log('- Dashboard usuario: card "Relatorio Disponivel" com botao');
console.log('- Footer do relatorio: sem mencao a IA');
