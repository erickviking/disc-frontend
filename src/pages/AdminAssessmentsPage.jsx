import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ClipboardList, Eye, Unlock, FileText, ChevronDown, ChevronUp, Trash2, Loader2 } from 'lucide-react';

const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };
const statusLabels = {
  IN_PROGRESS: { text: 'Em andamento', color: 'bg-amber-50 text-amber-700' },
  COMPLETED: { text: 'Completado', color: 'bg-blue-50 text-blue-700' },
  REVIEWED: { text: 'Revisado', color: 'bg-purple-50 text-purple-700' },
  RELEASED: { text: 'Liberado', color: 'bg-green-50 text-green-700' },
  REPORT_GENERATED: { text: 'Relatorio gerado', color: 'bg-brand-50 text-brand-700' },
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

  const load = async () => {
    try { const d = await api.get('/admin/assessments'); setAssessments(d.assessments); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const release = async (id) => {
    setReleasing(id);
    try {
      await api.patch('/admin/assessments/' + id + '/release', { adminNotes: adminNotes || undefined });
      setAdminNotes(''); await load();
    } catch (e) { alert(e.message); }
    finally { setReleasing(null); }
  };

  const generateReport = async (id) => {
    setGenerating(id);
    try {
      const result = await api.post('/admin/assessments/' + id + '/generate-report', {});
      alert(result.message || 'Relatorio gerado!');
      await load();
    } catch (e) { alert('Erro: ' + e.message); }
    finally { setGenerating(null); }
  };

  const deleteAssessment = async (id) => {
    if (!confirm('Tem certeza que deseja deletar este assessment? Esta acao nao pode ser desfeita.')) return;
    setDeleting(id);
    try { await api.delete('/admin/assessments/' + id); setExpanded(null); await load(); }
    catch (e) { alert(e.message); }
    finally { setDeleting(null); }
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-2xl text-gray-900">Assessments</h1><p className="mt-1 text-sm text-gray-500">Gerencie os testes comportamentais de todos os usuarios</p></div>

      {loading ? (
        <div className="card flex items-center justify-center py-12 text-gray-400"><div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent mr-2"/>Carregando...</div>
      ) : assessments.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="mb-4 rounded-xl bg-gray-100 p-4 text-gray-400"><ClipboardList size={32}/></div>
          <h3 className="font-display text-lg text-gray-500">Nenhum assessment</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map(a => {
            const st = statusLabels[a.status] || statusLabels.IN_PROGRESS;
            const scores = a.scoresRaw?.normalized;
            const isExpanded = expanded === a.id;
            const canRelease = a.status === 'COMPLETED' || a.status === 'REVIEWED';
            const canGenerateReport = (a.status === 'RELEASED' || a.status === 'COMPLETED' || a.status === 'REVIEWED') && !a.report;
            const hasReport = !!a.report;

            return (
              <div key={a.id} className="card !p-0 overflow-hidden">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 cursor-pointer hover:bg-gray-50/50" onClick={() => setExpanded(isExpanded ? null : a.id)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-gray-900">{a.user?.name}</span>
                      <span className={"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium " + st.color}>{st.text}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 text-xs text-gray-400">
                      <span>{a.user?.email}</span>
                      <span>Criado: {fmtDate(a.createdAt)}</span>
                      {a.completedAt && <span>Completado: {fmtDate(a.completedAt)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {scores && (
                      <div className="flex gap-2">
                        {['D','I','S','C'].map(f => (
                          <div key={f} className="text-center">
                            <div className={"text-[10px] font-bold " + (f==='D'?'text-disc-d':f==='I'?'text-disc-i':f==='S'?'text-disc-s':'text-disc-c')}>{profileNames[f][0]}</div>
                            <div className="text-xs font-semibold text-gray-700">{scores[f]}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50/30">
                    {scores && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Perfil Comportamental</h4>
                        <div className="grid grid-cols-4 gap-3">
                          {['D','I','S','C'].map(f => {
                            const colors = { D:'bg-disc-d', I:'bg-disc-i', S:'bg-disc-s', C:'bg-disc-c' };
                            return (
                              <div key={f}>
                                <div className="flex justify-between text-xs mb-1"><span className="text-gray-600">{profileNames[f]}</span><span className="font-semibold">{scores[f]}%</span></div>
                                <div className="h-2 rounded-full bg-gray-200"><div className={"h-full rounded-full " + colors[f]} style={{width: scores[f] + '%'}}/></div>
                              </div>
                            );
                          })}
                        </div>
                        {a.profilePrimary && <p className="mt-3 text-sm text-gray-600">Perfil: <span className="font-semibold">{profileNames[a.profilePrimary]} / {profileNames[a.profileSecondary]}</span></p>}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 mb-4">
                      {hasReport && (
                        <button onClick={(e) => { e.stopPropagation(); navigate('/report/' + a.id); }} className="btn-primary gap-2">
                          <Eye size={14}/>Ver Relatorio
                        </button>
                      )}

                      {canGenerateReport && (
                        <button onClick={(e) => { e.stopPropagation(); generateReport(a.id); }} disabled={generating === a.id} className="btn-primary gap-2">
                          {generating === a.id ? <Loader2 size={14} className="animate-spin"/> : <FileText size={14}/>}
                          Gerar Relatorio
                        </button>
                      )}
                    </div>

                    {canRelease && (
                      <div className="border-t border-gray-100 pt-4 mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Liberar Assessment</h4>
                        <textarea className="input-field mb-3" rows={2} placeholder="Nota para a IA (opcional) - ex: foco em lideranca..."
                          value={adminNotes} onChange={e => setAdminNotes(e.target.value)}/>
                        <button onClick={() => release(a.id)} disabled={releasing === a.id} className="btn-primary gap-2">
                          {releasing === a.id ? <Loader2 size={14} className="animate-spin"/> : <Unlock size={14}/>}
                          Liberar
                        </button>
                      </div>
                    )}

                    {a.releasedAt && <p className="text-xs text-green-600 mt-2">Liberado em {fmtDate(a.releasedAt)}</p>}
                    {a.adminNotes && <p className="text-xs text-gray-500 mt-1">Nota: {a.adminNotes}</p>}

                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <button onClick={(e) => { e.stopPropagation(); deleteAssessment(a.id); }} disabled={deleting === a.id}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                        {deleting === a.id ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
                        Deletar Assessment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
