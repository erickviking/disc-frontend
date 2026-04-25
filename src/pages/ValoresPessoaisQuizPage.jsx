import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ChevronLeft, ChevronRight, Check, Loader2, Home } from 'lucide-react';

const scaleLabels = { 1: 'Nunca ou quase nunca', 2: 'Raramente', 3: 'Às vezes', 4: 'Frequentemente', 5: 'Sempre ou quase sempre' };

export default function ValoresPessoaisQuizPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [assessmentId, setAssessmentId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [qData, aData] = await Promise.all([
          api.get('/assessments/questions?tool=valores-pessoais'),
          api.post('/assessments', { toolSlug: 'valores-pessoais' }),
        ]);
        const loadedQuestions = qData.questions || [];
        const loadedResponses = aData.assessment?.responses || {};
        setQuestions(loadedQuestions);
        setAssessmentId(aData.assessment.id);
        setResponses(loadedResponses);
        if (aData.resumed) {
          const firstMissing = loadedQuestions.findIndex(q => loadedResponses[q.id] === undefined);
          setCurrentIndex(firstMissing >= 0 ? firstMissing : 0);
          setNotice('Seu progresso anterior foi recuperado. Continue de onde parou.');
        }
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  const current = questions[currentIndex];
  const answeredCount = questions.filter(q => responses[q.id] !== undefined).length;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const saveResponses = async (nextResponses) => {
    if (!assessmentId) return;
    setSaving(true);
    try { await api.patch('/assessments/' + assessmentId + '/responses', { responses: nextResponses }); }
    catch { setError('Não foi possível salvar esta resposta. Verifique sua conexão antes de continuar.'); }
    finally { setSaving(false); }
  };

  const selectAnswer = (questionId, value) => {
    setError(''); setNotice('');
    const nextResponses = { ...responses, [questionId]: value };
    setResponses(nextResponses);
    saveResponses(nextResponses);
  };

  const goToFirstMissing = () => {
    const firstMissing = questions.findIndex(q => responses[q.id] === undefined);
    if (firstMissing >= 0) {
      setCurrentIndex(firstMissing);
      setError('Ainda falta responder esta pergunta antes de finalizar.');
      return true;
    }
    return false;
  };

  const submit = async () => {
    if (goToFirstMissing()) return;
    setSubmitting(true); setError(''); setNotice('Finalizando avaliação. O relatório será gerado em seguida.');
    try {
      await saveResponses(responses);
      await api.post('/assessments/' + assessmentId + '/submit', { responses });
      navigate('/dashboard/ferramenta/valores-pessoais?generatingReport=true');
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-surface"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <button onClick={() => navigate('/dashboard')} className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"><Home size={14} /> Voltar ao início</button>
        <div className="mb-8">
          <p className="text-primary text-xs font-bold uppercase tracking-widest mb-2">Valores Pessoais</p>
          <h1 className="font-headline text-2xl font-bold text-on-surface">Questionário VP-6</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Responda com base no que suas escolhas revelam na prática, não apenas no que você considera ideal.</p>
          <p className="mt-2 text-xs text-on-surface-variant/70">Seu progresso é salvo a cada resposta. Você pode sair e voltar depois.</p>
        </div>
        <div className="mb-6">
          <div className="flex justify-between text-xs text-on-surface-variant mb-1.5"><span>Progresso {saving ? '(salvando...)' : ''}</span><span>{answeredCount} de {questions.length}</span></div>
          <div className="h-2 rounded-full bg-surface-container-highest"><div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: progress + '%' }} /></div>
        </div>
        {notice && <div className="mb-4 rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary border border-primary/20">{notice}</div>}
        {error && <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">{error}</div>}
        {current && <div className="card mb-6">
          <div className="flex items-center justify-between mb-6"><span className="text-sm font-medium text-on-surface-variant">Pergunta {currentIndex + 1} de {questions.length}</span>{responses[current.id] !== undefined && <span className="flex items-center gap-1 text-xs font-medium text-emerald-400"><Check size={14} />Respondida</span>}</div>
          <p className="text-lg font-headline font-semibold text-on-surface leading-relaxed mb-3">{current.text}</p>
          {current.helpText && <p className="mb-6 rounded-xl bg-surface-container-high/60 border border-outline-variant/10 px-4 py-3 text-sm text-on-surface-variant leading-relaxed">{current.helpText}</p>}
          <div className="space-y-2">{[1,2,3,4,5].map(value => { const selected = responses[current.id] === value; return <button key={value} onClick={() => selectAnswer(current.id, value)} className={'w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ' + (selected ? 'border-primary bg-primary/10 text-on-surface' : 'border-outline-variant/20 hover:border-primary/40 text-on-surface-variant')}><span className={'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ' + (selected ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant/40')}>{value}</span><span className="text-sm font-medium">{scaleLabels[value]}</span></button>; })}</div>
        </div>}
        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0 || submitting} className="btn-secondary gap-1 disabled:opacity-40"><ChevronLeft size={16} />Anterior</button>
          {currentIndex < questions.length - 1 ? <button onClick={() => setCurrentIndex(currentIndex + 1)} disabled={submitting} className="btn-primary gap-1 disabled:opacity-40">Próxima <ChevronRight size={16} /></button> : <button onClick={submit} disabled={submitting || saving} className="btn-primary gap-2 disabled:opacity-40">{submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}Finalizar</button>}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-1.5">{questions.map((q, i) => { const done = responses[q.id] !== undefined; return <button key={q.id} onClick={() => setCurrentIndex(i)} disabled={submitting} className={'h-3 w-3 rounded-full transition-all disabled:cursor-not-allowed ' + (i === currentIndex ? 'bg-primary scale-125' : done ? 'bg-emerald-400' : 'bg-surface-container-highest hover:bg-outline-variant')} title={'Pergunta ' + (i + 1)} />; })}</div>
      </div>
    </div>
  );
}
