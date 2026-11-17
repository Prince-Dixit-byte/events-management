import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getRoleDashboardPath } from '../hooks/useDashboardPath';
import { PublicLayout } from '../layouts/PublicLayout';
import { extractErrorMessage } from '../services/api';

const DEMO_ACCOUNTS = [
  { label: 'Administrator', email: 'admin@college.edu', pass: 'Admin@123' },
  { label: 'Faculty', email: 'faculty@college.edu', pass: 'Faculty@123' },
  { label: 'Student', email: 'arjun.sharma@college.edu', pass: 'Student@123' },
];

export function LoginPage() {
  const { login } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your college email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      showSuccess(`Welcome back, ${user.name}.`);
      navigate(fromPath || getRoleDashboardPath(user.role), { replace: true });
    } catch (err) {
      const msg = extractErrorMessage(err, 'Invalid email or password.');
      setErrorMsg(msg);
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const applyDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg('');
  };

  return (
    <PublicLayout>
      <div className="mx-auto flex max-w-md flex-col justify-center px-6 py-14">
        <div className="rounded-xl border border-slate-200 bg-white p-7">
          <h1 className="text-2xl font-bold tracking-tight text-[#0F2942]">
            Sign in to CampusEvents
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Access your administrator, faculty, or student portal.
          </p>

          {errorMsg ? (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              {errorMsg}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-800">
                College email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@college.edu"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-800">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#0F2942] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#163859] transition-colors disabled:opacity-60"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500">
              Seeded accounts for project demonstration:
            </p>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => applyDemoAccount(acc.email, acc.pass)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800 transition-colors"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">
            New student?{' '}
            <Link to="/register" className="font-semibold text-indigo-700 hover:text-indigo-800">
              Register an account
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
