import { useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { useMyTutees } from '@/hooks/useMyTutees';
import { useCreateUser } from '@/hooks/useCreateUser';
import { cn } from '@/lib/cn';

export default function StudentsPage() {
  const { tutees, loading, refresh } = useMyTutees();
  const { createUser, loading: creating, error: createError } = useCreateUser();

  const [form, setForm] = useState({ displayName: '', email: '', password: '' });
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    const result = await createUser({
      ...form,
      targetRole: 'tutee',
    });
    if (result) {
      setSuccess(`Account created for ${result.email}`);
      setForm({ displayName: '', email: '', password: '' });
      refresh();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Students</h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage your tutee accounts.</p>
        </div>

        {/* Create form */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Create Tutee Account
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Display name</label>
              <input
                className={inputCls}
                placeholder="e.g. Alice Smith"
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input
                type="email"
                className={inputCls}
                placeholder="student@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Temporary password</label>
              <input
                type="password"
                className={inputCls}
                placeholder="Min. 6 characters"
                minLength={6}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
            </div>

            {createError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {createError}
              </p>
            )}
            {success && (
              <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={creating}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
            >
              {creating ? 'Creating…' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Tutee list */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Your Students ({tutees.length})
          </h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600" />
            </div>
          ) : tutees.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No students yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {tutees.map((t) => (
                <li key={t.id} className="py-3 flex items-center gap-3">
                  <div className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold',
                    'bg-emerald-100 text-emerald-700'
                  )}>
                    {t.display_name.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{t.display_name}</p>
                    <p className="text-xs text-slate-400">Tutee</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}

const inputCls =
  'w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white';
