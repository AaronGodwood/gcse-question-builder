-- ============================================================
-- Helper function: returns the role of the currently signed-in user
-- ============================================================
create or replace function public.current_user_role()
returns text language sql stable security definer as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ============================================================
-- Helper function: returns the tutor_id for the current tutee
-- ============================================================
create or replace function public.current_tutee_tutor_id()
returns uuid language sql stable security definer as $$
  select tutor_id from public.tutor_tutee where tutee_id = auth.uid() limit 1
$$;

-- ============================================================
-- Helper function: is the current user the super admin?
-- ============================================================
create or replace function public.is_super_admin()
returns boolean language sql stable security definer as $$
  select (auth.jwt() ->> 'email') = 'godwoodaaron@gmail.com'
$$;

-- ============================================================
-- profiles RLS
-- ============================================================

-- Own row always visible; tutor can see their tutees; super admin sees all
create policy "profiles_select"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or public.is_super_admin()
    or exists (
      select 1 from public.tutor_tutee
      where tutor_id = auth.uid() and tutee_id = profiles.id
    )
    or exists (
      select 1 from public.tutor_tutee
      where tutee_id = auth.uid() and tutor_id = profiles.id
    )
  );

-- Only service role (Edge Function) inserts profiles
-- No INSERT policy → only service_role bypasses RLS

-- Users can update only their own display_name
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ============================================================
-- tutor_tutee RLS
-- ============================================================

create policy "tutor_tutee_select"
  on public.tutor_tutee for select
  to authenticated
  using (tutor_id = auth.uid() or tutee_id = auth.uid() or public.is_super_admin());

create policy "tutor_tutee_insert"
  on public.tutor_tutee for insert
  to authenticated
  with check (tutor_id = auth.uid() or public.is_super_admin());

create policy "tutor_tutee_delete"
  on public.tutor_tutee for delete
  to authenticated
  using (tutor_id = auth.uid() or public.is_super_admin());

-- ============================================================
-- questions RLS (replace existing policies)
-- ============================================================

drop policy if exists "questions_select_own" on public.questions;

-- Own questions always visible
-- Tutors can see other tutors' non-private questions
-- Tutees can see their own tutor's non-private questions
create policy "questions_select"
  on public.questions for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_super_admin()
    or (
      is_private = false
      and public.current_user_role() = 'tutor'
      and exists (select 1 from public.profiles where id = questions.user_id and role = 'tutor')
    )
    or (
      is_private = false
      and public.current_user_role() = 'tutee'
      and user_id = public.current_tutee_tutor_id()
    )
  );

-- insert/update/delete unchanged: own rows only
-- (existing policies "questions_insert_own", "questions_update_own", "questions_delete_own" remain)

-- ============================================================
-- worksheets RLS (replace existing select policy)
-- ============================================================

drop policy if exists "worksheets_select_own" on public.worksheets;

-- Own worksheets always visible
-- Tutors see other tutors' non-private worksheets
-- Tutees see worksheets assigned to them
create policy "worksheets_select"
  on public.worksheets for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_super_admin()
    or (
      is_private = false
      and public.current_user_role() = 'tutor'
      and exists (select 1 from public.profiles where id = worksheets.user_id and role = 'tutor')
    )
    or (
      public.current_user_role() = 'tutee'
      and exists (
        select 1 from public.worksheet_assignments
        where worksheet_id = worksheets.id and tutee_id = auth.uid()
      )
    )
  );

-- ============================================================
-- worksheet_assignments RLS
-- ============================================================

-- Tutee sees their own assignments; tutor sees assignments they created
create policy "worksheet_assignments_select"
  on public.worksheet_assignments for select
  to authenticated
  using (
    tutee_id = auth.uid()
    or assigned_by = auth.uid()
    or public.is_super_admin()
  );

-- Only the worksheet owner can assign
create policy "worksheet_assignments_insert"
  on public.worksheet_assignments for insert
  to authenticated
  with check (
    assigned_by = auth.uid()
    and exists (
      select 1 from public.worksheets
      where id = worksheet_id and user_id = auth.uid()
    )
  );

create policy "worksheet_assignments_delete"
  on public.worksheet_assignments for delete
  to authenticated
  using (
    assigned_by = auth.uid()
    or public.is_super_admin()
  );
