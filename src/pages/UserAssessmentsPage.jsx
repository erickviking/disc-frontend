import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ClipboardList, CheckCircle2, Eye, ArrowRight, Plus, TrendingUp } from 'lucide-react';

const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };
const profileColors = { D: '#E63946', I: '#F4A261', S: '#2A9D8F', C: '#264653' };
const statusLabels = {
  IN_PROGRESS: { text: 'Em andamento', color: 'bg-amber-50 text-amber-700' },
  COMPLETED: { text: 'Aguardando liberacao', color: 'bg-blue-50 text-blue-700' },
  REVIEWED: { text: 'Em revisao', color: 'bg-purple-50 text-purple-700' },
  RELEASED: { text: 'Liberado', color: 'bg-green-50 text-green-700' },
  REPORT_GENERATED: { text: 'Relatorio pronto', color: 'bg-brand-50 text-brand-700' },
};

export default function UserAssessmentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justCompleted = searchParams.get('completed') === 'true';
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const d = await api.get('/assessments/mine'); setAssessments(d.assessments); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' });

  const completedTests = assessments.filter(a => a.status !== 'IN_PROGRESS');
  const inProgress = assessments.find(a => a.status === 'IN_PROGRESS');
  const canStartNew = !inProgress; // pode iniciar novo se nao tem em andamento

  // Dados para mini evolucao
  const hasEvolution = completedTests.length > 1;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div><h1 className="font-display text-2xl text-gray-900">Meus Testes</h1><p className="mt-1 text-sm text-gray-500">Acompanhe seus assessments comportamentais</p></div>
        {canStartNew && (
          <button onClick={() => navigate('/quiz')} className="btn-primary gap-2"><Plus size={16}/>Novo Teste</button>
        )}
      </div>

      {justCompleted && (
        <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 border border-green-100 flex items-center gap-2">
          <CheckCircle2 size={16}/> Teste concluido com sucesso! Aguarde a liberacao para ver seu relatorio completo.
        </div>
      )}

      {/* Mini evolucao se tem mais de 1 teste */}
      {hasEvolution && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-lg p-1.5 text-purple-600 bg-purple-50"><TrendingUp size={16}/></div>
            <h3 className="font-display text-base text-gray-900">Evolucao</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Data</th>
                  {['D','I','S','C'].map(f => (
                    <th key={f} className="px-3 py-2 text-center text-xs font-medium" style={{color: profileColors[f]}}>{profileNames[f]}</th>
                  ))}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Perfil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {completedTests.slice().reverse().map((a, idx) => {
                  const scores = a.scoresRaw?.normalized;
                  const prev = idx < completedTests.length - 1 ? completedTests.slice().reverse()[idx + 1]?.scoresRaw?.normalized : null;
                  return (
                    <tr key={a.id} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2 text-xs text-gray-600">{fmtDate(a.completedAt || a.createdAt)}</td>
                      {['D','I','S','C'].map(f => {
                        const val = scores?.[f] || 0;
                        const diff = prev ? val - (prev[f] || 0) : null;
                        return (
                          <td key={f} className="px-3 py-2 text-center">
                            <span className="text-sm font-semibold text-gray-900">{val}%</span>
                            {diff !== null && diff !== 0 && (
                              <span className={"ml-1 text-[10px] font-medium " + (diff > 0 ? 'text-green-600' : 'text-red-500')}>
                                {diff > 0 ? '+' : ''}{diff}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-xs font-medium text-gray-700">
                        {a.profilePrimary ? profileNames[a.profilePrimary] + '/' + profileNames[a.profileSecondary] : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card flex items-center justify-center py-12 text-gray-400"><div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent mr-2"/>Carregando...</div>
      ) : assessments.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="mb-4 rounded-xl bg-brand-50 p-4 text-brand-600"><ClipboardList size={32}/></div>
          <h3 className="font-display text-lg text-gray-900">Nenhum teste realizado</h3>
          <p className="mt-2 max-w-xs text-sm text-gray-500">Clique abaixo para iniciar seu questionario comportamental.</p>
          <button onClick={() => navigate('/quiz')} className="btn-primary mt-6 gap-2">Iniciar Teste <ArrowRight size={16}/></button>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map(a => {
            const st = statusLabels[a.status] || statusLabels.IN_PROGRESS;
            const scores = a.scoresRaw?.normalized;
            const isInProgress = a.status === 'IN_PROGRESS';

            return (
              <div key={a.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium " + st.color}>{st.text}</span>
                    <span className="text-xs text-gray-400">{fmtDate(a.createdAt)}</span>
                  </div>
                  {isInProgress && <p className="text-sm text-gray-500 mt-1">Teste em andamento.</p>}
                  {scores && (
                    <div className="flex gap-3 mt-2">
                      {['D','I','S','C'].map(f => (
                        <div key={f} className="text-center">
                          <div className={"text-xs font-bold " + (f==='D'?'text-disc-d':f==='I'?'text-disc-i':f==='S'?'text-disc-s':'text-disc-c')}>{profileNames[f]}</div>
                          <div className="text-sm font-semibold text-gray-900">{scores[f]}%</div>
                        </div>
                      ))}
                      {a.profilePrimary && <div className="ml-2 text-xs text-gray-500 self-center">Perfil: <span className="font-semibold">{profileNames[a.profilePrimary]}/{profileNames[a.profileSecondary]}</span></div>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isInProgress && <button onClick={() => navigate('/quiz')} className="btn-primary !py-1.5 !px-3 !text-xs gap-1"><ArrowRight size={12}/>Continuar</button>}
                  {a.report && <button onClick={() => navigate('/report/' + a.id)} className="btn-primary !py-1.5 !px-3 !text-xs gap-1"><Eye size={12}/>Ver Relatorio</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
