-- Run this in your Supabase SQL editor (https://app.supabase.com → SQL Editor)

create table if not exists tools (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  url         text not null,
  description text,
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now()
);

-- Optional: enable Row Level Security and allow anonymous reads/writes
-- (suitable for personal/local use — lock it down if you make this public)
alter table tools enable row level security;

create policy "Allow all for now"
  on tools
  for all
  using (true)
  with check (true);
