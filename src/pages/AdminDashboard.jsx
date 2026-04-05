import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { Users, ClipboardList, Link2, FileText } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
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
        setStats({
          totalUsers: usersData.pagination.total,
          totalAssessments: assessmentsData.pagination.total,
          activeInvites,
          totalReports: reportsCount,
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };
  const cards = [
    { label: 'Usuarios', value: stats?.totalUsers || 0, icon: Users, color: 'text-brand-600 bg-brand-50' },
    { label: 'Assessments', value: stats?.totalAssessments || 0, icon: ClipboardList, color: 'text-disc-s bg-emerald-50' },
    { label: 'Convites ativos', value: stats?.activeInvites || 0, icon: Link2, color: 'text-disc-i bg-amber-50' },
    { label: 'Relatorios', value: stats?.totalReports || 0, icon: FileText, color: 'text-disc-d bg-red-50' },
  ];

  return (
    <div>
      <div className="mb-8"><h1 className="font-display text-2xl text-gray-900">{greeting()}, {(user?.name||'').split(' ')[0]}</h1><p className="mt-1 text-sm text-gray-500">Visao geral do sistema</p></div>
      {loading ? <div className="flex items-center gap-2 text-sm text-gray-400"><div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />Carregando...</div> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(c => (
            <div key={c.label} className="card"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-gray-500">{c.label}</p><p className="mt-2 text-3xl font-semibold text-gray-900">{c.value}</p></div><div className={"rounded-lg p-2.5 "+c.color}><c.icon size={20} /></div></div></div>
          ))}
        </div>
      )}
    </div>
  );
}
