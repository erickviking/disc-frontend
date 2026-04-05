import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { Users, ClipboardList, Link2, FileText, ArrowRight, Wrench } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [usersData, assessmentsData, invitesData] = await Promise.all([
          api.get('/admin/users?limit=1'),
          api.get('/admin/assessments?limit=100'),
          api.get('/admin/invites').catch(() => ({ invites: [] })),
        ]);
        const activeInvites = invitesData.invites.filter(i => i.isActive && !i.isExpired && !i.isExhausted).length;
        const reportsCount = assessmentsData.assessments.filter(a => a.report).length;
        const pendingCount = assessmentsData.assessments.filter(a => a.status === 'COMPLETED').length;
        setStats({ totalUsers: usersData.pagination.total, totalAssessments: assessmentsData.pagination.total, activeInvites, totalReports: reportsCount, pendingRelease: pendingCount });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };

  const cards = [
    { label: 'Usuários', value: stats?.totalUsers || 0, icon: Users, img: '/card-roda.jpg', route: '/admin/users', desc: 'Gerenciar usuários e acessos' },
    { label: 'Assessments', value: stats?.totalAssessments || 0, icon: ClipboardList, img: '/card-disc.jpg', route: '/admin/assessments', desc: 'Testes comportamentais realizados' },
    { label: 'Relatórios', value: stats?.totalReports || 0, icon: FileText, img: '/card-ie.jpg', route: '/admin/assessments', desc: 'Relatórios gerados por IA' },
    { label: 'Ferramentas', value: '7', icon: Wrench, img: '/card-valores.jpg', route: '/admin/tools', desc: 'Gerenciar ferramentas e acesso' },
  ];

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"/></div>;

  return (
    <div>
      {/* Hero */}
      <section className="mb-14">
        <span className="text-primary text-xs font-semibold uppercase tracking-widest mb-3 block">Painel Administrativo</span>
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-on-surface tracking-tighter leading-tight">
          {greeting()}, <span className="italic font-normal text-primary">{(user?.name||'').split(' ')[0]}</span>
        </h1>
        <p className="text-on-surface-variant/60 text-base mt-4 max-w-xl font-light leading-relaxed">
          Visao geral da plataforma de desenvolvimento pessoal.
        </p>
      </section>

      {/* Metric Cards with photos */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {cards.map(c => (
          <div key={c.label} onClick={() => navigate(c.route)}
            className="group relative rounded-3xl overflow-hidden border border-outline-variant/10 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer min-h-[220px]">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: 'url(' + c.img + ')' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,15,15,0.95) 0%, rgba(15,15,15,0.7) 50%, rgba(15,15,15,0.4) 100%)' }} />

            <div className="relative p-6 flex flex-col justify-between h-full z-10">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/15 backdrop-blur-sm">
                  <c.icon size={18} className="text-primary" />
                </div>
                <ArrowRight size={16} className="text-white/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-auto">
                <p className="text-4xl font-bold text-white mb-1 drop-shadow-md">{c.value}</p>
                <p className="text-sm font-semibold text-white/90 drop-shadow-sm">{c.label}</p>
                <p className="text-xs text-white/50 mt-1">{c.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Quick Actions */}
      {stats?.pendingRelease > 0 && (
        <div className="relative rounded-3xl overflow-hidden border border-primary/15 min-h-[120px]" style={{background:'linear-gradient(135deg, rgba(122,98,48,0.4) 0%, rgba(15,15,15,0.9) 100%)'}}>
          <div className="p-8 flex items-center justify-between">
            <div>
              <p className="text-primary text-xs font-bold uppercase tracking-widest mb-2">Atencao</p>
              <p className="text-lg font-headline text-on-surface">{stats.pendingRelease} assessment{stats.pendingRelease > 1 ? 's' : ''} aguardando liberação</p>
              <p className="text-sm text-on-surface-variant/60 mt-1">Revise e libere para gerar os relatórios.</p>
            </div>
            <button onClick={() => navigate('/admin/assessments')} className="btn-primary gap-2">
              Revisar <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
