const fs = require('fs');
const path = require('path');

const dashPath = 'src/pages/UserDashboard.jsx';
if (!fs.existsSync(dashPath)) {
  console.log('ERRO: Rode este script em C:\\disc-system\\frontend');
  process.exit(1);
}

let dash = fs.readFileSync(dashPath, 'utf8');

// ============================================
// CHECK: Is this the disc-update version or the old bento version?
// ============================================

const isNewVersion = dash.includes("/tools/my") || dash.includes("hasAccess");
const isOldVersion = dash.includes("LockedCardLarge") || dash.includes("LockedCardCompact");

console.log('Versao detectada:', isNewVersion ? 'disc-update (nova)' : isOldVersion ? 'bento (antiga)' : 'desconhecida');
console.log('Reescrevendo UserDashboard.jsx completo...\n');

// ============================================
// REWRITE UserDashboard.jsx — versão definitiva
// ============================================

const newDash = `import { useState, useEffect } from 'react';
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
  const firstName = (user?.name || 'Usu\\u00e1rio').split(' ')[0];

  useEffect(() => {
    const load = async () => {
      try {
        const [myData, allData, assessData] = await Promise.all([
          api.get('/tools').catch(() => ({ tools: [] })),
          api.get('/tools/all').catch(() => ({ tools: [] })),
          api.get('/assessments/my').catch(() => ({ assessments: [] })),
        ]);
        setMyTools(myData.tools || []);
        setAllTools(allData.tools || []);
        setAssessments(assessData.assessments || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Build unified tool list: accessible + locked
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
    if (!a) return 'available';
    if (a.status === 'completed' && a.report) return 'completed';
    if (a.status === 'completed' || (a.scoresRaw && a.status !== 'IN_PROGRESS')) return 'awaiting_report';
    if (a.status === 'IN_PROGRESS') return 'in_progress';
    return 'available';
  };

  const handleAction = (tool) => {
    const status = getStatus(tool);
    const a = getAssessment(tool.slug);
    if (status === 'locked') return;
    if (tool.slug === 'disc') {
      if (status === 'available') navigate('/dashboard/disc/start');
      else if (status === 'in_progress') navigate('/dashboard/disc/quiz');
      else if (status === 'completed' && a) navigate('/dashboard/disc/report/' + a.id);
      else if (status === 'completed' || status === 'awaiting_report') {
        if (a) navigate('/report/' + a.id);
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  // Separate DISC (hero) from others
  const discTool = tools.find(t => t.slug === 'disc');
  const discAssessment = discTool ? getAssessment('disc') : null;
  const discStatus = discTool ? getStatus(discTool) : 'locked';
  const otherTools = tools.filter(t => t.slug !== 'disc');

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
            Explore suas ferramentas de desenvolvimento pessoal e descubra mais sobre voc\\u00ea.
          </p>
        </div>
      </div>

      {/* DISC Hero Card */}
      {discTool && discStatus === 'completed' && discAssessment && (
        <div
          className="group relative rounded-2xl overflow-hidden border border-outline-variant/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
          onClick={() => handleAction(discTool)}
        >
          <div className="relative h-auto min-h-[280px] flex flex-col justify-between p-8">
            {/* Background image */}
            <img src="/card-disc.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/85 to-surface/50" />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Conclu\\u00eddo
                  </span>
                  <h3 className="mt-3 text-2xl lg:text-3xl font-headline font-bold text-on-surface tracking-tight">
                    An\\u00e1lise Comportamental DISC
                  </h3>
                </div>
                <CheckCircle2 size={32} className="text-primary" />
              </div>

              {/* Scores */}
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
                  Ver relat\\u00f3rio completo <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DISC available or in progress */}
      {discTool && (discStatus === 'available' || discStatus === 'in_progress') && (
        <div
          className="group relative rounded-2xl overflow-hidden border border-outline-variant/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
          onClick={() => handleAction(discTool)}
        >
          <div className="relative h-48">
            <img src="/card-disc.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/70 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6 z-10">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 backdrop-blur-sm text-primary text-xs font-bold uppercase tracking-widest mb-2">
                {discStatus === 'in_progress' ? 'Em andamento' : 'Dispon\\u00edvel'}
              </span>
              <h3 className="text-2xl font-headline font-bold text-on-surface">An\\u00e1lise DISC</h3>
            </div>
          </div>
          <div className="p-6">
            <p className="text-sm text-on-surface-variant mb-4">{discTool.description}</p>
            <button className="flex items-center gap-2 rounded-xl bg-primary/10 px-5 py-2.5 text-xs font-bold text-primary uppercase tracking-widest hover:bg-primary/20 transition-colors">
              {discStatus === 'in_progress' ? 'Continuar' : 'Iniciar'} <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Other Tools Grid */}
      <div>
        <h2 className="font-headline text-lg font-semibold text-on-surface mb-4">
          Suas ferramentas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {otherTools.map(tool => {
            const status = getStatus(tool);
            const isLocked = status === 'locked';
            const bgImage = cardImages[tool.slug];
            const Icon = iconMap[tool.icon] || Target;

            return (
              <div
                key={tool.id}
                className={\`group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 border \${
                  isLocked
                    ? 'border-outline-variant/10 cursor-default'
                    : 'border-outline-variant/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 cursor-pointer'
                }\`}
                onClick={() => !isLocked && handleAction(tool)}
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden bg-surface-container">
                  {bgImage && (
                    <img
                      src={bgImage}
                      alt=""
                      className={\`absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 \${
                        isLocked ? 'grayscale brightness-50 blur-[1px]' : 'group-hover:scale-105'
                      }\`}
                    />
                  )}

                  {/* Overlay */}
                  <div className={\`absolute inset-0 \${
                    isLocked
                      ? 'bg-surface/70'
                      : 'bg-gradient-to-t from-surface-container via-surface-container/40 to-transparent'
                  }\`} />

                  {/* Lock */}
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

                  {/* Status badge */}
                  {!isLocked && (
                    <div className="absolute top-3 right-3 z-10">
                      {status === 'completed' ? (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 size={10} /> Conclu\\u00eddo
                        </span>
                      ) : status === 'awaiting_report' ? (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500/20 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
                          <Clock size={10} /> Aguardando relat\\u00f3rio
                        </span>
                      ) : status === 'in_progress' ? (
                        <span className="flex items-center gap-1 rounded-full bg-blue-500/20 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-blue-400 border border-blue-500/20">
                          <Clock size={10} /> Em andamento
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-primary/20 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-primary border border-primary/20">
                          Dispon\\u00edvel
                        </span>
                      )}
                    </div>
                  )}

                  {/* Icon */}
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

                {/* Body */}
                <div className="flex-1 p-5 pt-3 bg-surface-container space-y-3">
                  <div>
                    <h3 className={\`font-headline text-base font-bold \${isLocked ? 'text-on-surface-variant/70' : 'text-on-surface'}\`}>
                      {tool.name}
                    </h3>
                    <p className="mt-1 text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                      {tool.description}
                    </p>
                  </div>

                  {/* Action */}
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
                          Ver relat\\u00f3rio <ArrowRight size={14} />
                        </button>
                      )}
                      {status === 'awaiting_report' && (
                        <div className="flex items-center gap-2 rounded-xl bg-amber-500/5 px-4 py-2 text-xs text-amber-400/70 w-full justify-center">
                          <Clock size={12} /> Relat\\u00f3rio sendo preparado
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
          <img src="/card-cta.jpg" alt="" className="w-full h-full object-cover object-top opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-container via-surface-container/90 to-surface-container/70" />
        </div>
        <div className="relative max-w-lg">
          <h3 className="font-headline text-xl font-bold text-on-surface">
            Quer ir mais fundo?
          </h3>
          <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
            Que tal agendar uma sess\\u00e3o de devolutiva para explorar seus resultados?
          </p>
          <button className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-on-primary uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-lg">
            Solicitar sess\\u00e3o <ArrowRight size={14} />
          </button>
        </div>
        <div className="absolute right-8 bottom-0 hidden lg:block">
          <img src="/vanessa-hero.jpg" alt="" className="h-52 object-cover object-top opacity-40 mix-blend-luminosity" />
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(dashPath, newDash, 'utf8');
console.log('OK: UserDashboard.jsx reescrito');

console.log('\\n============================================');
console.log('  Dashboard corrigido!');
console.log('============================================');
console.log('\\nMudancas:');
console.log('  - Chama /tools (nao /tools/my) para ferramentas com acesso');
console.log('  - DISC hero card com scores quando concluido');
console.log('  - Todas as ferramentas bloqueadas com card grande + imagem');
console.log('  - Imagens com object-top (nao corta cabeca)');
console.log('  - Acentuacao corrigida em todos os textos');
console.log('\\nDeploy:');
console.log('  Remove-Item *.cjs');
console.log('  git add . && git commit -m "fix: dashboard definitivo" && git push');
