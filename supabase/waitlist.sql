create table if not exists waitlist (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  created_at timestamptz default now(),
  source text default 'website',
  converted_to_user boolean default false
);

alter table waitlist enable row level security;

create policy "insert only" on waitlist
  for insert with check (true);
