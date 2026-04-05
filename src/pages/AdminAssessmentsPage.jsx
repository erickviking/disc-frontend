import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ClipboardList, Eye, Unlock, FileText, ChevronDown, ChevronUp, Trash2, Loader2 } from 'lucide-react';

const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };
const statusLabels = {
  IN_PROGRESS: { text: 'Em andamento', color: 'bg-amber-500/15 text-amber-400' },
  COMPLETED: { text: 'Completado', color: 'bg-blue-500/15 text-blue-400' },
  REVIEWED: { text: 'Revisado', color: 'bg-purple-500/15 text-purple-400' },
  RELEASED: { text: 'Liberado', color: 'bg-emerald-500/15 text-emerald-400' },
  REPORT_GENERATED: { text: 'Relatorio gerado', color: 'bg-primary/15 text-primary' },
};

export default function AdminAssessmentsPage() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [releasing, setReleasing] = useState(null);
  const [generating, setGenerating] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  const load = async () => { try { const d = await api.get('/admin/assessments'); setAssessments(d.assessments); } catch(e){console.error(e);} finally{setLoading(false);} };
  useEffect(() => { load(); }, []);

  const release = async (id) => { setReleasing(id); try { await api.patch('/admin/assessments/'+id+'/release', {adminNotes:adminNotes||undefined}); setAdminNotes(''); await load(); } catch(e){alert(e.message);} finally{setReleasing(null);} };
  const generateReport = async (id) => { setGenerating(id); try { const r = await api.post('/admin/assessments/'+id+'/generate-report', {}); alert(r.message||'Relatorio gerado!'); await load(); } catch(e){alert('Erro: '+e.message);} finally{setGenerating(null);} };
  const deleteAssessment = async (id) => { if (!confirm('Deletar este assessment?')) return; setDeleting(id); try { await api.delete('/admin/assessments/'+id); setExpanded(null); await load(); } catch(e){alert(e.message);} finally{setDeleting(null);} };
  const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});

  return (
    <div>
      <div className="mb-8"><h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight">Assessments</h1><p className="mt-1 text-sm text-on-surface-variant/60">Gerencie os testes comportamentais</p></div>
      {loading?<div className="card flex items-center justify-center py-12 text-on-surface-variant/40"><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"/>Carregando...</div>
      :assessments.length===0?<div className="card flex flex-col items-center py-16 text-center"><ClipboardList size={32} className="text-on-surface-variant/30 mb-4"/><h3 className="text-lg font-headline text-on-surface-variant/50">Nenhum assessment</h3></div>
      :<div className="space-y-3">
        {assessments.map(a=>{
          const st = statusLabels[a.status]||statusLabels.IN_PROGRESS;
          const scores = a.scoresRaw?.normalized;
          const isExpanded = expanded===a.id;
          const canRelease = a.status==='COMPLETED'||a.status==='REVIEWED';
          const canGenerate = (a.status==='RELEASED'||a.status==='COMPLETED'||a.status==='REVIEWED')&&!a.report;
          const hasReport = !!a.report;
          return(
            <div key={a.id} className="card !p-0 overflow-hidden">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-5 cursor-pointer hover:bg-surface-container-high/50 transition-colors" onClick={()=>setExpanded(isExpanded?null:a.id)}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1"><span className="font-semibold text-on-surface">{a.user?.name}</span><span className={"rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider "+st.color}>{st.text}</span></div>
                  <div className="flex flex-wrap gap-x-4 text-xs text-on-surface-variant/40"><span>{a.user?.email}</span><span>Criado: {fmtDate(a.createdAt)}</span>{a.completedAt&&<span>Completado: {fmtDate(a.completedAt)}</span>}</div>
                </div>
                <div className="flex items-center gap-3">
                  {scores&&<div className="flex gap-2">{['D','I','S','C'].map(f=>(<div key={f} className="text-center"><div className={"text-[10px] font-bold "+(f==='D'?'text-disc-d':f==='I'?'text-disc-i':f==='S'?'text-disc-s':'text-disc-c')}>{profileNames[f][0]}</div><div className="text-xs font-semibold text-on-surface/80">{scores[f]}</div></div>))}</div>}
                  {isExpanded?<ChevronUp size={16} className="text-on-surface-variant/40"/>:<ChevronDown size={16} className="text-on-surface-variant/40"/>}
                </div>
              </div>
              {isExpanded&&(
                <div className="border-t border-outline-variant/10 p-5 bg-surface-container-low/50">
                  {scores&&(<div className="mb-5"><h4 className="text-sm font-semibold text-on-surface mb-3">Perfil Comportamental</h4><div className="grid grid-cols-4 gap-3">{['D','I','S','C'].map(f=>{const colors={D:'bg-disc-d',I:'bg-disc-i',S:'bg-disc-s',C:'bg-disc-c'};return(<div key={f}><div className="flex justify-between text-xs mb-1"><span className="text-on-surface-variant/70">{profileNames[f]}</span><span className="font-semibold text-on-surface">{scores[f]}%</span></div><div className="h-2 rounded-full bg-surface-container-highest"><div className={"h-full rounded-full "+colors[f]} style={{width:scores[f]+'%'}}/></div></div>);})}</div>{a.profilePrimary&&<p className="mt-3 text-sm text-on-surface-variant/70">Perfil: <span className="font-semibold text-on-surface">{profileNames[a.profilePrimary]} / {profileNames[a.profileSecondary]}</span></p>}</div>)}
                  <div className="flex flex-wrap gap-3 mb-4">
                    {hasReport&&<button onClick={(e)=>{e.stopPropagation();navigate('/report/'+a.id);}} className="btn-primary gap-2"><Eye size={14}/>Ver Relatorio</button>}
                    {canGenerate&&<button onClick={(e)=>{e.stopPropagation();generateReport(a.id);}} disabled={generating===a.id} className="btn-primary gap-2">{generating===a.id?<Loader2 size={14} className="animate-spin"/>:<FileText size={14}/>}Gerar Relatorio</button>}
                  </div>
                  {canRelease&&(<div className="border-t border-outline-variant/10 pt-4 mb-4"><h4 className="text-sm font-semibold text-on-surface mb-2">Liberar Assessment</h4><textarea className="input-field mb-3" rows={2} placeholder="Nota para a IA (opcional)..." value={adminNotes} onChange={e=>setAdminNotes(e.target.value)}/><button onClick={()=>release(a.id)} disabled={releasing===a.id} className="btn-primary gap-2">{releasing===a.id?<Loader2 size={14} className="animate-spin"/>:<Unlock size={14}/>}Liberar</button></div>)}
                  {a.releasedAt&&<p className="text-xs text-emerald-400 mt-2">Liberado em {fmtDate(a.releasedAt)}</p>}
                  {a.adminNotes&&<p className="text-xs text-on-surface-variant/50 mt-1">Nota: {a.adminNotes}</p>}
                  <div className="border-t border-outline-variant/10 pt-4 mt-4"><button onClick={(e)=>{e.stopPropagation();deleteAssessment(a.id);}} disabled={deleting===a.id} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30">{deleting===a.id?<Loader2 size={14} className="animate-spin"/>:<Trash2 size={14}/>}Deletar Assessment</button></div>
                </div>
              )}
            </div>
          );
        })}
      </div>}
    </div>
  );
}
