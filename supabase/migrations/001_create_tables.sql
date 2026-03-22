-- Enable UUID extension
create extension if not exists "pgcrypto";

-- topics lookup table
create table if not exists public.topics (
  id            serial primary key,
  name          text not null unique,
  subtopics     text[] not null default '{}',
  display_order integer not null default 0
);

-- questions table
create table if not exists public.questions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  title              text not null default '',
  question_text      text not null default '',
  canvas_data        jsonb,
  mark_scheme        text not null default '',
  topic              text not null default '',
  subtopic           text not null default '',
  target_grade       integer not null default 5 check (target_grade between 1 and 9),
  marks              integer not null default 1 check (marks > 0),
  calculator         text not null default 'either' check (calculator in ('calculator', 'non-calculator', 'either')),
  paper              text not null default 'any' check (paper in ('1', '2', '3', 'any')),
  answer_space_lines integer not null default 4,
  tags               text[] not null default '{}',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- worksheets table
create table if not exists public.worksheets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default 'Untitled Worksheet',
  description text not null default '',
  question_ids uuid[] not null default '{}',
  settings    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at on questions
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger questions_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

create trigger worksheets_updated_at
  before update on public.worksheets
  for each row execute function public.set_updated_at();
