import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { ArrowRight, Lock, CheckCircle2, Clock, Users, Target, Heart, Compass, Rocket, Shield, BookOpen } from 'lucide-react';

const iconMap = { Users, Target, Heart, Compass, Rocket, Shield, BookOpen };
const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };
const discColors = { D: '#E63946', I: '#F4A261', S: '#2A9D8F', C: '#264653' };

const cardImages = {
  'disc': '/card-disc.jpg',
  'roda-da-vida': '/card-roda.jpg',
  'inteligencia-emocional': '/card-ie.jpg',
  'valores-pessoais': '/card-valores.jpg',
  'metas-smart': '/card-metas.jpg',
  'sabotadores': '/card-sabotadores.jpg',
  'diario': '/card-diario.jpg',
};

// Posição do rosto da Vanessa em cada foto
const cardFocusPoint = {
  'disc': 'center 15%',
  'roda-da-vida': 'center 10%',
  'inteligencia-emocional': 'center 25%',
  'valores-pessoais': 'center 15%',
  'metas-smart': 'center 30%',
  'sabotadores': 'center 20%',
  'diario': 'center 12%',
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
  const [myTools, setMyTools] = useState([]);
  const [allTools, setAllTools] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const firstName = (user?.name || '').split(' ')[0] || 'Usuário';

  useEffect(() => {
    const load = async () => {
      try {
        const [myData, allData, assessData] = await Promise.all([
          api.get('/tools').catch(() => ({ tools: [] })),
          api.get('/tools/all').catch(() => ({ tools: [] })),
          api.get('/assessments/mine').catch(() => ({ assessments: [] })),
        ]);
        setMyTools(myData.tools || []);
        setAllTools(allData.tools || []);
        setAssessments(assessData.assessments || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Build unified tool list
  const myToolIds = new Set(myTools.map(t => t.id));
  const tools = [
    ...myTools.map(t => ({ ...t, hasAccess: true })),
    ...allTools.filter(t => !myToolIds.has(t.id)).map(t => ({ ...t, hasAccess: false })),
  ].sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));

  const getAssessment = (toolSlug) => {
    return assessments.find(a => a.tool?.slug === toolSlug);
  };

  const getStatus = (tool) => {
    if (!tool.hasAccess) return 'locked';
    const a = getAssessment(tool.slug);
    if (!a) {
      // Fallback: check if any assessment exists (older data without tool relation)
      const anyCompleted = assessments.find(ass => ass.scoresRaw && ass.status !== 'IN_PROGRESS');
      if (tool.slug === 'disc' && anyCompleted) return 'completed';
      return 'available';
    }
    if (a.scoresRaw && a.report) return 'completed';
    if (a.scoresRaw) return 'awaiting_report';
    if (a.status === 'IN_PROGRESS') return 'in_progress';
    return 'available';
  };

  const getDiscAssessment = () => {
    // Try to find assessment linked to disc tool
    const linked = assessments.find(a => a.tool?.slug === 'disc');
    if (linked) return linked;
    // Fallback: any completed assessment with scores (legacy data)
    return assessments.find(a => a.scoresRaw && a.status !== 'IN_PROGRESS');
  };

  const handleAction = (tool) => {
    const status = getStatus(tool);
    if (status === 'locked') return;
    const a = tool.slug === 'disc' ? getDiscAssessment() : getAssessment(tool.slug);
    if (tool.slug === 'disc') {
      if (status === 'available') navigate('/dashboard/disc/start');
      else if (status === 'in_progress') navigate('/dashboard/disc/quiz');
      else if ((status === 'completed' || status === 'awaiting_report') && a) {
        navigate('/report/' + a.id);
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  const discTool = tools.find(t => t.slug === 'disc');
  const discAssessment = getDiscAssessment();
  const discStatus = discTool ? getStatus(discTool) : 'locked';
  const otherTools = tools.filter(t => t.slug !== 'disc');

  // objectPosition agora é por card via cardFocusPoint

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

      {/* DISC Hero Card — Completed */}
      {discTool && discStatus === 'completed' && discAssessment && (
        <div
          className="group relative rounded-2xl overflow-hidden border border-outline-variant/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
          onClick={() => handleAction(discTool)}
        >
          <div className="relative min-h-[280px] flex flex-col justify-between p-8">
            <img src="/card-disc.jpg" alt="" style={{ objectPosition: cardFocusPoint['disc'] }} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface from-10% via-surface/85 via-50% to-surface/40 to-100%" />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Concluído
                  </span>
                  <h3 className="mt-3 text-2xl lg:text-3xl font-headline font-bold text-on-surface tracking-tight">
                    Análise Comportamental DISC
                  </h3>
                </div>
                <CheckCircle2 size={32} className="text-primary" />
              </div>

              {discAssessment?.scoresRaw?.normalized && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mb-4">
                  {['D', 'I', 'S', 'C'].map(dim => {
                    const val = discAssessment.scoresRaw.normalized[dim] || 0;
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
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">
                  Perfil: {discAssessment?.scoresRaw?.normalized ?
                    Object.entries(discAssessment.scoresRaw.normalized)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 2)
                      .map(([k]) => profileNames[k])
                      .join(' / ')
                    : ''}
                </span>
                <button className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest hover:text-gold-200 transition-colors">
                  Ver relatório completo <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DISC — Available or In Progress */}
      {discTool && (discStatus === 'available' || discStatus === 'in_progress') && (
        <div
          className="group relative rounded-2xl overflow-hidden border border-outline-variant/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
          onClick={() => handleAction(discTool)}
        >
          <div className="relative h-48">
            <img src="/card-disc.jpg" alt="" style={{ objectPosition: cardFocusPoint['disc'] }} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface from-5% via-surface/70 via-50% to-surface/30 to-100%" />
            <div className="absolute bottom-4 left-6 right-6 z-10">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 backdrop-blur-sm text-primary text-xs font-bold uppercase tracking-widest mb-2">
                {discStatus === 'in_progress' ? 'Em andamento' : 'Disponível'}
              </span>
              <h3 className="text-2xl font-headline font-bold text-on-surface">Análise DISC</h3>
            </div>
          </div>
          <div className="p-6 bg-surface-container">
            <p className="text-sm text-on-surface-variant mb-4">{discTool.description}</p>
            <button className="flex items-center gap-2 rounded-xl bg-primary/10 px-5 py-2.5 text-xs font-bold text-primary uppercase tracking-widest hover:bg-primary/20 transition-colors">
              {discStatus === 'in_progress' ? 'Continuar' : 'Iniciar'} <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Other Tools */}
      <div>
        <h2 className="font-headline text-lg font-semibold text-on-surface mb-4">Suas ferramentas</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {otherTools.map(tool => {
            const status = getStatus(tool);
            const isLocked = status === 'locked';
            const bgImage = cardImages[tool.slug];
            const focusPoint = cardFocusPoint[tool.slug] || 'center 20%';
            const Icon = iconMap[tool.icon] || Target;

            return (
              <div
                key={tool.id}
                className={`group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 border ${
                  isLocked
                    ? 'border-outline-variant/10 cursor-default'
                    : 'border-outline-variant/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 cursor-pointer'
                }`}
                onClick={() => !isLocked && handleAction(tool)}
              >
                <div className="relative h-48 overflow-hidden bg-surface-container">
                  {bgImage && (
                    <img
                      src={bgImage}
                      alt=""
                      style={{ objectPosition: focusPoint }}
                      className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${
                        isLocked ? 'grayscale brightness-50 blur-[1px]' : 'group-hover:scale-105'
                      }`}
                    />
                  )}

                  <div className={`absolute inset-0 ${
                    isLocked
                      ? 'bg-surface/60'
                      : 'bg-gradient-to-t from-surface-container from-5% via-surface-container/70 via-40% to-surface-container/20 to-100%'
                  }`} />

                  {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
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

                  {!isLocked && (
                    <div className="absolute top-3 right-3 z-10">
                      {status === 'completed' ? (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
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

                  {!isLocked && (
                    <div className="absolute bottom-3 left-4 z-10">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg backdrop-blur-sm"
                        style={{ backgroundColor: (tool.color || '#d4a853') + '44' }}
                      >
                        <Icon size={18} style={{ color: tool.color || '#d4a853' }} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 p-5 pt-3 bg-surface-container space-y-3">
                  <div>
                    <h3 className={`font-headline text-base font-bold ${isLocked ? 'text-on-surface-variant/70' : 'text-on-surface'}`}>
                      {tool.name}
                    </h3>
                    <p className="mt-1 text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                      {tool.description}
                    </p>
                  </div>

                  {!isLocked && (
                    <div>
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
                        <button className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors w-full justify-center">
                          Ver relatório <ArrowRight size={14} />
                        </button>
                      )}
                      {status === 'awaiting_report' && (
                        <div className="flex items-center gap-2 rounded-xl bg-amber-500/5 px-4 py-2 text-xs text-amber-400/70 w-full justify-center">
                          <Clock size={12} /> Relatório sendo preparado
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
          <img src="/card-cta.jpg" alt="" style={{ objectPosition: 'center 15%' }} className="w-full h-full object-cover opacity-20" />
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
          <img src="/vanessa-hero.jpg" alt="" style={{ objectPosition: 'center 15%' }} className="h-52 object-cover opacity-40 mix-blend-luminosity" />
        </div>
      </div>
    </div>
  );
}
