import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { ClipboardList, ArrowRight, CheckCircle2, Eye, FileText } from 'lucide-react';

const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const d = await api.get('/assessments/mine'); setAssessments(d.assessments); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const greeting = () => { const h = new Date().getHours(); return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'; };

  const latestCompleted = assessments.find(a => a.status !== 'IN_PROGRESS');
  const inProgress = assessments.find(a => a.status === 'IN_PROGRESS');
  const hasTest = !!latestCompleted;
  const hasReport = !!latestCompleted?.report;

  const statusText = {
    COMPLETED: 'Aguardando liberacao do coach',
    REVIEWED: 'Em revisao pelo coach',
    RELEASED: 'Liberado - relatorio disponivel',
    REPORT_GENERATED: 'Relatorio pronto para visualizacao',
  };

  return (
    <div>
      <div className="mb-8"><h1 className="font-display text-2xl text-gray-900">{greeting()}, {(user?.name||'').split(' ')[0]}</h1><p className="mt-1 text-sm text-gray-500">Bem-vindo a plataforma de analise comportamental</p></div>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card do Teste */}
        <div className="card flex flex-col items-center py-10 text-center">
          <div className={"mb-4 rounded-xl p-4 " + (hasTest ? "bg-green-50 text-green-600" : "bg-brand-50 text-brand-600")}>
            {hasTest ? <CheckCircle2 size={32}/> : <ClipboardList size={32}/>}
          </div>
          <h3 className="font-display text-lg text-gray-900">
            {hasTest ? 'Teste Concluido' : inProgress ? 'Teste em Andamento' : 'Questionario Comportamental'}
          </h3>
          {hasTest ? (
            <>
              <div className="flex gap-3 mt-3">
                {['D','I','S','C'].map(f => {
                  const scores = latestCompleted.scoresRaw?.normalized;
                  return scores ? (
                    <div key={f} className="text-center">
                      <div className={"text-xs font-bold " + (f==='D'?'text-disc-d':f==='I'?'text-disc-i':f==='S'?'text-disc-s':'text-disc-c')}>{profileNames[f]}</div>
                      <div className="text-sm font-semibold text-gray-900">{scores[f]}%</div>
                    </div>
                  ) : null;
                })}
              </div>
              {latestCompleted.profilePrimary && (
                <p className="mt-2 text-sm text-gray-600">Perfil: <span className="font-semibold">{profileNames[latestCompleted.profilePrimary]} / {profileNames[latestCompleted.profileSecondary]}</span></p>
              )}
              <p className="mt-2 text-xs text-gray-400">{statusText[latestCompleted.status] || latestCompleted.status}</p>
            </>
          ) : (
            <>
              <p className="mt-2 max-w-xs text-sm text-gray-500">
                {inProgress ? 'Voce tem um teste em andamento. Continue de onde parou.' : 'Responda o questionario para descobrir seu perfil comportamental. Leva cerca de 10 minutos.'}
              </p>
              <button onClick={() => navigate('/quiz')} className="btn-primary mt-6 gap-2">
                {inProgress ? 'Continuar Teste' : 'Iniciar Teste'} <ArrowRight size={16}/>
              </button>
            </>
          )}
        </div>

        {/* Card do Relatório */}
        <div className="card flex flex-col items-center py-10 text-center">
          <div className={"mb-4 rounded-xl p-4 " + (hasReport ? "bg-brand-50 text-brand-600" : "bg-gray-100 text-gray-400")}>
            {hasReport ? <FileText size={32}/> : (
              <svg width="32" height="32" viewBox="0 0 100 100"><polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="currentColor" strokeWidth="2"/><polygon points="50,20 80,35 80,65 50,80 20,65 20,35" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1"/></svg>
            )}
          </div>
          <h3 className="font-display text-lg text-gray-900">
            {hasReport ? 'Relatorio Disponivel' : 'Meu Relatorio'}
          </h3>
          {hasReport ? (
            <>
              <p className="mt-2 max-w-xs text-sm text-gray-500">Seu relatorio personalizado esta pronto! Clique abaixo para visualizar sua analise completa.</p>
              <button onClick={() => navigate('/report/' + latestCompleted.id)} className="btn-primary mt-6 gap-2"><Eye size={16}/>Ver Relatorio</button>
            </>
          ) : (
            <>
              <p className="mt-2 max-w-xs text-sm text-gray-500">
                {hasTest ? 'Aguarde a liberacao do seu coach para acessar seu relatorio personalizado.' : 'Apos completar o questionario e a liberacao do seu coach, seu relatorio ficara disponivel aqui.'}
              </p>
              <button onClick={() => navigate('/dashboard/assessments')} className="btn-secondary mt-6 gap-2">Ver Meus Testes <ArrowRight size={16}/></button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
