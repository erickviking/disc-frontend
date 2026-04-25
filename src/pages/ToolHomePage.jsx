import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { ArrowLeft, ArrowRight, Play, Eye, Clock, CheckCircle2, Target, Loader2 } from 'lucide-react';
import { getToolFocusPoint, getToolIcon, getToolImage, getToolQuizPath, getToolReportPath } from '../features/tools/toolRegistry.js';

const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };
const discColors = { D: '#E63946', I: '#F4A261', S: '#2A9D8F', C: '#264653' };

const areaLabels = {
  saude: 'Saúde', intelectual: 'Intelectual', emocional: 'Emocional', proposito: 'Propósito',
  financas: 'Finanças', contribuicao: 'Contribuição', familia: 'Família', relacionamento: 'Relacionamento',
  social: 'Social', diversao: 'Diversão', plenitude: 'Plenitude', espiritualidade: 'Espiritualidade',
};

function MiniRoda({ scores, size = 180 }) {
  const center = size / 2;
  const radius = size / 2 - 30;
  const areas = Object.keys(scores);
  const count = areas.length;
  const getPoint = (i, v) => {
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
    return { x: center + Math.cos(angle) * (radius * v / 10), y: center + Math.sin(angle) * (radius * v / 10) };
  };
  const polygon = areas.map((_, i) => { const p = getPoint(i, scores[areas[i]]); return p.x + ',' + p.y; }).join(' ');
  const avg = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / count * 10) / 10;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[180px]">
      {[2.5, 5, 7.5, 10].map(v => (
        <polygon key={v} points={areas.map((_, i) => { const p = getPoint(i, v); return p.x + ',' + p.y; }).join(' ')} fill="none" stroke="rgba(61,56,48,0.3)" strokeWidth="0.5" />
      ))}
      <polygon points={polygon} fill="rgba(42,157,143,0.2)" stroke="#2A9D8F" strokeWidth="2" strokeLinejoin="round" />
      <text x={center} y={center + 5} textAnchor="middle" fontSize="16" fontWeight="800" fill="#d4a853">{avg}</text>
    </svg>
  );
}

