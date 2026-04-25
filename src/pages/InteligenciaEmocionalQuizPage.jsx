import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';

const scaleLabels = { 1: 'Nunca ou quase nunca', 2: 'Raramente', 3: 'As vezes', 4: 'Frequentemente', 5: 'Sempre ou quase sempre' };

export default function InteligenciaEmocionalQuizPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [assessmentId, setAssessmentId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [qData, aData] = await Promise.all([
          api.get('/assessments/questions?tool=inteligencia-emocional'),
          api.post('/assessments', { toolSlug: 'inteligencia-emocional' }),
        ]);
        setQuestions(qData.questions || []);
        setAssessmentId(aData.assessment.id);
        if (aData.resumed && aData.assessment.responses) setResponses(aData.assessment.responses || {});
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  const current = questions[currentIndex];
  const answeredCount = Object.keys(responses).length;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const submit = async () => {
    setSubmitting(true); setError('');
    try {
      await api.post('/assessments/' + assessmentId + '/submit', { responses });
      navigate('/dashboard/assessments?completed=true');
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-surface"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <p className="text-primary text-xs font-bold uppercase tracking-widest mb-2">Inteligencia Emocional</p>
          <h1 className="font-headline text-2xl font-bold text-on-surface">Questionario IE-5</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Responda com base no seu comportamento mais frequente nas ultimas semanas.</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-on-surface-variant mb-1.5"><span>Progresso</span><span>{answeredCount} de {questions.length}</span></div>
          <div className="h-2 rounded-full bg-surface-container-highest"><div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: progress + '%' }} /></div>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">{error}</div>}

        {current && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-on-surface-variant">Pergunta {currentIndex + 1} de {questions.length}</span>
              {responses[current.id] && <span className="flex items-center gap-1 text-xs font-medium text-emerald-400"><Check size={14} />Respondida</span>}
            </div>
            <p className="text-lg font-headline font-semibold text-on-surface leading-relaxed mb-6">{current.text}</p>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(value => {
                const selected = responses[current.id] === value;
                return <button key={value} onClick={() => setResponses(prev => ({ ...prev, [current.id]: value }))} className={"w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all " + (selected ? 'border-primary bg-primary/10 text-on-surface' : 'border-outline-variant/20 hover:border-primary/40 text-on-surface-variant')}><span className={"flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold " + (selected ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant/40')}>{value}</span><span className="text-sm font-medium">{scaleLabels[value]}</span></button>;
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0} className="btn-secondary gap-1 disabled:opacity-40"><ChevronLeft size={16} />Anterior</button>
          {currentIndex < questions.length - 1 ? <button onClick={() => setCurrentIndex(currentIndex + 1)} className="btn-primary gap-1">Proxima <ChevronRight size={16} /></button> : <button onClick={submit} disabled={submitting || answeredCount !== questions.length} className="btn-primary gap-2 disabled:opacity-40">{submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}Finalizar</button>}
        </div>
      </div>
    </div>
  );
}
