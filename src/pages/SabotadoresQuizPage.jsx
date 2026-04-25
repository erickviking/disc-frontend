import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Home, Loader2, Shield, Zap, Brain, Wrench } from 'lucide-react';

const phaseMeta = {
  scenarios: { label: 'Cenários', icon: Shield, description: 'Como você reage em situações reais.' },
  triggers: { label: 'Gatilhos', icon: Zap, description: 'O que ativa seus padrões automáticos.' },
  pattern: { label: 'Padrão automático', icon: Brain, description: 'A frase interna e o comportamento que aparecem.' },
  antidote: { label: 'Antídoto', icon: Wrench, description: 'A resposta prática que começa a neutralizar o padrão.' },
};

export default function SabotadoresQuizPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [assessmentId, setAssessmentId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => { (async () => {
    try {
      const [qData, aData] = await Promise.all([api.get('/assessments/questions?tool=sabotadores'), api.post('/assessments', { toolSlug: 'sabotadores' })]);
      const loadedQuestions = qData.questions || [];
      const loadedResponses = aData.assessment?.responses || {};
      setQuestions(loadedQuestions); setAssessmentId(aData.assessment.id); setResponses(loadedResponses);
      if (aData.resumed) { const firstMissing = loadedQuestions.findIndex(q => loadedResponses[q.id] === undefined || loadedResponses[q.id] === '' || (Array.isArray(loadedResponses[q.id]) && loadedResponses[q.id].length === 0)); setCurrentIndex(firstMissing >= 0 ? firstMissing : 0); setNotice('Seu progresso foi recuperado. Continue de onde parou.'); }
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  })(); }, []);

  const current = questions[currentIndex];
  const answeredCount = questions.filter(q => responses[q.id] !== undefined && responses[q.id] !== '' && !(Array.isArray(responses[q.id]) && responses[q.id].length === 0)).length;
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const phase = current?.phase || 'scenarios';
  const PhaseIcon = phaseMeta[phase]?.icon || Shield;

  const saveResponses = async (next) => { if (!assessmentId) return; setSaving(true); try { await api.patch('/assessments/' + assessmentId + '/responses', { responses: next }); } catch { setError('Não foi possível salvar. Verifique sua conexão.'); } finally { setSaving(false); } };
  const setAnswer = (id, value) => { setError(''); setNotice(''); const next = { ...responses, [id]: value }; setResponses(next); saveResponses(next); };
  const toggleMulti = (id, value) => { const currentValues = Array.isArray(responses[id]) ? responses[id] : []; const nextValues = currentValues.includes(value) ? currentValues.filter(v => v !== value) : [...currentValues, value]; setAnswer(id, nextValues); };
  const firstMissing = () => questions.findIndex(q => responses[q.id] === undefined || responses[q.id] === '' || (Array.isArray(responses[q.id]) && responses[q.id].length === 0));
  const submit = async () => { const missing = firstMissing(); if (missing >= 0) { setCurrentIndex(missing); setError('Ainda falta responder esta etapa.'); return; } setSubmitting(true); try { await saveResponses(responses); await api.post('/assessments/' + assessmentId + '/submit', { responses }); navigate('/dashboard/ferramenta/sabotadores?generatingReport=true'); } catch(e) { setError(e.message); } finally { setSubmitting(false); } };

  const renderInput = () => {
    if (!current) return null;
    if (current.type === 'text') return <textarea rows={4} value={responses[current.id] || ''} onChange={e => setAnswer(current.id, e.target.value)} placeholder="Escreva aqui..." className="input-field text-sm leading-relaxed" />;
    if (current.type === 'scale') return <div className="space-y-4"><div className="flex justify-between text-xs text-on-surface-variant"><span>{current.min}</span><span>{current.max}</span></div><input type="range" min={current.min} max={current.max} value={responses[current.id] ?? 0} onChange={e => setAnswer(current.id, Number(e.target.value))} className="w-full accent-primary" /><div className="text-center"><span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-3xl font-bold text-primary">{responses[current.id] ?? 0}</span></div></div>;
    if (current.type === 'multi_choice') return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{current.options.map(option => { const selected = Array.isArray(responses[current.id]) && responses[current.id].includes(option.value); return <button key={option.id} onClick={() => toggleMulti(current.id, option.value)} className={'rounded-2xl border px-4 py-4 text-left transition-all ' + (selected ? 'border-primary bg-primary/10 text-on-surface' : 'border-outline-variant/20 bg-surface-container-low text-on-surface-variant hover:border-primary/40')}><div className="flex items-start gap-3"><span className={'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ' + (selected ? 'bg-primary text-on-primary' : 'bg-surface-container-high')}>{option.id}</span><span className="text-sm font-medium">{option.label}</span></div></button>; })}</div>;
    return <div className="space-y-3">{(current.options || []).map(option => { const selected = responses[current.id] === option.value; return <button key={option.id} onClick={() => setAnswer(current.id, option.value)} className={'w-full rounded-2xl border px-4 py-4 text-left transition-all ' + (selected ? 'border-primary bg-primary/10 text-on-surface shadow-sm' : 'border-outline-variant/20 bg-surface-container-low text-on-surface-variant hover:border-primary/40')}><div className="flex items-start gap-3"><span className={'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ' + (selected ? 'bg-primary text-on-primary' : 'bg-surface-container-high')}>{option.id}</span><span className="text-sm font-medium leading-relaxed">{option.label}</span></div></button>; })}</div>;
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-surface"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  return <div className="min-h-screen bg-surface"><div className="mx-auto max-w-3xl px-4 py-8">
    <button onClick={() => navigate('/dashboard')} className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-on-surface-variant hover:text-primary"><Home size={14} />Voltar ao início</button>
    <div className="mb-8"><p className="text-primary text-xs font-bold uppercase tracking-widest mb-2">Mapa de Sabotadores Internos</p><h1 className="font-headline text-2xl font-bold text-on-surface">Cenários, gatilhos e antídotos</h1><p className="mt-1 text-sm text-on-surface-variant">Você vai identificar padrões automáticos que aparecem antes da sabotagem e construir uma resposta prática para interrompê-los.</p><p className="mt-2 text-xs text-on-surface-variant/70">Seu progresso é salvo a cada resposta.</p></div>
    <div className="mb-6"><div className="flex justify-between text-xs text-on-surface-variant mb-1.5"><span>Progresso {saving ? '(salvando...)' : ''}</span><span>{answeredCount} de {questions.length}</span></div><div className="h-2 rounded-full bg-surface-container-highest"><div className="h-full rounded-full bg-primary" style={{ width: progress + '%' }} /></div></div>
    {notice && <div className="mb-4 rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary border border-primary/20">{notice}</div>}{error && <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">{error}</div>}
    {current && <div className="card mb-6"><div className="flex items-center justify-between mb-6"><span className="text-sm text-on-surface-variant">Etapa {currentIndex + 1} de {questions.length}</span>{responses[current.id] !== undefined && responses[current.id] !== '' && <span className="flex items-center gap-1 text-xs text-emerald-400"><Check size={14} />Respondida</span>}</div><div className="mb-4 flex items-center gap-2"><div className="rounded-lg bg-primary/10 p-2 text-primary"><PhaseIcon size={16} /></div><div><p className="text-xs font-bold uppercase tracking-widest text-primary">{phaseMeta[phase]?.label}</p><p className="text-xs text-on-surface-variant">{phaseMeta[phase]?.description}</p></div></div><p className="text-lg font-headline font-semibold text-on-surface leading-relaxed mb-3">{current.text}</p>{current.helpText && <p className="mb-6 rounded-xl bg-surface-container-high/60 border border-outline-variant/10 px-4 py-3 text-sm text-on-surface-variant leading-relaxed">{current.helpText}</p>}{renderInput()}</div>}
    <div className="flex items-center justify-between"><button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0 || submitting} className="btn-secondary gap-1 disabled:opacity-40"><ChevronLeft size={16} />Anterior</button>{currentIndex < questions.length - 1 ? <button onClick={() => setCurrentIndex(currentIndex + 1)} disabled={submitting} className="btn-primary gap-1">Próxima <ChevronRight size={16} /></button> : <button onClick={submit} disabled={submitting || saving} className="btn-primary gap-2 disabled:opacity-40">{submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}Gerar mapa</button>}</div>
    <div className="mt-6 flex flex-wrap justify-center gap-1.5">{questions.map((q,i)=>{ const done = responses[q.id] !== undefined && responses[q.id] !== '' && !(Array.isArray(responses[q.id]) && responses[q.id].length===0); return <button key={q.id} onClick={()=>setCurrentIndex(i)} className={'h-3 w-3 rounded-full ' + (i===currentIndex ? 'bg-primary scale-125' : done ? 'bg-emerald-400' : 'bg-surface-container-highest')} />; })}</div>
  </div></div>;
}
