/**
 * ═══════════════════════════════════════════════════════════════
 * DISC Platform — Dark Theme Migration Script
 * ═══════════════════════════════════════════════════════════════
 * 
 * Migra 3 páginas do tema light (text-gray-*) para o design
 * system dark consistente com o resto da plataforma.
 * 
 * Páginas afetadas:
 *   1. UserAssessmentsPage.jsx — 15 ocorrências
 *   2. QuizPage.jsx — 12 ocorrências  
 *   3. ReportPage.jsx — 20+ ocorrências
 * 
 * Execução:
 *   cd C:\disc-system\frontend
 *   node dark-theme-migration.cjs
 * 
 * Gerado pelo Conselho de Governança Técnica — 2026-04-05
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, 'src', 'pages');

function writeFile(filename, content) {
  const filepath = path.join(BASE, filename);
  
  // Backup
  const backupPath = filepath + '.bak-' + Date.now();
  if (fs.existsSync(filepath)) {
    fs.copyFileSync(filepath, backupPath);
    console.log(`  ✓ Backup: ${path.basename(backupPath)}`);
  }
  
  fs.writeFileSync(filepath, content, 'utf-8');
  console.log(`  ✓ Escrito: ${filename}`);
}

// ═══════════════════════════════════════════════════════════════
// 1. UserAssessmentsPage.jsx
// ═══════════════════════════════════════════════════════════════
console.log('\n[1/3] UserAssessmentsPage.jsx');

const userAssessmentsPage = `import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ClipboardList, CheckCircle2, Eye, ArrowRight, Plus, TrendingUp } from 'lucide-react';

const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };
const profileColors = { D: '#E63946', I: '#F4A261', S: '#2A9D8F', C: '#264653' };
const statusLabels = {
  IN_PROGRESS: { text: 'Em andamento', color: 'bg-amber-500/15 text-amber-400' },
  COMPLETED: { text: 'Aguardando liberacao', color: 'bg-blue-500/15 text-blue-400' },
  REVIEWED: { text: 'Em revisao', color: 'bg-purple-500/15 text-purple-400' },
  RELEASED: { text: 'Liberado', color: 'bg-emerald-500/15 text-emerald-400' },
  REPORT_GENERATED: { text: 'Relatorio pronto', color: 'bg-primary/15 text-primary' },
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

  const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' });

  const completedTests = assessments.filter(a => a.status !== 'IN_PROGRESS');
  const inProgress = assessments.find(a => a.status === 'IN_PROGRESS');
  const canStartNew = !inProgress;

  const hasEvolution = completedTests.length > 1;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">Meus Testes</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Acompanhe seus assessments comportamentais</p>
        </div>
        {canStartNew && (
          <button onClick={() => navigate('/quiz')} className="btn-primary gap-2"><Plus size={16}/>Novo Teste</button>
        )}
      </div>

      {justCompleted && (
        <div className="mb-6 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 border border-emerald-500/20 flex items-center gap-2">
          <CheckCircle2 size={16}/> Teste concluido com sucesso! Aguarde a liberacao para ver seu relatorio completo.
        </div>
      )}

      {hasEvolution && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-lg p-1.5 text-purple-400 bg-purple-500/15"><TrendingUp size={16}/></div>
            <h3 className="font-headline text-base font-semibold text-on-surface">Evolucao</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant/50">Data</th>
                  {['D','I','S','C'].map(f => (
                    <th key={f} className="px-3 py-2 text-center text-xs font-medium" style={{color: profileColors[f]}}>{profileNames[f]}</th>
                  ))}
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant/50">Perfil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {completedTests.slice().reverse().map((a, idx) => {
                  const scores = a.scoresRaw?.normalized;
                  const prev = idx < completedTests.length - 1 ? completedTests.slice().reverse()[idx + 1]?.scoresRaw?.normalized : null;
                  return (
                    <tr key={a.id} className="hover:bg-surface-container-high/50 transition-colors">
                      <td className="px-3 py-2 text-xs text-on-surface-variant">{fmtDate(a.completedAt || a.createdAt)}</td>
                      {['D','I','S','C'].map(f => {
                        const val = scores?.[f] || 0;
                        const diff = prev ? val - (prev[f] || 0) : null;
                        return (
                          <td key={f} className="px-3 py-2 text-center">
                            <span className="text-sm font-semibold text-on-surface">{val}%</span>
                            {diff !== null && diff !== 0 && (
                              <span className={"ml-1 text-[10px] font-medium " + (diff > 0 ? 'text-emerald-400' : 'text-red-400')}>
                                {diff > 0 ? '+' : ''}{diff}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-xs font-medium text-on-surface-variant">
                        {a.profilePrimary ? profileNames[a.profilePrimary] + '/' + profileNames[a.profileSecondary] : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card flex items-center justify-center py-12 text-on-surface-variant/40"><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"/>Carregando...</div>
      ) : assessments.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="mb-4 rounded-xl bg-primary/15 p-4 text-primary"><ClipboardList size={32}/></div>
          <h3 className="font-headline text-lg font-semibold text-on-surface">Nenhum teste realizado</h3>
          <p className="mt-2 max-w-xs text-sm text-on-surface-variant">Clique abaixo para iniciar seu questionario comportamental.</p>
          <button onClick={() => navigate('/quiz')} className="btn-primary mt-6 gap-2">Iniciar Teste <ArrowRight size={16}/></button>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map(a => {
            const st = statusLabels[a.status] || statusLabels.IN_PROGRESS;
            const scores = a.scoresRaw?.normalized;
            const isInProgress = a.status === 'IN_PROGRESS';

            return (
              <div key={a.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium " + st.color}>{st.text}</span>
                    <span className="text-xs text-on-surface-variant/50">{fmtDate(a.createdAt)}</span>
                  </div>
                  {isInProgress && <p className="text-sm text-on-surface-variant mt-1">Teste em andamento.</p>}
                  {scores && (
                    <div className="flex gap-3 mt-2">
                      {['D','I','S','C'].map(f => (
                        <div key={f} className="text-center">
                          <div className={"text-xs font-bold " + (f==='D'?'text-disc-d':f==='I'?'text-disc-i':f==='S'?'text-disc-s':'text-disc-c')}>{profileNames[f]}</div>
                          <div className="text-sm font-semibold text-on-surface">{scores[f]}%</div>
                        </div>
                      ))}
                      {a.profilePrimary && <div className="ml-2 text-xs text-on-surface-variant self-center">Perfil: <span className="font-semibold text-on-surface">{profileNames[a.profilePrimary]}/{profileNames[a.profileSecondary]}</span></div>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isInProgress && <button onClick={() => navigate('/quiz')} className="btn-primary !py-1.5 !px-3 !text-xs gap-1"><ArrowRight size={12}/>Continuar</button>}
                  {a.report && <button onClick={() => navigate('/report/' + a.id)} className="btn-primary !py-1.5 !px-3 !text-xs gap-1"><Eye size={12}/>Ver Relatorio</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
`;

writeFile('UserAssessmentsPage.jsx', userAssessmentsPage);

// ═══════════════════════════════════════════════════════════════
// 2. QuizPage.jsx
// ═══════════════════════════════════════════════════════════════
console.log('\n[2/3] QuizPage.jsx');

const quizPage = `import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';

export default function QuizPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [assessmentId, setAssessmentId] = useState(null);
  const [currentGroup, setCurrentGroup] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [qData, aData] = await Promise.all([
          api.get('/assessments/questions'),
          api.post('/assessments', {}),
        ]);
        setQuestions(qData.questions);
        setAssessmentId(aData.assessment.id);
        if (aData.resumed && aData.assessment.responses) {
          const saved = {};
          for (const r of aData.assessment.responses) {
            saved[r.groupIndex] = { most: r.most, least: r.least };
          }
          setResponses(saved);
        }
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  const current = questions[currentGroup];
  const resp = responses[currentGroup] || { most: null, least: null };
  const isGroupComplete = resp.most && resp.least;
  const answeredCount = Object.keys(responses).filter(k => responses[k].most && responses[k].least).length;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const selectWord = (wordId, type) => {
    const cur = responses[currentGroup] || { most: null, least: null };
    const other = type === 'most' ? 'least' : 'most';
    if (cur[other] === wordId) return;
    setResponses({ ...responses, [currentGroup]: { ...cur, [type]: wordId } });
  };

  const submit = async () => {
    setSubmitting(true); setError('');
    try {
      const formatted = Object.entries(responses).map(([gi, r]) => ({
        groupIndex: parseInt(gi), most: r.most, least: r.least,
      }));
      await api.post('/assessments/' + assessmentId + '/submit', { responses: formatted });
      navigate('/dashboard/assessments?completed=true');
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-surface"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"/></div>;

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="font-headline text-2xl font-bold text-on-surface">Questionario DISC</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Escolha a palavra que MAIS e a que MENOS descreve voce em cada grupo</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-on-surface-variant mb-1.5">
            <span>Progresso</span>
            <span>{answeredCount} de {questions.length}</span>
          </div>
          <div className="h-2 rounded-full bg-surface-container-highest">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{width: progress + '%'}} />
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">{error}</div>}

        {current && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-on-surface-variant">Grupo {currentGroup + 1} de {questions.length}</span>
              {isGroupComplete && <span className="flex items-center gap-1 text-xs font-medium text-emerald-400"><Check size={14}/>Completo</span>}
            </div>

            {/* Header row */}
            <div className="flex items-center mb-3 px-4">
              <div className="flex-1"></div>
              <div className="w-10 text-center text-xs font-semibold text-primary uppercase tracking-wider">Mais</div>
              <div className="w-4"></div>
              <div className="w-10 text-center text-xs font-semibold text-red-400 uppercase tracking-wider">Menos</div>
            </div>

            {/* Word rows */}
            {current.words.map(word => {
              const isMost = resp.most === word.id;
              const isLeast = resp.least === word.id;
              return (
                <div key={word.id} className={"flex items-center rounded-xl border px-4 py-3 mb-2 transition-all " + (isMost ? "border-primary/40 bg-primary/10" : isLeast ? "border-red-500/40 bg-red-500/10" : "border-outline-variant/20 hover:border-outline-variant/40")}>
                  <div className="flex-1 text-sm font-medium text-on-surface">{word.text}</div>
                  <button onClick={() => selectWord(word.id, 'most')}
                    className={"flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all " + (isMost ? "border-primary bg-primary" : "border-outline-variant/40 hover:border-primary/60")}>
                    {isMost && <Check size={14} className="text-on-primary"/>}
                  </button>
                  <div className="w-4"></div>
                  <button onClick={() => selectWord(word.id, 'least')}
                    className={"flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all " + (isLeast ? "border-red-500 bg-red-500" : "border-outline-variant/40 hover:border-red-400/60")}>
                    {isLeast && <Check size={14} className="text-white"/>}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentGroup(Math.max(0, currentGroup - 1))} disabled={currentGroup === 0}
            className="btn-secondary gap-1 disabled:opacity-40"><ChevronLeft size={16}/>Anterior</button>

          {currentGroup < questions.length - 1 ? (
            <button onClick={() => setCurrentGroup(currentGroup + 1)}
              className="btn-primary gap-1">Proximo <ChevronRight size={16}/></button>
          ) : (
            <button onClick={submit} disabled={submitting || answeredCount < questions.length}
              className="btn-primary gap-2 disabled:opacity-40">
              {submitting ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>}
              Finalizar
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-1.5">
          {questions.map((_, i) => {
            const done = responses[i]?.most && responses[i]?.least;
            return (
              <button key={i} onClick={() => setCurrentGroup(i)}
                className={"h-3 w-3 rounded-full transition-all " + (i === currentGroup ? "bg-primary scale-125" : done ? "bg-emerald-400" : "bg-surface-container-highest hover:bg-outline-variant")}
                title={"Grupo " + (i + 1)} />
            );
          })}
        </div>
      </div>
    </div>
  );
}
`;

writeFile('QuizPage.jsx', quizPage);

// ═══════════════════════════════════════════════════════════════
// 3. ReportPage.jsx
// ═══════════════════════════════════════════════════════════════
console.log('\n[3/3] ReportPage.jsx');

const reportPage = `import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { ArrowLeft, Download, Star, AlertTriangle, MessageCircle, Briefcase, TrendingUp, Users, Loader2 } from 'lucide-react';

const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };
const profileColors = { D: '#E63946', I: '#F4A261', S: '#2A9D8F', C: '#264653' };

function RadarChart({ scores }) {
  const size = 280; const center = size / 2; const radius = 110;
  const factors = ['D', 'I', 'S', 'C'];
  const angles = factors.map((_, i) => (Math.PI * 2 * i) / 4 - Math.PI / 2);
  const getPoint = (angle, value) => ({ x: center + Math.cos(angle) * (radius * value / 100), y: center + Math.sin(angle) * (radius * value / 100) });
  const dataPoints = factors.map((f, i) => getPoint(angles[i], scores[f]));
  const polygon = dataPoints.map(p => p.x + ',' + p.y).join(' ');
  return (
    <svg viewBox={"0 0 " + size + " " + size} className="w-full max-w-[280px] mx-auto">
      {[25,50,75,100].map(v => <polygon key={v} points={factors.map((_,i)=>{const p=getPoint(angles[i],v);return p.x+','+p.y;}).join(' ')} fill="none" stroke="rgba(61,56,48,0.5)" strokeWidth="1"/>)}
      {factors.map((_,i)=>{const p=getPoint(angles[i],100);return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="rgba(61,56,48,0.5)" strokeWidth="1"/>;})}
      <polygon points={polygon} fill="rgba(212,168,83,0.15)" stroke="#d4a853" strokeWidth="2.5"/>
      {factors.map((f,i)=>{const p=dataPoints[i];const lp=getPoint(angles[i],120);return(<g key={f}><circle cx={p.x} cy={p.y} r="5" fill={profileColors[f]}/><text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill={profileColors[f]}>{profileNames[f]}</text><text x={lp.x} y={lp.y+14} textAnchor="middle" fontSize="10" fill="#bfb5a8">{scores[f]}%</text></g>);})}
    </svg>
  );
}

function Section({ icon: Icon, title, children, color = 'text-primary bg-primary/15' }) {
  return (<div className="mb-6"><div className="flex items-center gap-2 mb-3"><div className={"rounded-lg p-1.5 "+color}><Icon size={16}/></div><h3 className="font-headline text-lg font-semibold text-on-surface">{title}</h3></div>{children}</div>);
}

export default function ReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const endpoint = isAdmin ? '/admin/assessments/' + id + '/report' : '/assessments/' + id + '/report';
        setData(await api.get(endpoint));
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [id, isAdmin]);

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const token = api.getToken();
      const res = await fetch('/api/reports/' + id + '/pdf', { headers: { 'Authorization': 'Bearer ' + token } });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Erro ao gerar PDF'); }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'relatorio-disc.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) { alert('Erro ao baixar PDF: ' + e.message); }
    finally { setDownloading(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-surface"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"/></div>;
  if (error) return <div className="p-8"><div className="card text-center py-12"><p className="text-red-400">{error}</p><button onClick={() => navigate(-1)} className="btn-secondary mt-4 gap-2"><ArrowLeft size={16}/>Voltar</button></div></div>;

  const { report, scores, profilePrimary, profileSecondary, userName } = data;
  const n = report.narrative;

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="btn-secondary gap-1"><ArrowLeft size={16}/>Voltar</button>
          <button onClick={downloadPDF} disabled={downloading} className="btn-primary gap-2">
            {downloading ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}
            Baixar PDF
          </button>
        </div>

        <div className="card mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant/50 mb-2">Analise Comportamental</p>
          <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">{userName}</h1>
          <p className="text-sm text-on-surface-variant">Perfil: <span className="font-semibold" style={{color:profileColors[profilePrimary]}}>{profileNames[profilePrimary]}</span> / <span className="font-semibold" style={{color:profileColors[profileSecondary]}}>{profileNames[profileSecondary]}</span></p>
          <div className="mt-6"><RadarChart scores={scores}/></div>
        </div>

        <div className="card mb-6"><h2 className="font-headline text-xl font-semibold text-on-surface mb-3">Resumo do Perfil</h2><p className="text-sm leading-relaxed text-on-surface-variant">{n.resumoExecutivo}</p></div>

        <div className="card mb-6"><h2 className="font-headline text-xl font-semibold text-on-surface mb-3">Perfil Detalhado</h2><p className="text-sm leading-relaxed text-on-surface-variant whitespace-pre-line">{n.perfilDetalhado?.descricao}</p>
          {n.perfilDetalhado?.palavrasChave && <div className="flex flex-wrap gap-2 mt-4">{n.perfilDetalhado.palavrasChave.map((p,i)=><span key={i} className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">{p}</span>)}</div>}
        </div>

        <div className="card mb-6"><Section icon={Star} title="Pontos Fortes" color="text-emerald-400 bg-emerald-500/15"><div className="space-y-3">{(n.pontosFortes||[]).map((p,i)=><div key={i} className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 px-4 py-3"><p className="text-sm font-semibold text-on-surface">{p.titulo||p}</p>{p.descricao&&<p className="text-xs text-on-surface-variant mt-1">{p.descricao}</p>}</div>)}</div></Section></div>

        <div className="card mb-6"><Section icon={AlertTriangle} title="Areas de Atencao" color="text-amber-400 bg-amber-500/15"><div className="space-y-3">{(n.areasAtencao||[]).map((a,i)=><div key={i} className="rounded-xl bg-amber-500/5 border border-amber-500/15 px-4 py-3"><p className="text-sm font-semibold text-on-surface">{a.titulo||a}</p>{a.descricao&&<p className="text-xs text-on-surface-variant mt-1">{a.descricao}</p>}</div>)}</div></Section></div>

        {n.estiloComunicacao && <div className="card mb-6"><Section icon={MessageCircle} title="Estilo de Comunicacao" color="text-disc-i bg-orange-500/15"><div className="space-y-4 text-sm text-on-surface-variant"><div><p className="font-semibold text-on-surface text-xs uppercase tracking-wide mb-1">Como se expressa</p><p className="leading-relaxed">{n.estiloComunicacao.comoSeExprime}</p></div><div><p className="font-semibold text-on-surface text-xs uppercase tracking-wide mb-1">Como prefere receber informacoes</p><p className="leading-relaxed">{n.estiloComunicacao.comoPrefereceber}</p></div>{n.estiloComunicacao.dicasParaOutros&&<div><p className="font-semibold text-on-surface text-xs uppercase tracking-wide mb-1">Dicas para quem convive</p><p className="leading-relaxed">{n.estiloComunicacao.dicasParaOutros}</p></div>}</div></Section></div>}

        {n.ambiente && <div className="card mb-6"><Section icon={Briefcase} title="Ambiente e Trabalho" color="text-disc-s bg-teal-500/15"><div className="space-y-4 text-sm text-on-surface-variant"><div><p className="font-semibold text-on-surface text-xs uppercase tracking-wide mb-1">Ambiente ideal</p><p className="leading-relaxed">{n.ambiente.idealDeTrabalho}</p></div><div><p className="font-semibold text-on-surface text-xs uppercase tracking-wide mb-1">Fatores de estresse</p><p className="leading-relaxed">{n.ambiente.fatoresEstresse}</p></div>{n.ambiente.comoLidaComMudancas&&<div><p className="font-semibold text-on-surface text-xs uppercase tracking-wide mb-1">Relacao com mudancas</p><p className="leading-relaxed">{n.ambiente.comoLidaComMudancas}</p></div>}</div></Section></div>}

        {n.lideranca && <div className="card mb-6"><Section icon={Users} title="Lideranca" color="text-disc-d bg-red-500/15"><div className="space-y-4 text-sm text-on-surface-variant"><div><p className="font-semibold text-on-surface text-xs uppercase tracking-wide mb-1">Estilo de lideranca</p><p className="leading-relaxed">{n.lideranca.estilo}</p></div>{n.lideranca.comoMotiva&&<div><p className="font-semibold text-on-surface text-xs uppercase tracking-wide mb-1">Como motiva outros</p><p className="leading-relaxed">{n.lideranca.comoMotiva}</p></div>}</div></Section></div>}

        {n.desenvolvimento && <div className="card mb-6"><Section icon={TrendingUp} title="Desenvolvimento" color="text-purple-400 bg-purple-500/15">{n.desenvolvimento.recomendacoes&&<div className="mb-4"><p className="font-semibold text-on-surface text-xs uppercase tracking-wide mb-2">Recomendacoes</p><ul className="space-y-2">{n.desenvolvimento.recomendacoes.map((r,i)=><li key={i} className="flex gap-2 text-sm text-on-surface-variant"><span className="text-primary font-bold mt-0.5">{"\u2022"}</span><span>{r}</span></li>)}</ul></div>}{n.desenvolvimento.acoesPraticas&&<div><p className="font-semibold text-on-surface text-xs uppercase tracking-wide mb-2">Acoes praticas</p><ul className="space-y-2">{n.desenvolvimento.acoesPraticas.map((a,i)=><li key={i} className="flex gap-2 text-sm text-on-surface-variant"><span className="text-emerald-400 font-bold mt-0.5">{i+1}.</span><span>{a}</span></li>)}</ul></div>}</Section></div>}

        <div className="text-center text-xs text-on-surface-variant/40 py-4"><p>Vanessa Rocha - Analise Comportamental</p><p className="mt-1">Gerado em {new Date(report.generatedAt).toLocaleDateString('pt-BR')}</p></div>
      </div>
    </div>
  );
}
`;

writeFile('ReportPage.jsx', reportPage);

// ═══════════════════════════════════════════════════════════════
// Resumo
// ═══════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════════');
console.log('✅ Migração dark theme concluída!');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log('Arquivos modificados:');
console.log('  • UserAssessmentsPage.jsx — status badges + tabela + textos');
console.log('  • QuizPage.jsx — bg-gray-50→bg-surface, progress bar, word rows');
console.log('  • ReportPage.jsx — radar chart, sections, badges, textos');
console.log('');
console.log('Mapeamento aplicado:');
console.log('  text-gray-900  → text-on-surface');
console.log('  text-gray-700  → text-on-surface-variant');
console.log('  text-gray-600  → text-on-surface-variant');
console.log('  text-gray-500  → text-on-surface-variant');
console.log('  text-gray-400  → text-on-surface-variant/50');
console.log('  bg-gray-50     → bg-surface');
console.log('  bg-gray-200    → bg-surface-container-highest');
console.log('  bg-gray-300    → bg-surface-container-highest');
console.log('  border-gray-*  → border-outline-variant/*');
console.log('  bg-green-50    → bg-emerald-500/15');
console.log('  bg-amber-50    → bg-amber-500/15');
console.log('  bg-brand-50    → bg-primary/15');
console.log('  text-brand-600 → text-primary');
console.log('  text-brand-700 → text-primary');
console.log('  text-green-600 → text-emerald-400');
console.log('  text-red-600   → text-red-400');
console.log('  hover:bg-gray  → hover:bg-surface-container-high');
console.log('  #e5e7eb (SVG)  → rgba(61,56,48,0.5)  (outline-variant)');
console.log('  #6b7280 (SVG)  → #bfb5a8 (on-surface-variant)');
console.log('  #4c6ef5 (SVG)  → #d4a853 (primary/gold)');
console.log('');
console.log('RadarChart: linhas de grid e polígono migrados para');
console.log('usar cores do design system (primary gold + outline-variant).');
console.log('');
console.log('Backups criados com extensão .bak-<timestamp>');
console.log('');
console.log('Próximo passo: git add . && git commit -m "fix: dark theme migration UserAssessments/Quiz/Report" && git push');
