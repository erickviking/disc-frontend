import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { LayoutDashboard, Users, Wrench, Link2, ClipboardList, LogOut, Menu, X, ChevronRight } from 'lucide-react';

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'Usuarios' },
  { to: '/admin/tools', icon: Wrench, label: 'Ferramentas' },
  { to: '/admin/invites', icon: Link2, label: 'Convites' },
  { to: '/admin/assessments', icon: ClipboardList, label: 'Assessments' },
];
const userNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio', end: true },
  { to: '/dashboard/assessments', icon: ClipboardList, label: 'Minhas Avaliacoes' },
];

export function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const nav = isAdmin ? adminNav : userNav;
  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = (user?.name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-surface">
      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}

      <aside className={"fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-surface-container-lowest border-r border-outline-variant/10 py-8 px-6 transition-transform lg:static lg:translate-x-0 " + (open ? "translate-x-0" : "-translate-x-full")}>
        {/* Brand with Vanessa photo */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <img src="/vanessa-profile.jpg" alt="Vanessa Rocha" className="w-11 h-11 rounded-full border-2 border-primary/30 object-cover" />
            <div>
              <p className="text-lg font-headline text-primary tracking-tight leading-tight">Vanessa Rocha</p>
              <p className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant/40 font-medium">Desenvolvimento Pessoal</p>
            </div>
          </div>
          <button className="lg:hidden ml-auto absolute top-6 right-6 p-1 rounded-lg text-on-surface-variant/50 hover:bg-surface-container" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>

        <nav className="flex-1 space-y-1.5">
          {nav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)}
              className={({ isActive }) => "group flex items-center gap-3.5 py-2.5 px-4 rounded-xl text-sm transition-all duration-200 " + (isActive ? "text-primary font-semibold bg-primary/10 border-l-2 border-primary" : "text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container")}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="pt-5 border-t border-outline-variant/10">
            <button onClick={handleLogout} className="flex items-center gap-3.5 w-full py-2.5 px-4 rounded-xl text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          </div>
          <div className="flex items-center gap-3 px-2 pt-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-on-surface">{user?.name}</p>
              <p className="truncate text-[11px] text-on-surface-variant/40">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 h-16 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/10 lg:hidden">
          <button onClick={() => setOpen(true)} className="p-2 rounded-xl hover:bg-surface-container"><Menu size={20} className="text-on-surface-variant" /></button>
          <span className="text-lg font-headline text-primary">Vanessa Rocha</span>
          <img src="/vanessa-profile.jpg" alt="" className="w-9 h-9 rounded-full border border-primary/20 object-cover" />
        </header>

        <main className="flex-1 overflow-y-auto bg-glow">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-8 lg:pt-14 pb-24 lg:pb-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
