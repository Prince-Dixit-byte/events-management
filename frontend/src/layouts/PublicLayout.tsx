import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleDashboardPath } from '../hooks/useDashboardPath';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-4">
          <Link
            to="/"
            className="text-lg font-bold tracking-tight text-[#0F2942] whitespace-nowrap shrink-0"
          >
            CampusEvents
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <Link
              to="/events"
              className="hover:text-[#0F2942] transition-colors whitespace-nowrap shrink-0"
            >
              Events
            </Link>
            <a
              href="/#workflows"
              className="hover:text-[#0F2942] transition-colors whitespace-nowrap shrink-0"
            >
              Workflows
            </a>
            <a
              href="/#roles"
              className="hover:text-[#0F2942] transition-colors whitespace-nowrap shrink-0"
            >
              Portals
            </a>
            <Link
              to="/register"
              className="hover:text-[#0F2942] transition-colors whitespace-nowrap shrink-0"
            >
              Register
            </Link>
          </nav>

          <div className="flex items-center shrink-0">
            {user ? (
              <Link
                to={getRoleDashboardPath(user.role)}
                className="rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-medium text-white hover:bg-[#163859] transition-colors whitespace-nowrap shrink-0"
              >
                Open Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-medium text-white hover:bg-[#163859] transition-colors whitespace-nowrap shrink-0"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#0F2942]">CampusEvents</p>
            <p className="mt-1 text-xs text-slate-500">
              Centralized College Event Management & Participation System
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
            <Link to="/events" className="hover:text-[#0F2942]">
              Browse Events
            </Link>
            <Link to="/login" className="hover:text-[#0F2942]">
              Portal Login
            </Link>
            <Link to="/register" className="hover:text-[#0F2942]">
              Student Registration
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
