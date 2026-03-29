import { NavLink, Outlet } from 'react-router-dom';
import { PenSquare, Database, FileText, Users, ShieldCheck, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth, isSuperAdmin } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';

export default function AppLayout() {
  const { user, profile } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const isTutor = superAdmin || profile?.role === 'tutor';

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
            <NavItem to="/builder" icon={PenSquare} label="Builder" />
            <NavItem to="/questions" icon={Database} label="Questions" />
            <NavItem to="/worksheets" icon={FileText} label="Worksheets" />
            {isTutor && <NavItem to="/students" icon={Users} label="Students" />}
            {superAdmin && <NavItem to="/admin" icon={ShieldCheck} label="Admin" />}
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

function NavItem({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <NavLink
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
  );
}
