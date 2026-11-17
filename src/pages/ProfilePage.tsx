import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatRoleLabel } from '../hooks/useDashboardPath';
import { DashboardLayout } from '../layouts/DashboardLayout';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <DashboardLayout title="User Profile" breadcrumb="Account / Profile">
      <div className="max-w-2xl space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Account Information</h2>
          <p className="mt-1 text-xs text-slate-500">
            Verified identity and role assignment stored in the institutional database
          </p>

          <dl className="mt-6 divide-y divide-slate-100 border-t border-slate-100 text-sm">
            <div className="grid grid-cols-3 gap-4 py-3.5">
              <dt className="font-medium text-slate-500">User ID</dt>
              <dd className="col-span-2 font-mono text-slate-900 tabular-nums">#{user.id}</dd>
            </div>
            <div className="grid grid-cols-3 gap-4 py-3.5">
              <dt className="font-medium text-slate-500">Full Name</dt>
              <dd className="col-span-2 font-medium text-slate-900">{user.name}</dd>
            </div>
            <div className="grid grid-cols-3 gap-4 py-3.5">
              <dt className="font-medium text-slate-500">Email Address</dt>
              <dd className="col-span-2 text-slate-900">{user.email}</dd>
            </div>
            <div className="grid grid-cols-3 gap-4 py-3.5">
              <dt className="font-medium text-slate-500">Assigned Role</dt>
              <dd className="col-span-2 font-semibold text-[#0F2942]">
                {formatRoleLabel(user.role)}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-4 py-3.5">
              <dt className="font-medium text-slate-500">Department</dt>
              <dd className="col-span-2 text-slate-900">{user.department || 'Not specified'}</dd>
            </div>
            <div className="grid grid-cols-3 gap-4 py-3.5">
              <dt className="font-medium text-slate-500">Member Since</dt>
              <dd className="col-span-2 font-mono text-xs text-slate-700 tabular-nums">
                {new Date(user.createdAt).toLocaleString()}
              </dd>
            </div>
          </dl>

          <div className="mt-6 pt-5 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 transition-colors"
            >
              Sign out of session
            </button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
