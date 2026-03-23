import { useEffect, useState } from 'react';
import { ShieldCheck, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCreateUser } from '@/hooks/useCreateUser';
import type { Profile } from '@/types/profile';

export default function AdminPage() {
  const { createUser, loading: creating, error: createError } = useCreateUser();
  const [tutors, setTutors] = useState<Profile[]>([]);
  const [loadingTutors, setLoadingTutors] = useState(false);
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });
  const [success, setSuccess] = useState<string | null>(null);

  const loadTutors = async () => {
    setLoadingTutors(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'tutor')
      .order('display_name');
    setTutors((data as Profile[]) ?? []);
    setLoadingTutors(false);
  };

  useEffect(() => { loadTutors(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    const result = await createUser({ ...form, targetRole: 'tutor' });
    if (result) {
      setSuccess(`Tutor account created for ${result.email}`);
      setForm({ displayName: '', email: '', password: '' });
      loadTutors();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Admin</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage tutor accounts.</p>
          </div>
        </div>

        {/* Create tutor form */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Create Tutor Account
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Display name</label>
              <input
                className={inputCls}
                placeholder="e.g. Jane Doe"
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
                placeholder="tutor@example.com"
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

        {/* Tutor list */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            All Tutors ({tutors.length})
          </h2>
          {loadingTutors ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600" />
            </div>
          ) : tutors.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No tutors yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {tutors.map((t) => (
                <li key={t.id} className="py-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-semibold">
                    {t.display_name.charAt(0).toUpperCase() || '?'}
                  </div>
                  <p className="text-sm font-medium text-slate-900">{t.display_name}</p>
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
