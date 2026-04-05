const fs = require('fs');
const path = require('path');
function w(f, c) {
  const d = path.dirname(f);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(f, c, 'utf8');
  console.log('OK:', f);
}

// Card image mapping per tool slug
const cardImages = {
  'disc': '/card-disc.jpg',
  'roda-da-vida': '/card-roda.jpg',
  'inteligencia-emocional': '/card-ie.jpg',
  'valores-pessoais': '/card-valores.jpg',
  'metas-smart': '/card-metas.jpg',
  'sabotadores': '/card-sabotadores.jpg',
  'diario': '/card-diario.jpg',
};

w('../frontend/src/pages/UserDashboard.jsx', `import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { ArrowRight, Lock, CheckCircle2, Users, Target, Heart, Compass, Rocket, Shield, BookOpen } from 'lucide-react';

const iconMap = { Users, Target, Heart, Compass, Rocket, Shield, BookOpen };
const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };
const cardImages = {
  'disc': '/card-disc.jpg',
  'roda-da-vida': '/card-roda.jpg',
  'inteligencia-emocional': '/card-ie.jpg',
  'valores-pessoais': '/card-valores.jpg',
  'metas-smart': '/card-metas.jpg',
  'sabotadores': '/card-sabotadores.jpg',
  'diario': '/card-diario.jpg',
};

function HeroCard({ tool, assessment, onAction }) {
  const scores = assessment?.scoresRaw?.normalized;
  const hasReport = !!assessment?.report;
  const sorted = scores ? Object.entries(scores).sort((a,b) => b[1] - a[1]) : [];
  const img = cardImages[tool.slug] || '/card-disc.jpg';

  return (
    <div className="lg:col-span-4 md:col-span-2 group relative rounded-3xl overflow-hidden border border-outline-variant/10 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
      {/* Background image */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(' + img + ')' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,15,15,0.98) 0%, rgba(15,15,15,0.75) 50%, rgba(15,15,15,0.35) 100%)' }} />

      <div className="relative p-8 lg:p-10 flex flex-col justify-between min-h-[400px] z-10">
        <div>
          <div className="flex justify-between items-start mb-10">
            <div>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-sm text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Concluido
              </span>
              <h3 className="text-2xl lg:text-3xl font-headline font-semibold text-white tracking-tight drop-shadow-md">{tool.name}</h3>
            </div>
            <CheckCircle2 size={36} className="text-primary drop-shadow-lg" />
          </div>
          {scores && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-5 max-w-3xl">
              {['D','I','S','C'].map((f, i) => {
                const isTop = sorted[0]?.[0] === f || sorted[1]?.[0] === f;
                return (
                  <div key={f} className="space-y-2">
                    <div className="flex justify-between text-xs uppercase tracking-wider font-bold drop-shadow-sm">
                      <span className={"text-white" + (isTop ? '' : '/70')}>{profileNames[f]}</span>
                      <span className={isTop ? 'text-primary' : 'text-white/50'}>{scores[f]}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-black/50 backdrop-blur-sm rounded-full overflow-hidden ring-1 ring-white/10">
                      <div className={"h-full rounded-full transition-all " + (isTop ? 'bg-primary shadow-[0_0_12px_rgba(212,168,83,0.5)]' : 'bg-white/20')}
                        style={{ width: scores[f] + '%' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-xs text-white/50 font-medium italic drop-shadow-sm">
            Perfil: {assessment?.profilePrimary && profileNames[assessment.profilePrimary]} / {assessment?.profileSecondary && profileNames[assessment.profileSecondary]}
          </p>
          <button onClick={() => onAction(hasReport ? 'report' : 'view')}
            className="text-primary text-xs font-bold uppercase tracking-widest hover:text-gold-300 flex items-center gap-2 transition-colors drop-shadow-md">
            {hasReport ? 'Ver Relatorio Completo' : 'Aguardando Liberacao'}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AvailableCard({ tool, onStart }) {
  const img = cardImages[tool.slug] || '/card-roda.jpg';
  return (
    <div className="lg:col-span-2 group relative rounded-3xl overflow-hidden border border-outline-variant/10 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer flex flex-col"
      onClick={() => onStart(tool)}>
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: 'url(' + img + ')' }} />
      <div className="absolute inset-0 transition-opacity group-hover:opacity-90" style={{ background: 'linear-gradient(to top, rgba(15,15,15,0.98) 0%, rgba(15,15,15,0.6) 50%, rgba(15,15,15,0.3) 100%)' }} />

      <div className="relative p-8 lg:p-9 flex flex-col flex-1 min-h-[360px] z-10">
        <div className="flex justify-between items-start mb-12">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-tertiary/20 backdrop-blur-sm text-tertiary text-xs font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            Disponivel
          </span>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm group-hover:translate-x-1 transition-transform">
            <ArrowRight size={16} className="text-primary" />
          </div>
        </div>
        <div className="mt-auto">
          <h3 className="text-2xl font-headline font-semibold text-white mb-3 tracking-tight drop-shadow-md">{tool.name}</h3>
          <p className="text-sm text-white/70 leading-relaxed font-medium max-w-xs drop-shadow-sm">{tool.description}</p>
          <button className="mt-8 w-full py-3.5 bg-white/10 hover:bg-primary backdrop-blur-sm border border-white/20 group-hover:border-primary rounded-xl text-xs font-bold uppercase tracking-widest group-hover:text-on-primary transition-all duration-300 text-white">
            Comecar Agora
          </button>
        </div>
      </div>
    </div>
  );
}

function InProgressCard({ tool, onContinue }) {
  const img = cardImages[tool.slug] || '/card-disc.jpg';
  return (
    <div className="lg:col-span-2 group relative rounded-3xl overflow-hidden border border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer flex flex-col"
      onClick={onContinue}>
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(' + img + ')' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,15,15,0.95) 0%, rgba(15,15,15,0.6) 50%, rgba(15,15,15,0.3) 100%)' }} />

      <div className="relative p-8 lg:p-9 flex flex-col flex-1 min-h-[360px] z-10">
        <div className="flex justify-between items-start mb-12">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 backdrop-blur-sm text-amber-400 text-xs font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Em andamento
          </span>
        </div>
        <div className="mt-auto">
          <h3 className="text-2xl font-headline font-semibold text-white mb-3 tracking-tight drop-shadow-md">{tool.name}</h3>
          <p className="text-sm text-white/60 drop-shadow-sm">Continue de onde parou</p>
          <button className="mt-8 w-full py-3.5 bg-primary border border-primary rounded-xl text-xs font-bold uppercase tracking-widest text-on-primary transition-all duration-300 hover:bg-gold-300">
            Continuar <span className="ml-1">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function LockedCardLarge({ tool }) {
  const img = cardImages[tool.slug];
  return (
    <div className="lg:col-span-2 relative rounded-3xl overflow-hidden border border-outline-variant/5 flex flex-col min-h-[320px] group">
      {img && <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(' + img + ')' }} />}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />

      <div className="relative p-8 flex flex-col flex-1 opacity-60 group-hover:opacity-80 transition-opacity z-10">
        <div className="flex justify-between items-start mb-10">
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/60 text-xs font-bold uppercase tracking-widest">Brevemente</span>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm"><Lock size={16} className="text-white/50" /></div>
        </div>
        <div className="mt-auto">
          <h3 className="text-2xl font-headline font-medium text-white mb-2 tracking-tight drop-shadow-md">{tool.name}</h3>
          <p className="text-sm text-white/50 max-w-xs drop-shadow-sm">{tool.description}</p>
        </div>
      </div>
    </div>
  );
}

function LockedCardCompact({ tool }) {
  const Icon = iconMap[tool.icon] || Shield;
  return (
    <div className="lg:col-span-3 bg-surface-container-low rounded-3xl p-7 border border-outline-variant/5 opacity-60 hover:opacity-90 transition-opacity flex items-center gap-5">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container text-on-surface-variant/30 shrink-0"><Icon size={26} /></div>
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <h3 className="text-lg font-headline font-medium text-on-surface tracking-tight">{tool.name}</h3>
          <Lock size={12} className="text-on-surface-variant/40" />
        </div>
        <p className="text-sm text-on-surface-variant/50 font-medium">{tool.description}</p>
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
        const [td, ad] = await Promise.all([api.get('/tools'), api.get('/assessments/mine')]);
        setTools(td.tools); setAssessments(ad.assessments);
        try { setAllTools((await api.get('/tools/all')).tools || []); } catch(e) { setAllTools([]); }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const greeting = () => { const h = new Date().getHours(); return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'; };
  const accessibleSlugs = new Set(tools.map(t => t.slug));
  const lockedTools = allTools.filter(t => !accessibleSlugs.has(t.slug) && t.isActive);

  // Find tools and assessments
  const discTool = tools.find(t => t.slug === 'disc');
  const completedAssessments = assessments.filter(a => a.status !== 'IN_PROGRESS' && a.scoresRaw);
  const discAssessment = completedAssessments.find(a => true); // latest completed
  const inProgressAssessment = assessments.find(a => a.status === 'IN_PROGRESS');
  const otherTools = tools.filter(t => t.slug !== 'disc');

  // Split locked: first ones get image cards, rest compact
  const lockedLarge = lockedTools.slice(0, 4);
  const lockedCompact = lockedTools.slice(4);

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"/></div>;

  return (
    <div>
      {/* Hero greeting */}
      <section className="mb-14">
        <span className="text-primary text-xs font-semibold uppercase tracking-widest mb-3 block">Painel de Evolucao Pessoal</span>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold text-on-surface tracking-tighter leading-tight">
          {greeting()}, <span className="italic font-normal text-primary">{(user?.name||'').split(' ')[0]}</span>
        </h1>
        <p className="text-on-surface-variant/60 text-base md:text-lg mt-5 max-w-2xl font-light leading-relaxed">
          Bem-vindo ao seu espaco de crescimento. Explore suas ferramentas de desenvolvimento pessoal.
        </p>
      </section>

      {/* Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-8">

        {/* DISC completed = hero card */}
        {discTool && discAssessment && !inProgressAssessment && (
          <HeroCard tool={discTool} assessment={discAssessment} onAction={(a) => {
            if (a==='report' && discAssessment) navigate('/report/'+discAssessment.id);
          }} />
        )}

        {/* DISC in progress */}
        {discTool && inProgressAssessment && (
          <InProgressCard tool={discTool} onContinue={() => navigate('/quiz')} />
        )}

        {/* DISC not started */}
        {discTool && !discAssessment && !inProgressAssessment && (
          <div className="lg:col-span-4 md:col-span-2">
            <AvailableCard tool={discTool} onStart={() => navigate('/quiz')} />
          </div>
        )}

        {/* Other available tools */}
        {otherTools.map(t => (
          <AvailableCard key={t.id} tool={t} onStart={() => navigate('/quiz')} />
        ))}

        {/* Locked large (with images) */}
        {lockedLarge.map(t => (
          <LockedCardLarge key={t.id} tool={t} />
        ))}

        {/* Locked compact (no images) */}
        {lockedCompact.map(t => (
          <LockedCardCompact key={t.id} tool={t} />
        ))}

        {/* CTA Card */}
        {discAssessment && (
          <div className="lg:col-span-6 md:col-span-2 relative rounded-3xl overflow-hidden flex items-center border border-primary/15 mt-4 min-h-[200px]">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/card-cta.jpg)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(122,98,48,0.95) 0%, rgba(92,67,24,0.9) 50%, rgba(60,42,15,0.85) 100%)' }} />
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />

            <div className="relative z-10 p-10 lg:p-12 max-w-2xl">
              <span className="inline-block px-3 py-1 rounded-full bg-black/20 backdrop-blur-sm text-gold-100 text-[10px] font-bold uppercase tracking-widest mb-4">Proximo Passo</span>
              <h3 className="text-2xl md:text-3xl font-headline font-semibold text-white mb-5 tracking-tight leading-tight">Aprofunde sua Jornada</h3>
              <p className="text-gold-100/80 mb-8 text-base font-medium leading-relaxed max-w-xl">
                Sua analise comportamental revela insights valiosos. Que tal agendar uma sessao de devolutiva para explorar seus resultados?
              </p>
              <button className="bg-surface text-primary px-10 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-surface-container-highest transition-colors shadow-lg flex items-center gap-2.5">
                Solicitar Sessao <ArrowRight size={14} />
              </button>
            </div>

            <div className="absolute right-8 bottom-0 hidden lg:block">
              <img src="/vanessa-hero.jpg" alt="" className="h-56 object-cover object-top opacity-40 mix-blend-luminosity" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
`);

console.log('\\n============================================');
console.log('  Dashboard Netflix com fotos aplicado!');
console.log('============================================');
console.log('\\nIMPORTANTE: Copie TODAS as imagens para');
console.log('C:\\disc-system\\frontend\\public\\:');
console.log('  card-disc.jpg');
console.log('  card-roda.jpg');
console.log('  card-ie.jpg');
console.log('  card-valores.jpg');
console.log('  card-metas.jpg');
console.log('  card-sabotadores.jpg');
console.log('  card-diario.jpg');
console.log('  card-cta.jpg');
console.log('  vanessa-profile.jpg');
console.log('  vanessa-hero.jpg');
console.log('\\nDepois git push para deploy.');
