import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { ArrowRight, Lock, CheckCircle2, Clock, Target } from 'lucide-react';
import { getToolFocusPoint, getToolIcon, getToolImage } from '../features/tools/toolRegistry.js';

const whatsappSessionUrl = 'https://wa.me/5531989894774?text=' + encodeURIComponent('Olá, Vanessa. Quero solicitar uma sessão de devolutiva para explorar meus resultados.');

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

  const myToolIds = new Set(myTools.map(t => t.id));
  const tools = [
    ...myTools.map(t => ({ ...t, hasAccess: true })),
    ...allTools.filter(t => !myToolIds.has(t.id)).map(t => ({ ...t, hasAccess: false })),
  ].sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));

  const getAssessment = (toolSlug) => {
    const linked = assessments.find(a => a.tool?.slug === toolSlug);
    if (linked) return linked;
    if (toolSlug === 'disc') {
      return assessments.find(a => a.scoresRaw?.normalized?.D !== undefined && a.status !== 'IN_PROGRESS');
    }
    return null;
  };

  const getStatus = (tool) => {
    if (!tool.hasAccess) return 'locked';
    const a = getAssessment(tool.slug);
    if (!a) return 'available';
    if (a.scoresRaw && a.report) return 'completed';
    if (a.scoresRaw) return 'awaiting_report';
    if (a.status === 'IN_PROGRESS') return 'in_progress';
    return 'available';
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="relative rounded-2xl overflow-hidden bg-surface-container border border-outline-variant/20 p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-transparent to-transparent" />
        <div className="relative">
          <p className="text-sm text-primary font-label font-medium uppercase tracking-widest">{getGreeting()}</p>
          <h1 className="mt-1 font-headline text-3xl font-bold text-on-surface">{firstName}</h1>
          <p className="mt-2 text-sm text-on-surface-variant max-w-md">Explore suas ferramentas de desenvolvimento pessoal e descubra mais sobre você.</p>
        </div>
      </div>

      <div>
        <h2 className="font-headline text-lg font-semibold text-on-surface mb-4">Suas ferramentas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tools.map(tool => {
            const status = getStatus(tool);
            const isLocked = status === 'locked';
            const bgImage = getToolImage(tool);
            const focusPoint = getToolFocusPoint(tool);
            const Icon = getToolIcon(tool.icon, Target);

            return (
              <div key={tool.id}
                className={`group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 border ${isLocked ? 'border-outline-variant/10 cursor-default' : 'border-outline-variant/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 cursor-pointer'}`}
                onClick={() => !isLocked && navigate('/dashboard/ferramenta/' + tool.slug)}
              >
                <div className="relative h-48 overflow-hidden bg-surface-container">
                  {bgImage && (
                    <img src={bgImage} alt="" style={{ objectPosition: focusPoint }}
                      className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${isLocked ? 'grayscale brightness-50 blur-[1px]' : 'group-hover:scale-105'}`} />
                  )}
                  <div className={`absolute inset-0 ${isLocked ? 'bg-surface/60' : 'bg-gradient-to-t from-surface-container from-5% via-surface-container/70 via-40% to-surface-container/20 to-100%'}`} />
                  {!isLocked && <div className="absolute inset-0 bg-gradient-to-r from-surface-container/30 via-transparent to-surface-container/30" />}

                  {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high/80 backdrop-blur-sm border border-outline-variant/30">
                          <Lock size={20} className="text-on-surface-variant" />
                        </div>
                        <span className="text-xs font-medium text-on-surface-variant bg-surface-container/80 backdrop-blur-sm px-3 py-1 rounded-full">Em breve</span>
                      </div>
                    </div>
                  )}

                  {!isLocked && (
                    <div className="absolute top-3 right-3 z-10">
                      {status === 'completed' ? (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20"><CheckCircle2 size={10} /> Concluído</span>
                      ) : status === 'awaiting_report' ? (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500/20 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-amber-400 border border-amber-500/20"><Clock size={10} /> Aguardando relatório</span>
                      ) : status === 'in_progress' ? (
                        <span className="flex items-center gap-1 rounded-full bg-blue-500/20 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-blue-400 border border-blue-500/20"><Clock size={10} /> Em andamento</span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-primary/20 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-primary border border-primary/20">Disponível</span>
                      )}
                    </div>
                  )}

                  {!isLocked && (
                    <div className="absolute bottom-3 left-4 z-10">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg backdrop-blur-sm" style={{ backgroundColor: (tool.color || '#d4a853') + '44' }}>
                        <Icon size={18} style={{ color: tool.color || '#d4a853' }} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 p-5 pt-3 bg-surface-container space-y-3">
                  <div>
                    <h3 className={`font-headline text-base font-bold ${isLocked ? 'text-on-surface-variant/70' : 'text-on-surface'}`}>{tool.name}</h3>
                    <p className="mt-1 text-xs text-on-surface-variant leading-relaxed line-clamp-2">{tool.description}</p>
                  </div>
                  {!isLocked && (
                    <button className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors w-full justify-center">
                      {status === 'completed' ? 'Ver resultado' : status === 'in_progress' ? 'Continuar' : 'Explorar'} <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-surface-container border border-outline-variant/20 p-8">
        <div className="absolute inset-0">
          <img src="/card-cta.jpg" alt="" style={{ objectPosition: 'center 15%' }} className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-container via-surface-container/90 to-surface-container/70" />
        </div>
        <div className="relative max-w-lg">
          <h3 className="font-headline text-xl font-bold text-on-surface">Quer ir mais fundo?</h3>
          <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">Que tal agendar uma sessão de devolutiva para explorar seus resultados?</p>
          <a href={whatsappSessionUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-on-primary uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-lg">Solicitar sessão <ArrowRight size={14} /></a>
        </div>
        <div className="absolute right-8 bottom-0 hidden lg:block">
          <img src="/vanessa-hero.jpg" alt="" style={{ objectPosition: 'center 15%' }} className="h-52 object-cover opacity-40 mix-blend-luminosity" />
        </div>
      </div>
    </div>
  );
}
