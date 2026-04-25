import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ArrowLeft, Download, Loader2, Compass, AlertTriangle, TrendingUp, Heart, Target, Coins, Sparkles } from 'lucide-react';

const dimensionOrder = ['identidade', 'familia_relacionamentos', 'crescimento', 'contribuicao', 'prosperidade', 'espiritualidade_proposito'];
const dimensionColors = { identidade: '#E63946', familia_relacionamentos: '#ec4899', crescimento: '#4c6ef5', contribuicao: '#2A9D8F', prosperidade: '#F4A261', espiritualidade_proposito: '#d4a853' };

function DimensionRadar({ dimensions }) {
  const size = 340, center = size / 2, radius = 125;
  const angles = dimensionOrder.map((_, i) => (Math.PI * 2 * i) / dimensionOrder.length - Math.PI / 2);
  const getPoint = (angle, value) => ({ x: center + Math.cos(angle) * (radius * value / 100), y: center + Math.sin(angle) * (radius * value / 100) });
  const points = dimensionOrder.map((id, i) => getPoint(angles[i], dimensions[id]?.score || 0));
  return <svg viewBox={'0 0 ' + size + ' ' + size} className="w-full max-w-[340px] mx-auto">
    {[20,40,60,80,100].map(v => <polygon key={v} points={dimensionOrder.map((_, i) => { const p = getPoint(angles[i], v); return p.x + ',' + p.y; }).join(' ')} fill="none" stroke="rgba(61,56,48,0.45)" strokeWidth="1" />)}
    {dimensionOrder.map((_, i) => { const p = getPoint(angles[i], 100); return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="rgba(61,56,48,0.45)" strokeWidth="1" />; })}
    <polygon points={points.map(p => p.x + ',' + p.y).join(' ')} fill="rgba(212,168,83,0.16)" stroke="#d4a853" strokeWidth="2.5" />
    {dimensionOrder.map((id, i) => { const p = points[i]; const lp = getPoint(angles[i], 132); const label = (dimensions[id]?.name || id).replace('Família e Relacionamentos', 'Família').replace('Espiritualidade e Propósito', 'Propósito'); return <g key={id}><circle cx={p.x} cy={p.y} r="5" fill={dimensionColors[id]} /><text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700" fill={dimensionColors[id]}>{label}</text><text x={lp.x} y={lp.y + 13} textAnchor="middle" fontSize="9" fill="#bfb5a8">{dimensions[id]?.score || 0}</text></g>; })}
  </svg>;
}

function ScoreBar({ id, label, score }) {
  const color = dimensionColors[id] || '#d4a853';
  return <div><div className="flex justify-between text-xs uppercase tracking-wider font-semibold mb-1.5"><span className="text-on-surface">{label}</span><span style={{ color }}>{score}</span></div><div className="h-2 rounded-full bg-surface-container-highest overflow-hidden"><div className="h-full rounded-full transition-all duration-700" style={{ width: score + '%', backgroundColor: color }} /></div></div>;
}

function Section({ icon: Icon, title, children, color = 'text-primary bg-primary/15' }) {
  return <div className="card mb-6"><div className="flex items-center gap-2 mb-3"><div className={'rounded-lg p-1.5 ' + color}><Icon size={16} /></div><h2 className="font-headline text-xl font-semibold text-on-surface">{title}</h2></div>{children}</div>;
}

export default function ValoresPessoaisReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { (async () => { try { setData(await api.get('/assessments/' + id + '/report')); } catch (e) { setError(e.message); } finally { setLoading(false); } })(); }, [id]);

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const token = api.getToken();
      const response = await fetch('/api/reports/' + id + '/pdf', { headers: { Authorization: 'Bearer ' + token } });
      if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.error || 'Erro ao gerar PDF'); }
      const blob = await response.blob(); const url = window.URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'relatorio-valores-pessoais.pdf'; document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url);
    } catch (e) { alert('Erro ao baixar PDF: ' + e.message); } finally { setDownloading(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-surface"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="p-8"><div className="card text-center py-12"><p className="text-red-400">{error}</p><button onClick={() => navigate(-1)} className="btn-secondary mt-4 gap-2"><ArrowLeft size={16} />Voltar</button></div></div>;

  const narrative = data?.report?.narrative || {};
  const scoresRaw = data?.scoresRaw || {};
  const dimensions = scoresRaw.dimensions || {};
  const userName = data?.userName || 'Usuário';

  return <div className="min-h-screen bg-surface"><div className="mx-auto max-w-3xl px-4 py-8">
    <div className="flex items-center justify-between mb-6"><button onClick={() => navigate(-1)} className="btn-secondary gap-1"><ArrowLeft size={16} />Voltar</button><button onClick={downloadPDF} disabled={downloading} className="btn-primary gap-2">{downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}Baixar PDF</button></div>
    <div className="card mb-6 text-center"><p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant/50 mb-2">Relatório VP-6</p><h1 className="font-headline text-2xl font-bold text-on-surface mb-1">{userName}</h1><p className="text-sm text-on-surface-variant">Valores Pessoais</p><div className="mt-6"><DimensionRadar dimensions={dimensions} /></div></div>
    {scoresRaw.overall && <div className="card mb-6"><h2 className="font-headline text-xl font-semibold text-on-surface mb-4">Score Geral</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center"><div className="text-center rounded-2xl bg-surface-container-high p-6"><p className="text-5xl font-bold text-primary">{scoresRaw.overall.score}</p><p className="text-xs text-on-surface-variant uppercase tracking-widest mt-2">Score geral</p></div><div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">{dimensionOrder.map(k => dimensions[k] && <ScoreBar key={k} id={k} label={dimensions[k].name} score={dimensions[k].score} />)}</div></div></div>}
    {narrative.resumoExecutivo && <div className="card mb-6"><h2 className="font-headline text-xl font-semibold text-on-surface mb-3">Resumo Executivo</h2><p className="text-sm text-on-surface-variant leading-relaxed">{narrative.resumoExecutivo}</p></div>}
    {narrative.leituraCentral && <div className="card mb-6"><h2 className="font-headline text-xl font-semibold text-on-surface mb-3">Leitura Central</h2><p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">{narrative.leituraCentral}</p></div>}
    {Array.isArray(narrative.valoresDominantes) && <Section icon={TrendingUp} title="Valores Dominantes" color="text-emerald-400 bg-emerald-500/15"><div className="space-y-3">{narrative.valoresDominantes.map((item, i) => <div key={i} className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 px-4 py-3"><div className="flex items-center justify-between mb-1"><p className="text-sm font-semibold text-on-surface">{item.valor}</p>{item.score !== undefined && <span className="text-xs font-bold text-emerald-400">{item.score}</span>}</div><p className="text-xs text-on-surface-variant mt-1">{item.leitura}</p><p className="text-xs text-emerald-400 mt-2">Como usar melhor: {item.comoUsarMelhor}</p></div>)}</div></Section>}
    {Array.isArray(narrative.valoresQuePedemAtencao) && <Section icon={AlertTriangle} title="Valores que Pedem Atenção" color="text-amber-400 bg-amber-500/15"><div className="space-y-3">{narrative.valoresQuePedemAtencao.map((item, i) => <div key={i} className="rounded-xl bg-amber-500/5 border border-amber-500/15 px-4 py-3"><div className="flex items-center justify-between mb-1"><p className="text-sm font-semibold text-on-surface">{item.valor}</p>{item.score !== undefined && <span className="text-xs font-bold text-amber-400">{item.score}</span>}</div><p className="text-xs text-on-surface-variant mt-1">{item.leitura}</p><p className="text-xs text-amber-400 mt-2">{item.riscoDeDesalinhamento}</p><p className="text-xs text-primary mt-2">Ação: {item.acao}</p></div>)}</div></Section>}
    {Array.isArray(narrative.tensoesInternas) && <Section icon={AlertTriangle} title="Tensões Internas" color="text-amber-400 bg-amber-500/15"><div className="space-y-3">{narrative.tensoesInternas.map((item, i) => <div key={i} className="rounded-xl bg-amber-500/5 border border-amber-500/15 px-4 py-3"><div className="flex items-center justify-between mb-1"><p className="text-sm font-semibold text-on-surface">{item.tensao}</p><span className="text-xs font-bold text-amber-400 uppercase">{item.severidade}</span></div><p className="text-xs text-on-surface-variant mt-1">{item.leitura}</p><p className="text-xs text-amber-400 mt-2">Como aparece: {item.comoAparece}</p><p className="text-xs text-primary mt-2">Ação: {item.acaoDeAlinhamento}</p></div>)}</div></Section>}
    {Array.isArray(narrative.sinergias) && <Section icon={Sparkles} title="Sinergias" color="text-primary bg-primary/15"><div className="space-y-3">{narrative.sinergias.map((item, i) => <div key={i} className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3"><div className="flex items-center justify-between mb-1"><p className="text-sm font-semibold text-on-surface">{item.sinergia}</p><span className="text-xs font-bold text-primary uppercase">{item.forca}</span></div><p className="text-xs text-on-surface-variant mt-1">{item.leitura}</p><p className="text-xs text-primary mt-2">Como potencializar: {item.comoPotencializar}</p></div>)}</div></Section>}
    {narrative.impactoNasDecisoes && <Section icon={Compass} title="Impacto nas Decisões"><p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">{narrative.impactoNasDecisoes}</p></Section>}
    {narrative.impactoNosRelacionamentos && <Section icon={Heart} title="Impacto nos Relacionamentos" color="text-pink-400 bg-pink-500/15"><p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">{narrative.impactoNosRelacionamentos}</p></Section>}
    {narrative.impactoNaProsperidade && <Section icon={Coins} title="Impacto na Prosperidade" color="text-[#F4A261] bg-[#F4A261]/15"><p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">{narrative.impactoNaProsperidade}</p></Section>}
    {narrative.impactoNoProposito && <Section icon={Sparkles} title="Impacto no Propósito"><p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">{narrative.impactoNoProposito}</p></Section>}
    {Array.isArray(narrative.planoDeAlinhamento30Dias) && <Section icon={Target} title="Plano de Alinhamento — 30 dias"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{narrative.planoDeAlinhamento30Dias.map((week, i) => <div key={i} className="rounded-xl bg-surface-container-high/50 p-4"><p className="text-primary text-xs font-bold uppercase tracking-widest">Semana {week.semana}</p><p className="font-semibold text-on-surface mt-1">{week.foco}</p><p className="text-xs text-on-surface-variant mt-2">{week.pratica}</p><p className="text-xs text-emerald-400 mt-2">Indicador: {week.indicador}</p></div>)}</div></Section>}
    {narrative.fraseFinal && <div className="card mb-6 text-center"><p className="font-headline text-xl text-primary italic">{narrative.fraseFinal}</p></div>}
    <div className="text-center text-xs text-on-surface-variant/40 py-4"><p>Vanessa Rocha — Valores Pessoais</p><p className="mt-1">Gerado em {new Date(data.report.generatedAt).toLocaleDateString('pt-BR')}</p></div>
  </div></div>;
}
