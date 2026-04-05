import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { ArrowLeft, Download, Star, AlertTriangle, MessageCircle, Briefcase, TrendingUp, Users, Loader2 } from 'lucide-react';

const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };
const profileColors = { D: '#E63946', I: '#F4A261', S: '#2A9D8F', C: '#264653' };

function RadarChart({ scores }) {
  const size = 280; const center = size / 2; const radius = 110;
  const factors = ['D', 'I', 'S', 'C'];
  const angles = factors.map((_, i) => (Math.PI * 2 * i) / 4 - Math.PI / 2);
  const getPoint = (angle, value) => ({ x: center + Math.cos(angle) * (radius * value / 100), y: center + Math.sin(angle) * (radius * value / 100) });
  const dataPoints = factors.map((f, i) => getPoint(angles[i], scores[f]));
  const polygon = dataPoints.map(p => p.x + ',' + p.y).join(' ');
  return (
    <svg viewBox={"0 0 " + size + " " + size} className="w-full max-w-[280px] mx-auto">
      {[25,50,75,100].map(v => <polygon key={v} points={factors.map((_,i)=>{const p=getPoint(angles[i],v);return p.x+','+p.y;}).join(' ')} fill="none" stroke="rgba(61,56,48,0.5)" strokeWidth="1"/>)}
      {factors.map((_,i)=>{const p=getPoint(angles[i],100);return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="rgba(61,56,48,0.5)" strokeWidth="1"/>;})}
      <polygon points={polygon} fill="rgba(212,168,83,0.15)" stroke="#d4a853" strokeWidth="2.5"/>
      {factors.map((f,i)=>{const p=dataPoints[i];const lp=getPoint(angles[i],120);return(<g key={f}><circle cx={p.x} cy={p.y} r="5" fill={profileColors[f]}/><text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill={profileColors[f]}>{profileNames[f]}</text><text x={lp.x} y={lp.y+14} textAnchor="middle" fontSize="10" fill="#bfb5a8">{scores[f]}%</text></g>);})}
    </svg>
  );
}

function Section({ icon: Icon, title, children, color = 'text-primary bg-primary/15' }) {
  return (<div className="mb-6"><div className="flex items-center gap-2 mb-3"><div className={"rounded-lg p-1.5 "+color}><Icon size={16}/></div><h3 className="font-headline text-lg font-semibold text-on-surface">{title}</h3></div>{children}</div>);
}

