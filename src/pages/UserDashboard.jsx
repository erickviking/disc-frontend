import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { Users, Target, Heart, Compass, Rocket, Shield, BookOpen, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

const iconMap = { Users, Target, Heart, Compass, Rocket, Shield, BookOpen };
const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };

function ToolCard({ tool, assessments, onStart }) {
  const Icon = iconMap[tool.icon] || Users;
  const toolAssessments = assessments.filter(a => a.toolId === tool.id);
  const latest = toolAssessments[0];
  const hasReport = !!latest?.report;
  const isCompleted = latest && latest.status !== 'IN_PROGRESS';
  const isInProgress = latest?.status === 'IN_PROGRESS';

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1">
      {/* Color bar */}
      <div className="h-1.5" style={{ background: tool.color || '#4c6ef5' }} />

      <div className="p-6">
        {/* Icon + Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ background: (tool.color || '#4c6ef5') + '15', color: tool.color || '#4c6ef5' }}>
            <Icon size={24} />
          </div>
          {isCompleted && (
            <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-semibold text-green-700 uppercase tracking-wide">
              <CheckCircle2 size={10} /> Concluido
            </span>
          )}
          {isInProgress && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 uppercase tracking-wide">
              Em andamento
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-display text-lg text-gray-900 mb-2">{tool.name}</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-5 line-clamp-2">{tool.description}</p>

        {/* Scores preview if available */}
        {isCompleted && latest.scoresRaw?.normalized && tool.slug === 'disc' && (
          <div className="flex gap-2 mb-4 p-3 rounded-lg bg-gray-50">
            {['D','I','S','C'].map(f => (
              <div key={f} className="flex-1 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: f==='D'?'#E63946':f==='I'?'#F4A261':f==='S'?'#2A9D8F':'#264653' }}>{profileNames[f]}</div>
                <div className="text-sm font-bold text-gray-900">{latest.scoresRaw.normalized[f]}%</div>
              </div>
            ))}
          </div>
        )}

        {/* Action */}
        <div className="flex gap-2">
          {hasReport ? (
            <button onClick={() => onStart(tool, 'report', latest.id)} className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: tool.color || '#4c6ef5' }}>
              Ver Relatorio
            </button>
          ) : isInProgress ? (
            <button onClick={() => onStart(tool, 'continue')} className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-semibold transition-all hover:opacity-80" style={{ borderColor: tool.color, color: tool.color }}>
              Continuar <ArrowRight size={14} />
            </button>
          ) : isCompleted ? (
            <button disabled className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-400 cursor-default">
              Aguardando liberacao
            </button>
          ) : (
            <button onClick={() => onStart(tool, 'start')} className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg" style={{ background: tool.color || '#4c6ef5' }}>
              Iniciar <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function LockedToolCard({ tool }) {
  const Icon = iconMap[tool.icon] || Users;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/40 bg-gray-50/50 opacity-60">
      <div className="h-1.5 bg-gray-300" />
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-200 text-gray-400">
            <Icon size={24} />
          </div>
          <Lock size={16} className="text-gray-400" />
        </div>
        <h3 className="font-display text-lg text-gray-500 mb-2">{tool.name}</h3>
        <p className="text-sm text-gray-400 leading-relaxed mb-5 line-clamp-2">{tool.description}</p>
        <div className="flex items-center justify-center gap-2 rounded-xl bg-gray-200 py-2.5 text-sm font-medium text-gray-500">
          <Lock size={14} /> Em breve
        </div>
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

        // Try to get all tools for locked display
        try {
          const allData = await api.get('/tools/all');
          setAllTools(allData.tools || []);
        } catch (e) {
          setAllTools([]);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const greeting = () => { const h = new Date().getHours(); return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'; };

  const handleToolAction = (tool, action, assessmentId) => {
    if (action === 'report') navigate('/report/' + assessmentId);
    else if (tool.slug === 'disc') navigate('/quiz');
    else navigate('/tool/' + tool.slug);
  };

  // Tools user has access to
  const accessibleSlugs = new Set(tools.map(t => t.slug));
  // Tools user doesn't have (show as locked)
  const lockedTools = allTools.filter(t => !accessibleSlugs.has(t.slug) && t.isActive);

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"/></div>;

  return (
    <div>
      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-display text-3xl text-gray-900">{greeting()}, {(user?.name||'').split(' ')[0]}</h1>
        <p className="mt-2 text-gray-500">Explore suas ferramentas de desenvolvimento pessoal</p>
      </div>

      {/* Active Tools */}
      {tools.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Suas Ferramentas</h2>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map(tool => (
              <ToolCard key={tool.id} tool={tool} assessments={assessments} onStart={handleToolAction} />
            ))}
          </div>
        </div>
      )}

      {/* Locked Tools */}
      {lockedTools.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Em Breve</h2>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lockedTools.map(tool => (
              <LockedToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      )}

      {tools.length === 0 && lockedTools.length === 0 && (
        <div className="card flex flex-col items-center py-16 text-center">
          <Lock size={48} className="text-gray-300 mb-4" />
          <h3 className="font-display text-xl text-gray-500">Nenhuma ferramenta disponivel</h3>
          <p className="mt-2 text-sm text-gray-400">Entre em contato com sua mentora para liberar o acesso.</p>
        </div>
      )}
    </div>
  );
}
