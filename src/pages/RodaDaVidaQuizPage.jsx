import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Check, Loader2, ChevronLeft, ChevronRight, Target, Heart, BookOpen, Shield, Compass, Users, Rocket, Star } from 'lucide-react';

const iconMap = { Heart, BookOpen, Shield, Compass, Target, Users, Rocket, Star };

export default function RodaDaVidaQuizPage() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);
  const [assessmentId, setAssessmentId] = useState(null);
  const [currentArea, setCurrentArea] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [qData, aData] = await Promise.all([
          api.get('/assessments/questions?tool=roda-da-vida'),
          api.post('/assessments', { toolSlug: 'roda-da-vida' }),
        ]);
        setAreas(qData.areas || []);
        setAssessmentId(aData.assessment.id);
        if (aData.resumed && aData.assessment.responses) {
          setResponses(aData.assessment.responses);
        }
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  const area = areas[currentArea];
  const totalQuestions = areas.reduce((s, a) => s + a.questions.length, 0);
  const answeredCount = Object.keys(responses).length;
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const isAreaComplete = area ? area.questions.every(q => responses[q.id] !== undefined) : false;
  const allComplete = answeredCount >= totalQuestions;

  const setScore = (qId, value) => {
    setResponses(prev => ({ ...prev, [qId]: value }));
  };

  const submit = async () => {
    setSubmitting(true); setError('');
    try {
      await api.post('/assessments/' + assessmentId + '/submit', { responses });
      navigate('/dashboard/assessments?completed=true');
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-surface"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"/></div>;

  const Icon = area ? (iconMap[area.icon] || Target) : Target;

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2A9D8F]/15">
              <Target size={20} className="text-[#2A9D8F]" />
            </div>
            <div>
              <h1 className="font-headline text-2xl font-bold text-on-surface">Roda da Vida</h1>
              <p className="text-xs text-on-surface-variant">Avalie cada area de 1 a 10</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-on-surface-variant mb-1.5">
            <span>Progresso</span>
            <span>{answeredCount} de {totalQuestions}</span>
          </div>
          <div className="h-2 rounded-full bg-surface-container-highest">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: progress + '%' }} />
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">{error}</div>}

        {/* Area Tabs */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {areas.map((a, i) => {
            const areaComplete = a.questions.every(q => responses[q.id] !== undefined);
            const AreaIcon = iconMap[a.icon] || Target;
            return (
              <button
                key={a.id}
                onClick={() => setCurrentArea(i)}
                className={"flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium whitespace-nowrap transition-all " + (
                  i === currentArea
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : areaComplete
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-surface-container text-on-surface-variant/60 border border-outline-variant/20 hover:bg-surface-container-high'
                )}
              >
                {areaComplete ? <Check size={12} /> : <AreaIcon size={12} />}
                {a.name.length > 15 ? a.name.substring(0, 15) + '...' : a.name}
              </button>
            );
          })}
        </div>

        {/* Current Area */}
        {area && (
          <div className="card mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: area.color + '22' }}>
                <Icon size={18} style={{ color: area.color }} />
              </div>
              <div>
                <h2 className="font-headline text-lg font-semibold text-on-surface">{area.name}</h2>
                <p className="text-xs text-on-surface-variant">Area {currentArea + 1} de {areas.length}</p>
              </div>
              {isAreaComplete && <Check size={18} className="ml-auto text-emerald-400" />}
            </div>

            <div className="space-y-8">
              {area.questions.map((q, qi) => {
                const val = responses[q.id];
                return (
                  <div key={q.id}>
                    <p className="text-sm text-on-surface mb-4 leading-relaxed">{q.text}</p>
                    
                    {/* Score Labels */}
                    <div className="flex justify-between text-[10px] text-on-surface-variant/50 mb-2 px-1">
                      <span>Muito baixo</span>
                      <span>Excelente</span>
                    </div>
                    
                    {/* Score Buttons */}
                    <div className="flex gap-1.5">
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <button
                          key={n}
                          onClick={() => setScore(q.id, n)}
                          className={"flex-1 h-11 rounded-xl text-sm font-semibold transition-all duration-200 " + (
                            val === n
                              ? 'text-on-primary shadow-lg scale-105'
                              : val !== undefined && n <= val
                                ? 'text-on-primary/80'
                                : 'bg-surface-container-high text-on-surface-variant/50 hover:bg-surface-container-highest'
                          )}
                          style={
                            val !== undefined && n <= val
                              ? { backgroundColor: area.color + (n === val ? 'dd' : '55') }
                              : {}
                          }
                        >
                          {n}
                        </button>
                      ))}
                    </div>

                    {/* Score indicator */}
                    {val && (
                      <div className="mt-2 text-center">
                        <span className="text-xs font-semibold" style={{ color: area.color }}>
                          {val <= 3 ? 'Precisa de atenção' : val <= 5 ? 'Pode melhorar' : val <= 7 ? 'Bom' : val <= 9 ? 'Muito bom' : 'Excelente'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentArea(Math.max(0, currentArea - 1))}
            disabled={currentArea === 0}
            className="btn-secondary gap-1 disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Anterior
          </button>

          {currentArea < areas.length - 1 ? (
            <button onClick={() => setCurrentArea(currentArea + 1)} className="btn-primary gap-1">
              Próximo <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={submit} disabled={submitting || !allComplete} className="btn-primary gap-2 disabled:opacity-40">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Finalizar
            </button>
          )}
        </div>

        {/* Area dots */}
        <div className="mt-6 flex flex-wrap justify-center gap-1.5">
          {areas.map((a, i) => {
            const done = a.questions.every(q => responses[q.id] !== undefined);
            return (
              <button
                key={a.id}
                onClick={() => setCurrentArea(i)}
                className={"h-3 w-3 rounded-full transition-all " + (
                  i === currentArea ? 'scale-125' : ''
                )}
                style={{
                  backgroundColor: i === currentArea ? area.color : done ? '#2A9D8F' : '#2d2d2d'
                }}
                title={a.name}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