export default function ReportPage() {
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
      const res = await fetch('/api/reports/' + id + '/pdf', { headers: { 'Authorization': 'Bearer ' + token } });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Erro ao gerar PDF'); }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'relatorio-disc.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) { alert('Erro ao baixar PDF: ' + e.message); }
    finally { setDownloading(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-surface"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"/></div>;
  if (error) return <div className="p-8"><div className="card text-center py-12"><p className="text-red-400">{error}</p><button onClick={() => navigate(-1)} className="btn-secondary mt-4 gap-2"><ArrowLeft size={16}/>Voltar</button></div></div>;

  const { report, scores, profilePrimary, profileSecondary, userName } = data;
  const n = report.narrative;

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="btn-secondary gap-1"><ArrowLeft size={16}/>Voltar</button>
          <button onClick={downloadPDF} disabled={downloading} className="btn-primary gap-2">
            {downloading ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}
            Baixar PDF
          </button>
        </div>

        <div className="card mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant/50 mb-2">Analise Comportamental</p>
          <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">{userName}</h1>
          <p className="text-sm text-on-surface-variant">Perfil: <span className="font-semibold" style={{color:profileColors[profilePrimary]}}>{profileNames[profilePrimary]}</span> / <span className="font-semibold" style={{color:profileColors[profileSecondary]}}>{profileNames[profileSecondary]}</span></p>
          <div className="mt-6"><RadarChart scores={scores}/></div>
        </div>

        <div className="card mb-6"><h2 className="font-headline text-xl font-semibold text-on-surface mb-3">Resumo do Perfil</h2><p className="text-sm leading-relaxed text-on-surface-variant">{n.resumoExecutivo}</p></div>

        <div className="card mb-6"><h2 className="font-headline text-xl font-semibold text-on-surface mb-3">Perfil Detalhado</h2><p className="text-sm leading-relaxed text-on-surface-variant whitespace-pre-line">{n.perfilDetalhado?.descricao}</p>
          {n.perfilDetalhado?.palavrasChave && <div className="flex flex-wrap gap-2 mt-4">{n.perfilDetalhado.palavrasChave.map((p,i)=><span key={i} className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">{p}</span>)}</div>}
        </div>

        <div className="card mb-6"><Section icon={Star} title="Pontos Fortes" color="text-emerald-400 bg-emerald-500/15"><div className="space-y-3">{(n.pontosFortes||[]).map((p,i)=><div key={i} className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 px-4 py-3"><p className="text-sm font-semibold text-on-surface">{p.titulo||p}</p>{p.descricao&&<p className="text-xs text-on-surface-variant mt-1">{p.descricao}</p>}</div>)}</div></Section></div>

        <div className="card mb-6"><Section icon={AlertTriangle} title="Areas de Atencao" color="text-amber-400 bg-amber-500/15"><div className="space-y-3">{(n.areasAtencao||[]).map((a,i)=><div key={i} className="rounded-xl bg-amber-500/5 border border-amber-500/15 px-4 py-3"><p className="text-sm font-semibold text-on-surface">{a.titulo||a}</p>{a.descricao&&<p className="text-xs text-on-surface-variant mt-1">{a.descricao}</p>}</div>)}</div></Section></div>

        {n.estiloComunicacao && <div className="card mb-6"><Section icon={MessageCircle} title="Estilo de Comunicacao" color="text-disc-i bg-orange-500/15"><div className="space-y-4 text-sm text-on-surface-variant"><div><p className="font-semibold text-on-surface text-xs uppercase tracking-wide mb-1">Como se expressa</p><p className="leading-relaxed">{n.estiloComunicacao.comoSeExprime}</p></div><div><p className="font-semibold text-on-surface text-xs uppercase tracking-wide mb-1">Como prefere receber informacoes</p><p className="leading-relaxed">{n.estiloComunicacao.comoPrefereceber}</p></div>{n.estiloComunicacao.dicasParaOutros&&<div><p className="font-semibold text-on-surface text-xs uppercase tracking-wide mb-1">Dicas para quem convive</p><p className="leading-relaxed">{n.estiloComunicacao.dicasParaOutros}</p></div>}</div></Section></div>}

        {n.ambiente && <div className="card mb-6"><Section icon={Briefcase} title="Ambiente e Trabalho" color="text-disc-s bg-teal-500/15"><div className="space-y-4 text-sm text-on-surface-variant"><div><p className="font-semibold text-on-surface text-xs uppercase tracking-wide mb-1">Ambiente ideal</p><p className="leading-relaxed">{n.ambiente.idealDeTrabalho}</p></div><div><p className="font-semibold text-on-surface text-xs uppercase tracking-wide mb-1">Fatores de estresse</p><p className="leading-relaxed">{n.ambiente.fatoresEstresse}</p></div>{n.ambiente.comoLidaComMudancas&&<div><p className="font-semibold text-on-surface text-xs uppercase tracking-wide mb-1">Relacao com mudancas</p><p className="leading-relaxed">{n.ambiente.comoLidaComMudancas}</p></div>}</div></Section></div>}

        {n.lideranca && <div className="card mb-6"><Section icon={Users} title="Lideranca" color="text-disc-d bg-red-500/15"><div className="space-y-4 text-sm text-on-surface-variant"><div><p className="font-semibold text-on-surface text-xs uppercase tracking-wide mb-1">Estilo de lideranca</p><p className="leading-relaxed">{n.lideranca.estilo}</p></div>{n.lideranca.comoMotiva&&<div><p className="font-semibold text-on-surface text-xs uppercase tracking-wide mb-1">Como motiva outros</p><p className="leading-relaxed">{n.lideranca.comoMotiva}</p></div>}</div></Section></div>}

        {n.desenvolvimento && <div className="card mb-6"><Section icon={TrendingUp} title="Desenvolvimento" color="text-purple-400 bg-purple-500/15">{n.desenvolvimento.recomendacoes&&<div className="mb-4"><p className="font-semibold text-on-surface text-xs uppercase tracking-wide mb-2">Recomendacoes</p><ul className="space-y-2">{n.desenvolvimento.recomendacoes.map((r,i)=><li key={i} className="flex gap-2 text-sm text-on-surface-variant"><span className="text-primary font-bold mt-0.5">{"•"}</span><span>{r}</span></li>)}</ul></div>}{n.desenvolvimento.acoesPraticas&&<div><p className="font-semibold text-on-surface text-xs uppercase tracking-wide mb-2">Acoes praticas</p><ul className="space-y-2">{n.desenvolvimento.acoesPraticas.map((a,i)=><li key={i} className="flex gap-2 text-sm text-on-surface-variant"><span className="text-emerald-400 font-bold mt-0.5">{i+1}.</span><span>{a}</span></li>)}</ul></div>}</Section></div>}

        <div className="text-center text-xs text-on-surface-variant/40 py-4"><p>Vanessa Rocha - Analise Comportamental</p><p className="mt-1">Gerado em {new Date(report.generatedAt).toLocaleDateString('pt-BR')}</p></div>
      </div>
    </div>
  );
}
