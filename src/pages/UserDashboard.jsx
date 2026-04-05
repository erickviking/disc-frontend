import { useState, useEffect } from 'react';
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
                className={`group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ${
                  isLocked
                    ? 'bg-surface-container-lowest border border-outline-variant/10 opacity-70'
                    : 'bg-surface-container border border-outline-variant/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 cursor-pointer'
                }`}
                onClick={() => !isLocked && handleToolAction(tool)}
              >
                {/* Card image */}
                <div className="relative h-40 overflow-hidden">
                  {bgImage ? (
                    <img
                      src={bgImage}
                      alt=""
                      className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${
                        isLocked ? 'grayscale blur-[2px] opacity-40' : 'group-hover:scale-105'
                      }`}
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{ background: `linear-gradient(135deg, ${tool.color}33, ${tool.color}11)` }}
                    />
                  )}

                  {/* Overlay */}
                  <div className={`absolute inset-0 ${
                    isLocked
                      ? 'bg-surface/80'
                      : 'bg-gradient-to-t from-surface-container via-surface-container/50 to-transparent'
                  }`} />

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
                    <h3 className={`font-headline text-base font-bold ${isLocked ? 'text-on-surface-variant' : 'text-on-surface'}`}>
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
                                width: `${scores[dim] || 0}%`,
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
