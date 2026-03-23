-- profiles table: one row per auth user, stores role + who created them
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         text not null check (role in ('tutor', 'tutee')),
  display_name text not null default '',
  created_by   uuid references public.profiles(id) on delete set null
);

alter table public.profiles enable row level security;

-- tutor → tutee relationships
create table if not exists public.tutor_tutee (
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  tutee_id uuid not null references public.profiles(id) on delete cascade,
  primary key (tutor_id, tutee_id)
);

alter table public.tutor_tutee enable row level security;

-- Add visibility flag to questions and worksheets
alter table public.questions  add column if not exists is_private boolean not null default false;
alter table public.worksheets add column if not exists is_private boolean not null default false;

-- Worksheet assignments (tutor assigns worksheet to a tutee)
create table if not exists public.worksheet_assignments (
  id           uuid primary key default gen_random_uuid(),
  worksheet_id uuid not null references public.worksheets(id) on delete cascade,
  tutee_id     uuid not null references public.profiles(id) on delete cascade,
  assigned_by  uuid not null references public.profiles(id) on delete cascade,
  assigned_at  timestamptz not null default now(),
  unique(worksheet_id, tutee_id)
);

alter table public.worksheet_assignments enable row level security;
