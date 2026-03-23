import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Role } from '@/types/profile';

interface CreateUserParams {
  email: string;
  password: string;
  displayName: string;
  targetRole: Role;
}

interface UseCreateUserResult {
  createUser: (params: CreateUserParams) => Promise<{ id: string; email: string } | null>;
  loading: boolean;
  error: string | null;
}

export function useCreateUser(): UseCreateUserResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = useCallback(async (params: CreateUserParams) => {
    setLoading(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    console.log('session before invoke:', session?.access_token ? 'has token' : 'NO TOKEN');

    const { data, error: fnErr } = await supabase.functions.invoke('create-user', {
      body: params,
    });

    setLoading(false);

    if (fnErr || data?.error) {
      const msg = data?.error ?? fnErr?.message ?? 'Failed to create user';
      setError(msg);
      return null;
    }

    return data as { id: string; email: string };
  }, []);

  return { createUser, loading, error };
}
