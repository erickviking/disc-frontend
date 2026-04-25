import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';

const dimensionOrder = ['autoconsciencia', 'autorregulacao', 'motivacao', 'empatia', 'habilidades_sociais'];

function ScoreBar({ label, score }) {
  return (
    <div>
      <div className="flex justify-between text-xs uppercase tracking-wider font-semibold mb-1.5">
        <span className="text-on-surface">{label}</span>
        <span className="text-primary">{score}</span>
      </div>
      <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: score + '%' }} />
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return <section className="card"><h2 className="font-headline text-lg font-semibold text-on-surface mb-3">{title}</h2>{children}</section>;
}

export default function InteligenciaEmocionalReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const result = await api.get('/assessments/' + id + '/report');
        setData(result);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-surface"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="card text-center py-16"><p className="text-red-400 mb-4">{error}</p><button onClick={() => navigate('/dashboard')} className="btn-secondary">Voltar</button></div>;

  const narrative = data?.report?.narrative || {};
  const scoresRaw = data?.scoresRaw || {};
  const dimensions = scoresRaw.dimensions || {};
  const subareas = scoresRaw.subareas || {};

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors"><ArrowLeft size={14} /> Voltar</button>

      <div className="relative rounded-2xl overflow-hidden border border-outline-variant/20 p-8 bg-surface-container">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary"><Sparkles size={22} /></div>
          <div>
            <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Relatorio IE-5</p>
            <h1 className="font-headline text-3xl font-bold text-on-surface">Inteligencia Emocional</h1>
            <p className="mt-2 text-sm text-on-surface-variant max-w-2xl">Leitura personalizada por IA a partir de scores calculados de forma deterministica.</p>
          </div>
        </div>
      </div>

      {scoresRaw.overall && (
        <Section title="Score geral">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="text-center rounded-2xl bg-surface-container-high p-6">
              <p className="text-5xl font-bold text-primary">{scoresRaw.overall.score}</p>
              <p className="text-xs text-on-surface-variant uppercase tracking-widest mt-2">Score geral</p>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dimensionOrder.map(id => dimensions[id] && <ScoreBar key={id} label={dimensions[id].name} score={dimensions[id].score} />)}
            </div>
          </div>
        </Section>
      )}

      {narrative.resumoExecutivo && <Section title="Resumo executivo"><p className="text-sm text-on-surface-variant leading-relaxed">{narrative.resumoExecutivo}</p></Section>}
      {narrative.leituraCentral && <Section title="Leitura central"><p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">{narrative.leituraCentral}</p></Section>}

      {narrative.dimensoes && (
        <Section title="Analise por dimensao">
          <div className="space-y-4">
            {dimensionOrder.map(key => narrative.dimensoes[key] && (
              <div key={key} className="rounded-xl bg-surface-container-high/50 p-4 border border-outline-variant/10">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <h3 className="font-headline font-semibold text-on-surface">{narrative.dimensoes[key].titulo}</h3>
                  {dimensions[key] && <span className="text-xs font-bold text-primary">{dimensions[key].score}/100</span>}
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">{narrative.dimensoes[key].analise}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-xs">
                  <div><span className="text-emerald-400 font-semibold">Forca: </span><span className="text-on-surface-variant">{narrative.dimensoes[key].forca}</span></div>
                  <div><span className="text-amber-400 font-semibold">Atencao: </span><span className="text-on-surface-variant">{narrative.dimensoes[key].pontoDeAtencao}</span></div>
                  <div><span className="text-primary font-semibold">Microacao: </span><span className="text-on-surface-variant">{narrative.dimensoes[key].microAcao}</span></div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.isArray(narrative.subareasCriticas) && <Section title="Subareas criticas">{narrative.subareasCriticas.map((item, i) => <div key={i} className="mb-4 last:mb-0"><p className="font-semibold text-on-surface text-sm">{item.subarea} {item.score !== undefined ? '(' + item.score + ')' : ''}</p><p className="text-xs text-on-surface-variant mt-1">{item.leitura}</p><p className="text-xs text-amber-400 mt-1">{item.riscoComportamental}</p><p className="text-xs text-primary mt-1">Acao: {item.acao}</p></div>)}</Section>}
        {Array.isArray(narrative.subareasFortes) && <Section title="Subareas fortes">{narrative.subareasFortes.map((item, i) => <div key={i} className="mb-4 last:mb-0"><p className="font-semibold text-on-surface text-sm">{item.subarea} {item.score !== undefined ? '(' + item.score + ')' : ''}</p><p className="text-xs text-on-surface-variant mt-1">{item.leitura}</p><p className="text-xs text-emerald-400 mt-1">Como usar melhor: {item.comoUsarMelhor}</p></div>)}</Section>}
      </div>

      {narrative.padroesEmPressao && <Section title="Padroes sob pressao"><p className="text-sm text-on-surface-variant leading-relaxed">{narrative.padroesEmPressao}</p></Section>}
      {narrative.impactoNosRelacionamentos && <Section title="Impacto nos relacionamentos"><p className="text-sm text-on-surface-variant leading-relaxed">{narrative.impactoNosRelacionamentos}</p></Section>}

      {Array.isArray(narrative.planoDeDesenvolvimento30Dias) && <Section title="Plano de desenvolvimento - 30 dias"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{narrative.planoDeDesenvolvimento30Dias.map((week, i) => <div key={i} className="rounded-xl bg-surface-container-high/50 p-4"><p className="text-primary text-xs font-bold uppercase tracking-widest">Semana {week.semana}</p><p className="font-semibold text-on-surface mt-1">{week.foco}</p><p className="text-xs text-on-surface-variant mt-2">{week.pratica}</p><p className="text-xs text-emerald-400 mt-2">Indicador: {week.indicador}</p></div>)}</div></Section>}

      {narrative.fraseFinal && <div className="card text-center"><p className="font-headline text-xl text-primary italic">{narrative.fraseFinal}</p></div>}
    </div>
  );
}
