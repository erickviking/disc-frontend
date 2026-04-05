const fs = require('fs');
const path = require('path');
function w(f, c) {
  const d = path.dirname(f);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(f, c, 'utf8');
  console.log('OK:', f);
}

w('../frontend/src/pages/QuizPage.jsx', `import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';

export default function QuizPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [assessmentId, setAssessmentId] = useState(null);
  const [currentGroup, setCurrentGroup] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [qData, aData] = await Promise.all([
          api.get('/assessments/questions'),
          api.post('/assessments', {}),
        ]);
        setQuestions(qData.questions);
        setAssessmentId(aData.assessment.id);
        if (aData.resumed && aData.assessment.responses) {
          const saved = {};
          for (const r of aData.assessment.responses) {
            saved[r.groupIndex] = { most: r.most, least: r.least };
          }
          setResponses(saved);
        }
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  const current = questions[currentGroup];
  const resp = responses[currentGroup] || { most: null, least: null };
  const isGroupComplete = resp.most && resp.least;
  const answeredCount = Object.keys(responses).filter(k => responses[k].most && responses[k].least).length;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const selectWord = (wordId, type) => {
    const cur = responses[currentGroup] || { most: null, least: null };
    const other = type === 'most' ? 'least' : 'most';
    if (cur[other] === wordId) return;
    setResponses({ ...responses, [currentGroup]: { ...cur, [type]: wordId } });
  };

  const submit = async () => {
    setSubmitting(true); setError('');
    try {
      const formatted = Object.entries(responses).map(([gi, r]) => ({
        groupIndex: parseInt(gi), most: r.most, least: r.least,
      }));
      await api.post('/assessments/' + assessmentId + '/submit', { responses: formatted });
      navigate('/dashboard/assessments?completed=true');
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"/></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl text-gray-900">Questionario DISC</h1>
          <p className="mt-1 text-sm text-gray-500">Escolha a palavra que MAIS e a que MENOS descreve voce em cada grupo</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Progresso</span>
            <span>{answeredCount} de {questions.length}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-brand-600 transition-all duration-300" style={{width: progress + '%'}} />
          </div>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">{error}</div>}

        {current && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-gray-500">Grupo {currentGroup + 1} de {questions.length}</span>
              {isGroupComplete && <span className="flex items-center gap-1 text-xs font-medium text-green-600"><Check size={14}/>Completo</span>}
            </div>

            {/* Header row */}
            <div className="flex items-center mb-3 px-4">
              <div className="flex-1"></div>
              <div className="w-10 text-center text-xs font-semibold text-brand-700 uppercase tracking-wider">Mais</div>
              <div className="w-4"></div>
              <div className="w-10 text-center text-xs font-semibold text-red-600 uppercase tracking-wider">Menos</div>
            </div>

            {/* Word rows */}
            {current.words.map(word => {
              const isMost = resp.most === word.id;
              const isLeast = resp.least === word.id;
              return (
                <div key={word.id} className={"flex items-center rounded-lg border px-4 py-3 mb-2 transition-all " + (isMost ? "border-brand-300 bg-brand-50" : isLeast ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300")}>
                  <div className="flex-1 text-sm font-medium text-gray-900">{word.text}</div>
                  <button onClick={() => selectWord(word.id, 'most')}
                    className={"flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all " + (isMost ? "border-brand-600 bg-brand-600" : "border-gray-300 hover:border-brand-400")}>
                    {isMost && <Check size={14} className="text-white"/>}
                  </button>
                  <div className="w-4"></div>
                  <button onClick={() => selectWord(word.id, 'least')}
                    className={"flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all " + (isLeast ? "border-red-500 bg-red-500" : "border-gray-300 hover:border-red-400")}>
                    {isLeast && <Check size={14} className="text-white"/>}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentGroup(Math.max(0, currentGroup - 1))} disabled={currentGroup === 0}
            className="btn-secondary gap-1 disabled:opacity-40"><ChevronLeft size={16}/>Anterior</button>

          {currentGroup < questions.length - 1 ? (
            <button onClick={() => setCurrentGroup(currentGroup + 1)}
              className="btn-primary gap-1">Proximo <ChevronRight size={16}/></button>
          ) : (
            <button onClick={submit} disabled={submitting || answeredCount < questions.length}
              className="btn-primary gap-2 disabled:opacity-40">
              {submitting ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>}
              Finalizar
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-1.5">
          {questions.map((_, i) => {
            const done = responses[i]?.most && responses[i]?.least;
            return (
              <button key={i} onClick={() => setCurrentGroup(i)}
                className={"h-3 w-3 rounded-full transition-all " + (i === currentGroup ? "bg-brand-600 scale-125" : done ? "bg-green-400" : "bg-gray-300 hover:bg-gray-400")}
                title={"Grupo " + (i + 1)} />
            );
          })}
        </div>
      </div>
    </div>
  );
}
`);

console.log('\\nQuizPage corrigido! Refresh no navegador.');
