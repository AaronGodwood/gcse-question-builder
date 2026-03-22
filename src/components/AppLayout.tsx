import { NavLink, Outlet } from 'react-router-dom';
import { PenSquare, Database, FileText, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';

const navItems = [
  { to: '/builder', icon: PenSquare, label: 'Builder' },
  { to: '/questions', icon: Database, label: 'Questions' },
  { to: '/worksheets', icon: FileText, label: 'Worksheets' },
];

export default function AppLayout() {
  const { user } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      {/* Top navbar */}
      <header className="bg-slate-900 flex items-center justify-between px-5 h-12 shrink-0">
        <div className="flex items-center gap-8">
          <span className="font-semibold text-white tracking-tight text-base">Markr</span>
          <nav className="flex items-center h-12">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3 h-12 text-sm font-medium transition-colors border-b-2',
                    isActive
                      ? 'text-white border-emerald-400'
                      : 'text-slate-400 hover:text-slate-100 border-transparent'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{user?.email}</span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