export default function ToolHomePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tool, setTool] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const [toolsData, assessData] = await Promise.all([
        api.get('/tools').catch(() => ({ tools: [] })),
        api.get('/assessments/mine').catch(() => ({ assessments: [] })),
      ]);
      const found = (toolsData.tools || []).find(t => t.slug === slug);
      setTool(found || null);
      
      const toolAssessment = (assessData.assessments || []).find(a => a.tool?.slug === slug);
      if (toolAssessment) {
        setAssessment(toolAssessment);
      } else if (slug === 'disc') {
        const legacy = (assessData.assessments || []).find(a => a.scoresRaw?.normalized?.D !== undefined && a.status !== 'IN_PROGRESS');
        if (legacy) setAssessment(legacy);
      }
    } catch (e) { console.error(e); }
    finally { if (!silent) setLoading(false); }
  }, [slug]);

  useEffect(() => { loadData(); }, [loadData]);

  const hasScores = !!assessment?.scoresRaw;
  const hasReport = !!assessment?.report;
  const isInProgress = assessment?.status === 'IN_PROGRESS';
  const isCompleted = hasScores && !isInProgress;
  const isGeneratingReport = slug === 'inteligencia-emocional' && isCompleted && !hasReport;

  useEffect(() => {
    if (!isGeneratingReport) return;
    const intervalId = window.setInterval(() => loadData({ silent: true }), 5000);
    return () => window.clearInterval(intervalId);
  }, [isGeneratingReport, loadData]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  if (!tool) return (
    <div className="card text-center py-16">
      <p className="text-on-surface-variant mb-4">Ferramenta não encontrada ou sem acesso.</p>
      <button onClick={() => navigate('/dashboard')} className="btn-secondary gap-2"><ArrowLeft size={14} /> Voltar</button>
    </div>
  );

  const Icon = getToolIcon(tool.icon, Target);
  const bgImage = getToolImage(tool);
  const focusPoint = getToolFocusPoint(tool);
  const quizPath = getToolQuizPath(slug);
  const reportPath = getToolReportPath(slug, assessment?.id);

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors">
        <ArrowLeft size={14} /> Voltar ao início
      </button>

      <div className="relative rounded-2xl overflow-hidden border border-outline-variant/20">
        <div className="relative h-56 md:h-64">
          {bgImage && (
            <img src={bgImage} alt="" style={{ objectPosition: focusPoint }} className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface from-10% via-surface/80 via-50% to-surface/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface/40 via-transparent to-surface/40" />
          <div className="absolute bottom-6 left-6 right-6 z-10">
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl shadow-lg backdrop-blur-sm" style={{ backgroundColor: (tool.color || '#d4a853') + '44' }}>
                    <Icon size={22} style={{ color: tool.color || '#d4a853' }} />
                  </div>
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                      <CheckCircle2 size={12} /> Concluído
                    </span>
                  )}
                  {isInProgress && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 text-xs font-bold uppercase tracking-widest">
                      <Clock size={12} /> Em andamento
                    </span>
                  )}
                  {isGeneratingReport && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold uppercase tracking-widest">
                      <Loader2 size={12} className="animate-spin" /> Gerando relatório
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-surface tracking-tight">{tool.name}</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="font-headline text-lg font-semibold text-on-surface mb-3">Sobre esta ferramenta</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">{tool.description}</p>
          </div>

          {slug === 'disc' && isCompleted && assessment?.scoresRaw?.normalized && (
            <div className="card">
              <h2 className="font-headline text-lg font-semibold text-on-surface mb-4">Seu Perfil</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {['D', 'I', 'S', 'C'].map(dim => {
                  const val = assessment.scoresRaw.normalized[dim] || 0;
                  return (
                    <div key={dim}>
                      <div className="flex justify-between text-xs uppercase tracking-wider font-semibold mb-1.5">
                        <span className="text-on-surface">{profileNames[dim]}</span>
                        <span style={{ color: discColors[dim] }}>{val}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: val + '%', backgroundColor: discColors[dim] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-on-surface-variant">
                Perfil: {Object.entries(assessment.scoresRaw.normalized).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => profileNames[k]).join(' / ')}
              </p>
            </div>
          )}

          {slug === 'roda-da-vida' && isCompleted && assessment?.scoresRaw?.scores && (
            <div className="card">
              <h2 className="font-headline text-lg font-semibold text-on-surface mb-4">Sua Roda</h2>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <MiniRoda scores={assessment.scoresRaw.scores} />
                <div className="flex-1 grid grid-cols-2 gap-2">
                  {Object.entries(assessment.scoresRaw.scores).sort((a, b) => b[1] - a[1]).map(([area, score]) => (
                    <div key={area} className="flex items-center justify-between rounded-lg bg-surface-container-high/50 px-3 py-1.5">
                      <span className="text-xs text-on-surface-variant">{areaLabels[area] || area}</span>
                      <span className={`text-xs font-bold ${score >= 7 ? 'text-emerald-400' : score >= 4 ? 'text-amber-400' : 'text-red-400'}`}>{score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            {!isCompleted && !isInProgress && quizPath && (
              <>
                <h3 className="font-headline text-base font-semibold text-on-surface mb-2">Pronto para começar?</h3>
                <p className="text-xs text-on-surface-variant mb-4">Responda as perguntas com calma e sinceridade para obter o melhor resultado.</p>
                <button onClick={() => navigate(quizPath)} className="btn-primary w-full gap-2">
                  <Play size={14} /> Iniciar avaliação
                </button>
              </>
            )}

            {isInProgress && quizPath && (
              <>
                <h3 className="font-headline text-base font-semibold text-on-surface mb-2">Avaliação em andamento</h3>
                <p className="text-xs text-on-surface-variant mb-4">Continue de onde parou.</p>
                <button onClick={() => navigate(quizPath)} className="btn-primary w-full gap-2">
                  <ArrowRight size={14} /> Continuar
                </button>
              </>
            )}

            {isGeneratingReport && (
              <>
                <h3 className="font-headline text-base font-semibold text-on-surface mb-2">Gerando relatório</h3>
                <p className="text-xs text-on-surface-variant mb-4">Sua avaliação foi finalizada. A inteligência artificial está preparando sua devolutiva personalizada.</p>
                <div className="flex items-center gap-2 rounded-xl bg-amber-500/5 px-4 py-3 text-xs text-amber-400">
                  <Loader2 size={14} className="animate-spin" /> Atualizando automaticamente
                </div>
              </>
            )}

            {isCompleted && !hasReport && !isGeneratingReport && (
              <>
                <h3 className="font-headline text-base font-semibold text-on-surface mb-2">Avaliação concluída</h3>
                <p className="text-xs text-on-surface-variant mb-4">Seu relatório está sendo preparado.</p>
                <div className="flex items-center gap-2 rounded-xl bg-amber-500/5 px-4 py-3 text-xs text-amber-400">
                  <Clock size={14} /> Aguardando relatório
                </div>
              </>
            )}

            {isCompleted && hasReport && reportPath && (
              <>
                <h3 className="font-headline text-base font-semibold text-on-surface mb-2">Relatório pronto</h3>
                <p className="text-xs text-on-surface-variant mb-4">Seu relatório personalizado está disponível.</p>
                <button onClick={() => navigate(reportPath)} className="btn-primary w-full gap-2">
                  <Eye size={14} /> Acessar relatório
                </button>
              </>
            )}

            {!quizPath && !isCompleted && (
              <>
                <h3 className="font-headline text-base font-semibold text-on-surface mb-2">Em breve</h3>
                <p className="text-xs text-on-surface-variant">Esta ferramenta ainda está sendo preparada.</p>
              </>
            )}
          </div>

          {isCompleted && quizPath && !isGeneratingReport && (
            <div className="card">
              <button onClick={() => navigate(quizPath)} className="btn-secondary w-full gap-2 text-xs">
                <Play size={12} /> Refazer avaliação
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
