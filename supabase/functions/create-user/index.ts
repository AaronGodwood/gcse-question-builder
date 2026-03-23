import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('create-user invoked', req.method);
    const SUPER_ADMIN_EMAIL = Deno.env.get('SUPER_ADMIN_EMAIL') ?? 'godwoodaaron@gmail.com';

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing Authorization header' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    console.log('env check', { hasUrl: !!supabaseUrl, hasAnon: !!supabaseAnonKey, hasService: !!supabaseServiceKey });

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return json({ error: 'Missing environment variables' }, 500);
    }

    // Supabase client using the caller's JWT (for identity verification)
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Supabase admin client (service role, never exposed to frontend)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller identity
    const { data: { user: caller }, error: callerErr } = await supabaseClient.auth.getUser();
    if (callerErr || !caller) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const callerIsSuperAdmin = caller.email === SUPER_ADMIN_EMAIL;

    // Load caller's profile (super admin has no profile row, that's fine)
    let callerRole: string | null = null;
    if (!callerIsSuperAdmin) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', caller.id)
        .single();
      callerRole = profile?.role ?? null;
    }

    if (!callerIsSuperAdmin && callerRole !== 'tutor') {
      return json({ error: 'Forbidden: only tutors and super admin can create accounts' }, 403);
    }

    const { email, password, displayName, targetRole } = await req.json() as {
      email: string;
      password: string;
      displayName: string;
      targetRole: 'tutor' | 'tutee';
    };

    if (!email || !password || !displayName || !targetRole) {
      return json({ error: 'Missing required fields: email, password, displayName, targetRole' }, 400);
    }

    // Validate role permissions
    if (!callerIsSuperAdmin && targetRole !== 'tutee') {
      return json({ error: 'Tutors can only create tutee accounts' }, 403);
    }
    if (callerIsSuperAdmin && targetRole === 'tutee') {
      return json({ error: 'Super admin can only create tutor accounts' }, 403);
    }

    // Create the auth user
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createErr || !newUser.user) {
      return json({ error: createErr?.message ?? 'Failed to create user' }, 400);
    }

    const newId = newUser.user.id;

    // Insert profile row
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newId,
        role: targetRole,
        display_name: displayName,
        created_by: callerIsSuperAdmin ? null : caller.id,
      });

    if (profileErr) {
      // Roll back auth user if profile insert fails
      await supabaseAdmin.auth.admin.deleteUser(newId);
      return json({ error: profileErr.message }, 500);
    }

    // Link tutor → tutee
    if (targetRole === 'tutee' && !callerIsSuperAdmin) {
      const { error: linkErr } = await supabaseAdmin
        .from('tutor_tutee')
        .insert({ tutor_id: caller.id, tutee_id: newId });

      if (linkErr) {
        return json({ error: linkErr.message }, 500);
      }
    }

    return json({ id: newId, email });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
