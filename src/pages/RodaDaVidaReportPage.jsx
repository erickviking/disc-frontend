import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { ArrowLeft, Download, TrendingUp, AlertTriangle, Lightbulb, Link2, Target, Loader2 } from 'lucide-react';

const areaLabels = {
  saude: 'Saúde e Disposição',
  intelectual: 'Desenvolvimento Intelectual',
  emocional: 'Equilíbrio Emocional',
  proposito: 'Realização e Propósito',
  financas: 'Recursos Financeiros',
  contribuicao: 'Contribuição Social',
  familia: 'Família',
  relacionamento: 'Relacionamento Amoroso',
  social: 'Vida Social',
  diversao: 'Criatividade e Diversão',
  plenitude: 'Plenitude e Felicidade',
  espiritualidade: 'Espiritualidade',
};

const areaColors = {
  saude: '#E63946', intelectual: '#4c6ef5', emocional: '#7c3aed', proposito: '#F4A261',
  financas: '#059669', contribuicao: '#2A9D8F', familia: '#E63946', relacionamento: '#ec4899',
  social: '#f59e0b', diversao: '#8b5cf6', plenitude: '#d4a853', espiritualidade: '#6366f1',
};

function RodaChart({ scores }) {
  const size = 400;
  const center = size / 2;
  const maxRadius = 170;
  const areas = Object.keys(scores);
  const count = areas.length;
  if (count === 0) return null;

  const sliceAngle = (2 * Math.PI) / count;
  const areaColorMap = {
    saude: '#E63946', intelectual: '#4c6ef5', emocional: '#7c3aed', proposito: '#F4A261',
    financas: '#059669', contribuicao: '#2A9D8F', familia: '#ec4899', relacionamento: '#f472b6',
    social: '#f59e0b', diversao: '#8b5cf6', plenitude: '#d4a853', espiritualidade: '#a78bfa',
  };

  const slices = areas.map((area, i) => {
    const startAngle = sliceAngle * i - Math.PI / 2;
    const endAngle = startAngle + sliceAngle;
    const r = maxRadius * (scores[area] / 10);
    const x1 = center + Math.cos(startAngle) * r;
    const y1 = center + Math.sin(startAngle) * r;
    const x2 = center + Math.cos(endAngle) * r;
    const y2 = center + Math.sin(endAngle) * r;
    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    const path = 'M ' + center + ' ' + center + ' L ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + largeArc + ' 1 ' + x2 + ' ' + y2 + ' Z';
    const color = areaColorMap[area] || '#d4a853';
    const midAngle = startAngle + sliceAngle / 2;
    const labelR = maxRadius + 20;
    const lx = center + Math.cos(midAngle) * labelR;
    const ly = center + Math.sin(midAngle) * labelR;
    const scoreR = Math.max(r * 0.6, 25);
    const sx = center + Math.cos(midAngle) * scoreR;
    const sy = center + Math.sin(midAngle) * scoreR;
    const label = (areaLabels[area] || area).split(' ').slice(0, 2).join(' ');
    return { path, color, area, score: scores[area], lx, ly, sx, sy, label };
  });

  const gridCircles = [2, 4, 6, 8, 10].map(v => ({ r: maxRadius * v / 10, label: v }));
  const spokes = areas.map((_, i) => {
    const angle = sliceAngle * i - Math.PI / 2;
    return { x: center + Math.cos(angle) * maxRadius, y: center + Math.sin(angle) * maxRadius };
  });
  const avg = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / count * 10) / 10;

  return (
    <svg viewBox={'0 0 ' + size + ' ' + size} className="w-full max-w-[400px] mx-auto">
      {gridCircles.map(g => <circle key={g.r} cx={center} cy={center} r={g.r} fill="none" stroke="rgba(61,56,48,0.2)" strokeWidth="0.5" strokeDasharray="3,3" />)}
      <circle cx={center} cy={center} r={maxRadius} fill="none" stroke="rgba(61,56,48,0.4)" strokeWidth="1" />
      {spokes.map((s, i) => <line key={i} x1={center} y1={center} x2={s.x} y2={s.y} stroke="rgba(61,56,48,0.15)" strokeWidth="0.5" />)}
      {slices.map(s => <path key={s.area} d={s.path} fill={s.color} fillOpacity="0.75" stroke={s.color} strokeWidth="1.5" />)}
      <circle cx={center} cy={center} r="28" fill="#0f0f0f" stroke="rgba(61,56,48,0.4)" strokeWidth="1" />
      <text x={center} y={center + 1} textAnchor="middle" dominantBaseline="middle" fontSize="15" fontWeight="800" fill="#d4a853">{avg}</text>
      <text x={center} y={center + 13} textAnchor="middle" fontSize="6" fill="#bfb5a8" fontWeight="500">MÉDIA</text>
      {slices.map(s => <text key={s.area + '_score'} x={s.sx} y={s.sy} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill="white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{s.score}</text>)}
      {slices.map(s => {
        const isRight = s.lx > center;
        const isBottom = s.ly > center;
        return <text key={s.area + '_label'} x={s.lx} y={s.ly} textAnchor={Math.abs(s.lx - center) < 10 ? 'middle' : isRight ? 'start' : 'end'} dominantBaseline={Math.abs(s.ly - center) < 10 ? 'middle' : isBottom ? 'hanging' : 'auto'} fontSize="9" fontWeight="600" fill={s.color}>{s.label}</text>;
      })}
    </svg>
  );
}

function Section({ icon: Icon, title, children, color = 'text-primary bg-primary/15' }) {
  return <div className="mb-6"><div className="flex items-center gap-2 mb-3"><div className={'rounded-lg p-1.5 ' + color}><Icon size={16} /></div><h3 className="font-headline text-lg font-semibold text-on-surface">{title}</h3></div>{children}</div>;
}

export default function RodaDaVidaReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const endpoint = isAdmin ? '/admin/assessments/' + id + '/report' : '/assessments/' + id + '/report';
        setData(await api.get(endpoint));
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [id, isAdmin]);

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
      a.download = 'relatorio-roda-da-vida.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) { alert('Erro ao baixar PDF: ' + e.message); }
    finally { setDownloading(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-surface"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (error) return <div className="p-8"><div className="card text-center py-12"><p className="text-red-400">{error}</p><button onClick={() => navigate(-1)} className="btn-secondary mt-4 gap-2"><ArrowLeft size={16} />Voltar</button></div></div>;

  const { report, scores: rawScores, scoresRaw, userName } = data;
  const scores = rawScores || scoresRaw?.scores || {};
  const n = report.narrative;

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="btn-secondary gap-1"><ArrowLeft size={16} />Voltar</button>
          <button onClick={downloadPDF} disabled={downloading} className="btn-primary gap-2">{downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}Baixar PDF</button>
        </div>

        <div className="card mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant/50 mb-2">Roda da Vida</p>
          <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">{userName}</h1>
          <p className="text-sm text-on-surface-variant mb-6">Avaliação de {Object.keys(scores).length} áreas da vida</p>
          <RodaChart scores={scores} />
        </div>

        {n.resumoGeral && <div className="card mb-6"><h2 className="font-headline text-xl font-semibold text-on-surface mb-3">Visão Geral</h2><p className="text-sm leading-relaxed text-on-surface-variant">{n.resumoGeral}</p></div>}
        {n.analiseEquilibrio && <div className="card mb-6"><h2 className="font-headline text-xl font-semibold text-on-surface mb-1">Análise de Equilíbrio</h2><span className={'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-3 ' + (n.analiseEquilibrio.nivel === 'equilibrado' ? 'bg-emerald-500/15 text-emerald-400' : n.analiseEquilibrio.nivel === 'moderado' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400')}>{n.analiseEquilibrio.nivel}</span><p className="text-sm leading-relaxed text-on-surface-variant whitespace-pre-line">{n.analiseEquilibrio.descricao}</p></div>}
        {n.areasDestaquePositivo && <div className="card mb-6"><Section icon={TrendingUp} title="Áreas em Destaque" color="text-emerald-400 bg-emerald-500/15"><div className="space-y-3">{n.areasDestaquePositivo.map((a, i) => <div key={i} className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 px-4 py-3"><div className="flex items-center justify-between mb-1"><p className="text-sm font-semibold text-on-surface">{a.area}</p><span className="text-xs font-bold text-emerald-400">{a.score}/10</span></div><p className="text-xs text-on-surface-variant">{a.analise}</p></div>)}</div></Section></div>}
        {n.areasAtencao && <div className="card mb-6"><Section icon={AlertTriangle} title="Áreas de Atenção" color="text-amber-400 bg-amber-500/15"><div className="space-y-3">{n.areasAtencao.map((a, i) => <div key={i} className="rounded-xl bg-amber-500/5 border border-amber-500/15 px-4 py-3"><div className="flex items-center justify-between mb-1"><p className="text-sm font-semibold text-on-surface">{a.area}</p><span className="text-xs font-bold text-amber-400">{a.score}/10</span></div><p className="text-xs text-on-surface-variant mb-2">{a.analise}</p>{a.microAcao && <div className="flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-2"><Lightbulb size={12} className="text-primary mt-0.5 shrink-0" /><p className="text-xs text-primary">{a.microAcao}</p></div>}</div>)}</div></Section></div>}
        {n.conexoesEntreAreas && <div className="card mb-6"><Section icon={Link2} title="Conexões entre Áreas" color="text-[#2A9D8F] bg-[#2A9D8F]/15"><p className="text-sm leading-relaxed text-on-surface-variant whitespace-pre-line">{n.conexoesEntreAreas}</p></Section></div>}
        {n.planoDeAcao && <div className="card mb-6"><Section icon={Target} title="Plano de Ação — 30 Dias" color="text-primary bg-primary/15"><div className="space-y-4">{['prioridade1', 'prioridade2', 'prioridade3'].map((pk, pi) => { const p = n.planoDeAcao[pk]; if (!p) return null; return <div key={pk} className="rounded-xl bg-surface-container-low border border-outline-variant/15 p-4"><div className="flex items-center gap-2 mb-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{pi + 1}</span><h4 className="text-sm font-semibold text-on-surface">{p.area}</h4></div><p className="text-xs text-on-surface-variant mb-3">{p.meta}</p><ul className="space-y-1.5">{(p.acoes || []).map((acao, ai) => <li key={ai} className="flex gap-2 text-xs text-on-surface-variant"><span className="text-primary font-bold mt-0.5">•</span><span>{acao}</span></li>)}</ul></div>; })}</div></Section></div>}
        {n.reflexaoFinal && <div className="card mb-6"><div className="rounded-xl bg-primary/5 border border-primary/15 p-5"><p className="text-sm leading-relaxed text-on-surface-variant italic">{n.reflexaoFinal}</p></div></div>}

        <div className="text-center text-xs text-on-surface-variant/40 py-4"><p>Vanessa Rocha — Roda da Vida</p><p className="mt-1">Gerado em {new Date(report.generatedAt).toLocaleDateString('pt-BR')}</p></div>
      </div>
    </div>
  );
}
