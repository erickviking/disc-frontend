import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { LayoutDashboard, Users, Wrench, Link2, ClipboardList, LogOut, Menu, X, ChevronRight, MessageCircle, Settings } from 'lucide-react';

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
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={"fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-surface-container-lowest border-r border-outline-variant/10 py-8 px-6 transition-transform lg:static lg:translate-x-0 " + (open ? "translate-x-0" : "-translate-x-full")}>
        {/* Brand */}
        <div className="mb-12">
          <p className="text-3xl font-headline text-primary tracking-tight">Vanessa Rocha</p>
          <p className="text-[10px] uppercase tracking-[0.25em] text-on-surface-variant/60 mt-1.5 font-medium">Desenvolvimento Pessoal</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-2">
          {nav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)}
              className={({ isActive }) => "group flex items-center gap-4 py-3 px-4 rounded-xl text-sm transition-all duration-300 " + (isActive ? "text-primary font-semibold bg-surface-container-high" : "text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-container")}>
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-auto space-y-4">
          <div className="pt-6 border-t border-outline-variant/10 space-y-1">
            <button onClick={handleLogout} className="flex items-center gap-4 w-full py-2.5 px-4 rounded-xl text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut size={18} />
              <span>Sair</span>
            </button>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-container text-xs font-bold text-on-tertiary-container">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-on-surface">{user?.name}</p>
              <p className="truncate text-xs text-on-surface-variant/60">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center justify-between px-6 h-20 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 lg:hidden">
          <button onClick={() => setOpen(true)} className="p-2 rounded-xl hover:bg-surface-container"><Menu size={20} className="text-on-surface-variant" /></button>
          <span className="text-xl font-headline text-primary">Vanessa Rocha</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-container text-xs font-bold text-on-tertiary-container">{initials}</div>
        </header>

        <main className="flex-1 overflow-y-auto bg-glow">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-8 lg:pt-16 pb-24 lg:pb-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
