import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ArrowLeft, Download, Loader2, Sparkles, AlertTriangle, TrendingUp, MessageCircle, Target } from 'lucide-react';

const dimensionOrder = ['autoconsciencia', 'autorregulacao', 'motivacao', 'empatia', 'habilidades_sociais'];
const dimensionColors = {
  autoconsciencia: '#E63946',
  autorregulacao: '#F4A261',
  motivacao: '#d4a853',
  empatia: '#2A9D8F',
  habilidades_sociais: '#4c6ef5',
};

function DimensionRadar({ dimensions }) {
  const size = 320;
  const center = size / 2;
  const radius = 118;
  const angles = dimensionOrder.map((_, i) => (Math.PI * 2 * i) / dimensionOrder.length - Math.PI / 2);
  const getPoint = (angle, value) => ({ x: center + Math.cos(angle) * (radius * value / 100), y: center + Math.sin(angle) * (radius * value / 100) });
  const points = dimensionOrder.map((id, i) => getPoint(angles[i], dimensions[id]?.score || 0));
  const polygon = points.map(p => p.x + ',' + p.y).join(' ');

  return (
    <svg viewBox={'0 0 ' + size + ' ' + size} className="w-full max-w-[320px] mx-auto">
      {[20, 40, 60, 80, 100].map(v => <polygon key={v} points={dimensionOrder.map((_, i) => { const p = getPoint(angles[i], v); return p.x + ',' + p.y; }).join(' ')} fill="none" stroke="rgba(61,56,48,0.45)" strokeWidth="1" />)}
      {dimensionOrder.map((_, i) => { const p = getPoint(angles[i], 100); return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="rgba(61,56,48,0.45)" strokeWidth="1" />; })}
      <polygon points={polygon} fill="rgba(212,168,83,0.16)" stroke="#d4a853" strokeWidth="2.5" />
      {dimensionOrder.map((id, i) => {
        const p = points[i];
        const labelPoint = getPoint(angles[i], 128);
        const label = dimensions[id]?.name || id;
        const shortLabel = label.replace('Habilidades Sociais', 'Hab. Sociais');
        return (
          <g key={id}>
            <circle cx={p.x} cy={p.y} r="5" fill={dimensionColors[id]} />
            <text x={labelPoint.x} y={labelPoint.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700" fill={dimensionColors[id]}>{shortLabel}</text>
            <text x={labelPoint.x} y={labelPoint.y + 13} textAnchor="middle" fontSize="9" fill="#bfb5a8">{dimensions[id]?.score || 0}</text>
          </g>
        );
      })}
    </svg>
  );
}

function ScoreBar({ id, label, score }) {
  const color = dimensionColors[id] || '#d4a853';
  return (
    <div>
      <div className="flex justify-between text-xs uppercase tracking-wider font-semibold mb-1.5">
        <span className="text-on-surface">{label}</span>
        <span style={{ color }}>{score}</span>
      </div>
      <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: score + '%', backgroundColor: color }} />
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children, color = 'text-primary bg-primary/15' }) {
  return <div className="card mb-6"><div className="flex items-center gap-2 mb-3"><div className={'rounded-lg p-1.5 ' + color}><Icon size={16} /></div><h2 className="font-headline text-xl font-semibold text-on-surface">{title}</h2></div>{children}</div>;
}

