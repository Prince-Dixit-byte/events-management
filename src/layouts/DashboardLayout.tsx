import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  CalendarPlus,
  ClipboardCheck,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  UserCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatRoleLabel, getRoleDashboardPath } from '../hooks/useDashboardPath';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardLayoutProps {
  title: string;
  breadcrumb?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardLayout({ title, breadcrumb, action, children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const navItems: NavItem[] = [
    {
      to: getRoleDashboardPath(user.role),
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/events',
      label: 'All Events',
      icon: Calendar,
    },
  ];

  if (user.role === 'ADMIN') {
    navItems.push(
      { to: '/events/new', label: 'Create Event', icon: CalendarPlus },
      { to: '/attendance', label: 'Attendance', icon: ClipboardCheck },
      { to: '/reports', label: 'Participation Reports', icon: BarChart3 }
    );
  } else if (user.role === 'FACULTY') {
    navItems.push(
      { to: '/attendance', label: 'Attendance & Rosters', icon: ClipboardCheck },
      { to: '/reports', label: 'Participation Reports', icon: BarChart3 }
    );
  } else {
    navItems.push({ to: '/my-registrations', label: 'My Registrations', icon: ListChecks });
  }

  navItems.push({ to: '/profile', label: 'Profile', icon: UserCircle });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-slate-200">
      <div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <Link to="/" className="text-lg font-bold tracking-tight text-[#0F2942] whitespace-nowrap">
            CampusEvents
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
          <p className="mt-0.5 text-xs text-slate-500 truncate">
            {formatRoleLabel(user.role)}
            {user.department ? ` · ${user.department}` : ''}
          </p>
        </div>

        <nav className="p-3 space-y-1" aria-label="Dashboard navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#0F2942] text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-slate-200">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-50 w-64 max-w-[80vw] h-full">{sidebarContent}</aside>
        </div>
      ) : null}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-8 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                {breadcrumb ? (
                  <p className="text-xs text-slate-500 truncate">{breadcrumb}</p>
                ) : null}
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 truncate">
                  {title}
                </h1>
              </div>
            </div>

            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
        </header>

        <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
