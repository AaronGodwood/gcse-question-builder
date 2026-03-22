-- Enable Row Level Security
alter table public.questions enable row level security;
alter table public.worksheets enable row level security;
alter table public.topics enable row level security;

-- topics: readable by all authenticated users, not writable by users
create policy "topics_select_authenticated"
  on public.topics for select
  to authenticated
  using (true);

-- questions: users can only see and modify their own questions
create policy "questions_select_own"
  on public.questions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "questions_insert_own"
  on public.questions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "questions_update_own"
  on public.questions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "questions_delete_own"
  on public.questions for delete
  to authenticated
  using (auth.uid() = user_id);

-- worksheets: users can only see and modify their own worksheets
create policy "worksheets_select_own"
  on public.worksheets for select
  to authenticated
  using (auth.uid() = user_id);

create policy "worksheets_insert_own"
  on public.worksheets for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "worksheets_update_own"
  on public.worksheets for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "worksheets_delete_own"
  on public.worksheets for delete
  to authenticated
  using (auth.uid() = user_id);
