import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { ArrowRight, Lock, CheckCircle2, Users, Target, Heart, Compass, Rocket, Shield, BookOpen } from 'lucide-react';

const iconMap = { Users, Target, Heart, Compass, Rocket, Shield, BookOpen };
const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };

// Tool accent colors for gradients
const toolGradients = {
  'disc': 'from-primary/20 to-primary/5',
  'roda-da-vida': 'from-disc-s/20 to-disc-s/5',
  'inteligencia-emocional': 'from-disc-d/20 to-disc-d/5',
  'valores-pessoais': 'from-disc-i/20 to-disc-i/5',
  'metas-smart': 'from-purple-500/20 to-purple-500/5',
  'sabotadores': 'from-disc-c/20 to-disc-c/5',
  'diario': 'from-emerald-500/20 to-emerald-500/5',
};

function HeroCard({ tool, assessment, onAction }) {
  const scores = assessment?.scoresRaw?.normalized;
  const hasReport = !!assessment?.report;

  return (
    <div className="lg:col-span-4 md:col-span-2 group relative rounded-3xl overflow-hidden border border-outline-variant/10 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-surface/40" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent" />
      <div className="relative p-8 lg:p-10 flex flex-col justify-between min-h-[380px]">
        <div>
          <div className="flex justify-between items-start mb-10">
            <div>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Concluido
              </span>
              <h3 className="text-2xl lg:text-3xl font-headline font-semibold text-on-surface tracking-tight">{tool.name}</h3>
            </div>
            <CheckCircle2 size={36} className="text-primary" />
          </div>

          {scores && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-5 max-w-3xl">
              {['D', 'I', 'S', 'C'].map((f, i) => (
                <div key={f} className="space-y-2">
                  <div className="flex justify-between text-xs uppercase tracking-wider font-semibold">
                    <span className={"text-on-surface" + (i >= 2 ? '/70' : '')}>{profileNames[f]}</span>
                    <span className={i < 2 ? 'text-primary font-bold' : 'text-on-surface/60'}>{scores[f]}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-black/50 rounded-full overflow-hidden ring-1 ring-white/10">
                    <div className={"h-full rounded-full " + (i < 2 ? 'bg-primary shadow-[0_0_12px_rgba(231,190,174,0.6)]' : 'bg-secondary-container')}
                      style={{ width: scores[f] + '%' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-xs text-on-surface-variant/60 font-medium italic">
            Perfil: {assessment?.profilePrimary && profileNames[assessment.profilePrimary]} / {assessment?.profileSecondary && profileNames[assessment.profileSecondary]}
          </p>
          <button onClick={() => onAction(hasReport ? 'report' : 'view')}
            className="text-primary text-xs font-bold uppercase tracking-widest hover:text-primary-fixed flex items-center gap-2 transition-colors">
            {hasReport ? 'Ver Relatorio Completo' : 'Aguardando Liberacao'}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AvailableCard({ tool, onStart }) {
  const gradient = toolGradients[tool.slug] || 'from-primary/20 to-primary/5';
  return (
    <div className="lg:col-span-2 group relative rounded-3xl overflow-hidden border border-outline-variant/10 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer flex flex-col"
      onClick={() => onStart(tool)}>
      <div className={"absolute inset-0 bg-gradient-to-t from-surface via-surface/90 to-surface/60"} />
      <div className={"absolute inset-0 bg-gradient-to-br " + gradient} />
      <div className="relative p-8 lg:p-9 flex flex-col flex-1 min-h-[340px]">
        <div className="flex justify-between items-start mb-12">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-tertiary/20 text-tertiary text-xs font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            Disponivel
          </span>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-surface/60 group-hover:translate-x-1 transition-transform">
            <ArrowRight size={16} className="text-primary" />
          </div>
        </div>
        <div className="mt-auto">
          <h3 className="text-2xl font-headline font-semibold text-on-surface mb-3 tracking-tight">{tool.name}</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed font-medium max-w-xs">{tool.description}</p>
          <button className="mt-8 w-full py-3.5 bg-white/5 hover:bg-primary border border-white/10 group-hover:border-primary rounded-xl text-xs font-bold uppercase tracking-widest group-hover:text-on-primary transition-all duration-300">
            Comecar Agora
          </button>
        </div>
      </div>
    </div>
  );
}

function LockedCardLarge({ tool }) {
  const gradient = toolGradients[tool.slug] || 'from-primary/10 to-transparent';
  return (
    <div className="lg:col-span-2 relative rounded-3xl overflow-hidden border border-outline-variant/5 flex flex-col min-h-[300px] group">
      <div className="absolute inset-0 bg-surface-container" />
      <div className={"absolute inset-0 bg-gradient-to-br " + gradient + " opacity-30"} />
      <div className="relative p-8 flex flex-col flex-1 opacity-60 group-hover:opacity-80 transition-opacity">
        <div className="flex justify-between items-start mb-10">
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-secondary-container/50 text-secondary text-xs font-bold uppercase tracking-widest">Brevemente</span>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-surface/40">
            <Lock size={16} className="text-on-surface-variant" />
          </div>
        </div>
        <div className="mt-auto">
          <h3 className="text-2xl font-headline font-medium text-on-surface mb-2 tracking-tight">{tool.name}</h3>
          <p className="text-sm text-on-surface-variant max-w-xs">{tool.description}</p>
        </div>
      </div>
    </div>
  );
}

function LockedCardCompact({ tool, icon: iconName }) {
  return (
    <div className="lg:col-span-3 bg-surface-container-low rounded-3xl p-8 border border-outline-variant/5 opacity-70 hover:opacity-100 transition-opacity flex items-center gap-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container text-outline/50 shrink-0">
        {iconMap[tool.icon] ? (() => { const Icon = iconMap[tool.icon]; return <Icon size={28} />; })() : <Shield size={28} />}
      </div>
      <div>
        <div className="flex items-center gap-3 mb-1.5">
          <h3 className="text-lg font-headline font-medium text-on-surface tracking-tight">{tool.name}</h3>
          <Lock size={12} className="text-on-surface-variant/60" />
        </div>
        <p className="text-sm text-on-surface-variant font-medium">{tool.description}</p>
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
        try { const allData = await api.get('/tools/all'); setAllTools(allData.tools || []); } catch(e) { setAllTools([]); }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const greeting = () => { const h = new Date().getHours(); return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'; };

  const accessibleSlugs = new Set(tools.map(t => t.slug));
  const lockedTools = allTools.filter(t => !accessibleSlugs.has(t.slug) && t.isActive);

  // Find DISC tool and its assessment
  const discTool = tools.find(t => t.slug === 'disc');
  const discAssessment = assessments.find(a => a.status !== 'IN_PROGRESS' && a.scoresRaw);
  const otherTools = tools.filter(t => t.slug !== 'disc');

  // Split locked tools: first 2-4 get large cards, rest get compact
  const lockedLarge = lockedTools.slice(0, 4);
  const lockedCompact = lockedTools.slice(4);

  const handleToolAction = (tool, action, assessmentId) => {
    if (action === 'report' && discAssessment) navigate('/report/' + discAssessment.id);
    else if (tool?.slug === 'disc') navigate('/quiz');
    else navigate('/quiz');
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"/></div>;

  return (
    <div>
      {/* Hero */}
      <section className="mb-16">
        <span className="text-primary text-xs font-semibold uppercase tracking-widest mb-3 block">Painel de Evolucao Pessoal</span>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold text-on-surface tracking-tighter leading-tight">
          {greeting()}, <span className="italic font-normal text-primary">{(user?.name||'').split(' ')[0]}</span>
        </h1>
        <p className="text-on-surface-variant text-base md:text-lg mt-5 max-w-2xl font-light leading-relaxed">
          Bem-vindo ao seu espaco de crescimento. Explore suas ferramentas de desenvolvimento pessoal.
        </p>
      </section>

      {/* Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-8">

        {/* DISC Hero Card */}
        {discTool && discAssessment && (
          <HeroCard tool={discTool} assessment={discAssessment} onAction={(action) => handleToolAction(discTool, action)} />
        )}

        {/* DISC not completed */}
        {discTool && !discAssessment && (
          <div className="lg:col-span-4 md:col-span-2">
            <AvailableCard tool={discTool} onStart={() => navigate('/quiz')} />
          </div>
        )}

        {/* Available tools */}
        {otherTools.map(tool => (
          <AvailableCard key={tool.id} tool={tool} onStart={() => navigate('/quiz')} />
        ))}

        {/* Locked large cards */}
        {lockedLarge.map(tool => (
          <LockedCardLarge key={tool.id} tool={tool} />
        ))}

        {/* Locked compact cards */}
        {lockedCompact.map(tool => (
          <LockedCardCompact key={tool.id} tool={tool} />
        ))}

        {/* CTA Card */}
        {discAssessment && (
          <div className="lg:col-span-6 md:col-span-2 relative bg-primary-container rounded-3xl p-10 lg:p-12 overflow-hidden flex items-center border border-primary/10 mt-4">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="relative z-10 max-w-2xl">
              <span className="inline-block px-3 py-1 rounded-full bg-surface/30 text-on-primary-container text-[10px] font-bold uppercase tracking-widest mb-4">Proximo Passo</span>
              <h3 className="text-2xl md:text-3xl font-headline font-semibold text-on-primary-container mb-5 tracking-tight leading-tight">Aprofunde sua Jornada</h3>
              <p className="text-on-primary-container/90 mb-8 text-base font-medium leading-relaxed max-w-xl">
                Sua analise comportamental revela insights valiosos sobre seu perfil. Que tal agendar uma sessao de devolutiva para explorar seus resultados?
              </p>
              <button className="bg-surface text-primary px-10 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-surface-container-highest transition-colors shadow-lg flex items-center gap-2.5">
                Solicitar Sessao
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