export default function InteligenciaEmocionalReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      try { setData(await api.get('/assessments/' + id + '/report')); }
      catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const token = api.getToken();
      const res = await fetch('/api/reports/' + id + '/pdf', { headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Erro ao gerar PDF'); }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'relatorio-inteligencia-emocional.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) { alert('Erro ao baixar PDF: ' + e.message); }
    finally { setDownloading(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-surface"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="p-8"><div className="card text-center py-12"><p className="text-red-400">{error}</p><button onClick={() => navigate(-1)} className="btn-secondary mt-4 gap-2"><ArrowLeft size={16} />Voltar</button></div></div>;

  const narrative = data?.report?.narrative || {};
  const scoresRaw = data?.scoresRaw || {};
  const dimensions = scoresRaw.dimensions || {};
  const userName = data?.userName || 'Usuário';

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="btn-secondary gap-1"><ArrowLeft size={16} />Voltar</button>
          <button onClick={downloadPDF} disabled={downloading} className="btn-primary gap-2">
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Baixar PDF
          </button>
        </div>

        <div className="card mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant/50 mb-2">Relatório IE-5</p>
          <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">{userName}</h1>
          <p className="text-sm text-on-surface-variant">Inteligência Emocional</p>
          <div className="mt-6"><DimensionRadar dimensions={dimensions} /></div>
        </div>

        {scoresRaw.overall && (
          <div className="card mb-6">
            <h2 className="font-headline text-xl font-semibold text-on-surface mb-4">Score Geral</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="text-center rounded-2xl bg-surface-container-high p-6">
                <p className="text-5xl font-bold text-primary">{scoresRaw.overall.score}</p>
                <p className="text-xs text-on-surface-variant uppercase tracking-widest mt-2">Score geral</p>
              </div>
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dimensionOrder.map(dimId => dimensions[dimId] && <ScoreBar key={dimId} id={dimId} label={dimensions[dimId].name} score={dimensions[dimId].score} />)}
              </div>
            </div>
          </div>
        )}

        {narrative.resumoExecutivo && <div className="card mb-6"><h2 className="font-headline text-xl font-semibold text-on-surface mb-3">Resumo Executivo</h2><p className="text-sm text-on-surface-variant leading-relaxed">{narrative.resumoExecutivo}</p></div>}
        {narrative.leituraCentral && <div className="card mb-6"><h2 className="font-headline text-xl font-semibold text-on-surface mb-3">Leitura Central</h2><p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">{narrative.leituraCentral}</p></div>}

        {narrative.dimensoes && (
          <Section icon={Sparkles} title="Análise por Dimensão" color="text-primary bg-primary/15">
            <div className="space-y-3">
              {dimensionOrder.map(key => narrative.dimensoes[key] && (
                <div key={key} className="rounded-xl bg-surface-container-high/50 p-4 border border-outline-variant/10">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className="font-headline font-semibold" style={{ color: dimensionColors[key] }}>{narrative.dimensoes[key].titulo}</h3>
                    {dimensions[key] && <span className="text-xs font-bold" style={{ color: dimensionColors[key] }}>{dimensions[key].score}/100</span>}
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">{narrative.dimensoes[key].analise}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-xs">
                    <div><span className="text-emerald-400 font-semibold">Força: </span><span className="text-on-surface-variant">{narrative.dimensoes[key].forca}</span></div>
                    <div><span className="text-amber-400 font-semibold">Atenção: </span><span className="text-on-surface-variant">{narrative.dimensoes[key].pontoDeAtencao}</span></div>
                    <div><span className="text-primary font-semibold">Microação: </span><span className="text-on-surface-variant">{narrative.dimensoes[key].microAcao}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.isArray(narrative.subareasCriticas) && <Section icon={AlertTriangle} title="Subáreas Críticas" color="text-amber-400 bg-amber-500/15">{narrative.subareasCriticas.map((item, i) => <div key={i} className="mb-4 last:mb-0 rounded-xl bg-amber-500/5 border border-amber-500/15 px-4 py-3"><p className="font-semibold text-on-surface text-sm">{item.subarea} {item.score !== undefined ? '(' + item.score + ')' : ''}</p><p className="text-xs text-on-surface-variant mt-1">{item.leitura}</p><p className="text-xs text-amber-400 mt-1">{item.riscoComportamental}</p><p className="text-xs text-primary mt-1">Ação: {item.acao}</p></div>)}</Section>}
          {Array.isArray(narrative.subareasFortes) && <Section icon={TrendingUp} title="Subáreas Fortes" color="text-emerald-400 bg-emerald-500/15">{narrative.subareasFortes.map((item, i) => <div key={i} className="mb-4 last:mb-0 rounded-xl bg-emerald-500/5 border border-emerald-500/15 px-4 py-3"><p className="font-semibold text-on-surface text-sm">{item.subarea} {item.score !== undefined ? '(' + item.score + ')' : ''}</p><p className="text-xs text-on-surface-variant mt-1">{item.leitura}</p><p className="text-xs text-emerald-400 mt-1">Como usar melhor: {item.comoUsarMelhor}</p></div>)}</Section>}
        </div>

        {narrative.padroesEmPressao && <Section icon={AlertTriangle} title="Padrões sob Pressão" color="text-amber-400 bg-amber-500/15"><p className="text-sm text-on-surface-variant leading-relaxed">{narrative.padroesEmPressao}</p></Section>}
        {narrative.impactoNosRelacionamentos && <Section icon={MessageCircle} title="Impacto nos Relacionamentos" color="text-[#2A9D8F] bg-[#2A9D8F]/15"><p className="text-sm text-on-surface-variant leading-relaxed">{narrative.impactoNosRelacionamentos}</p></Section>}

        {Array.isArray(narrative.planoDeDesenvolvimento30Dias) && <Section icon={Target} title="Plano de Desenvolvimento — 30 dias" color="text-primary bg-primary/15"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{narrative.planoDeDesenvolvimento30Dias.map((week, i) => <div key={i} className="rounded-xl bg-surface-container-high/50 p-4"><p className="text-primary text-xs font-bold uppercase tracking-widest">Semana {week.semana}</p><p className="font-semibold text-on-surface mt-1">{week.foco}</p><p className="text-xs text-on-surface-variant mt-2">{week.pratica}</p><p className="text-xs text-emerald-400 mt-2">Indicador: {week.indicador}</p></div>)}</div></Section>}

        {narrative.fraseFinal && <div className="card mb-6 text-center"><p className="font-headline text-xl text-primary italic">{narrative.fraseFinal}</p></div>}

        <div className="text-center text-xs text-on-surface-variant/40 py-4"><p>Vanessa Rocha — Inteligência Emocional</p><p className="mt-1">Gerado em {new Date(data.report.generatedAt).toLocaleDateString('pt-BR')}</p></div>
      </div>
    </div>
  );
}
