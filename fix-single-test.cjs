const fs = require('fs');
const path = require('path');
function w(f, c) {
  const d = path.dirname(f);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(f, c, 'utf8');
  console.log('OK:', f);
}

// UserAssessmentsPage - sem botão Novo Teste, sem Continuar
w('../frontend/src/pages/UserAssessmentsPage.jsx', `import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ClipboardList, CheckCircle2, Eye, ArrowRight } from 'lucide-react';

const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };
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

  // Verifica se tem algum teste completado ou em andamento
  const hasCompletedOrPending = assessments.some(a => a.status !== 'IN_PROGRESS');
  const inProgressAssessment = assessments.find(a => a.status === 'IN_PROGRESS');
  const canStartTest = !hasCompletedOrPending && !inProgressAssessment;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-gray-900">Meus Testes</h1>
        <p className="mt-1 text-sm text-gray-500">Acompanhe seus assessments comportamentais</p>
      </div>

      {justCompleted && (
        <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 border border-green-100 flex items-center gap-2">
          <CheckCircle2 size={16}/> Teste concluido com sucesso! Aguarde a liberacao para ver seu relatorio completo.
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

            // Nao mostra assessments em andamento se ja tem um completado
            if (isInProgress && hasCompletedOrPending) return null;

            return (
              <div key={a.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium " + st.color}>{st.text}</span>
                    <span className="text-xs text-gray-400">{fmtDate(a.createdAt)}</span>
                  </div>
                  {isInProgress && (
                    <p className="text-sm text-gray-500 mt-1">Voce tem um teste em andamento.</p>
                  )}
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
                  {isInProgress && (
                    <button onClick={() => navigate('/quiz')} className="btn-primary !py-1.5 !px-3 !text-xs gap-1"><ArrowRight size={12}/>Continuar Teste</button>
                  )}
                  {a.report && <button className="btn-primary !py-1.5 !px-3 !text-xs gap-1"><Eye size={12}/>Ver Relatorio</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
`);

// UserDashboard - mostra estado correto baseado no teste existente
w('../frontend/src/pages/UserDashboard.jsx', `import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { ClipboardList, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';

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

  return (
    <div>
      <div className="mb-8"><h1 className="font-display text-2xl text-gray-900">{greeting()}, {(user?.name||'').split(' ')[0]}</h1><p className="mt-1 text-sm text-gray-500">Bem-vindo a plataforma de analise comportamental</p></div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card flex flex-col items-center py-10 text-center">
          <div className={"mb-4 rounded-xl p-4 " + (hasTest ? "bg-green-50 text-green-600" : "bg-brand-50 text-brand-600")}>
            {hasTest ? <CheckCircle2 size={32}/> : <ClipboardList size={32}/>}
          </div>
          <h3 className="font-display text-lg text-gray-900">
            {hasTest ? 'Teste Concluido' : inProgress ? 'Teste em Andamento' : 'Questionario DISC'}
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
              <p className="mt-2 text-xs text-gray-400">
                {latestCompleted.status === 'COMPLETED' ? 'Aguardando liberacao do coach' : 
                 latestCompleted.status === 'RELEASED' ? 'Liberado! Relatorio disponivel' : latestCompleted.status}
              </p>
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
        <div className="card flex flex-col items-center py-10 text-center">
          <div className="mb-4 rounded-xl bg-gray-100 p-4 text-gray-400">
            <svg width="32" height="32" viewBox="0 0 100 100"><polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="currentColor" strokeWidth="2"/><polygon points="50,20 80,35 80,65 50,80 20,65 20,35" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1"/></svg>
          </div>
          <h3 className="font-display text-lg text-gray-900">Meus Relatorios</h3>
          <p className="mt-2 max-w-xs text-sm text-gray-500">Apos completar o questionario e a liberacao do seu coach, seu relatorio personalizado ficara disponivel aqui.</p>
          <button onClick={() => navigate('/dashboard/assessments')} className="btn-secondary mt-6 gap-2">Ver Meus Testes <ArrowRight size={16}/></button>
        </div>
      </div>
    </div>
  );
}
`);

console.log('\\nCorrigido! Agora:');
console.log('- Sem botao "Novo Teste" quando ja tem teste completado');
console.log('- Assessment em andamento orfao nao aparece se ja tem completado');
console.log('- Dashboard mostra estado correto do teste');
