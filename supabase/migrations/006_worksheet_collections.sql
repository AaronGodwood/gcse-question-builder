-- Add completed_at to worksheet_assignments
alter table public.worksheet_assignments
  add column if not exists completed_at timestamptz null;

-- Allow tutees to mark their own assignments complete/incomplete
create policy "worksheet_assignments_update_own"
  on public.worksheet_assignments for update
  to authenticated
  using (tutee_id = auth.uid())
  with check (tutee_id = auth.uid());

-- Tutee worksheet collections (saving tutor worksheets to explore later)
create table if not exists public.worksheet_collections (
  tutee_id     uuid not null references public.profiles(id) on delete cascade,
  worksheet_id uuid not null references public.worksheets(id) on delete cascade,
  added_at     timestamptz not null default now(),
  primary key (tutee_id, worksheet_id)
);

alter table public.worksheet_collections enable row level security;

create policy "worksheet_collections_select"
  on public.worksheet_collections for select
  to authenticated
  using (tutee_id = auth.uid());

create policy "worksheet_collections_insert"
  on public.worksheet_collections for insert
  to authenticated
  with check (tutee_id = auth.uid());

create policy "worksheet_collections_delete"
  on public.worksheet_collections for delete
  to authenticated
  using (tutee_id = auth.uid());
