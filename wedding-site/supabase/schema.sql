create extension if not exists pgcrypto;

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  party_name text not null,
  primary_email text not null,
  secondary_email text,
  guest_names jsonb not null default '[]'::jsonb,
  max_guests integer not null default 1 check (max_guests >= 1),
  attendance text check (attendance in ('yes', 'no')),
  guest_count integer check (guest_count >= 0),
  dietary_restrictions text not null default '',
  song_request text not null default '',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invites_token_idx on public.invites (token);
create index if not exists invites_primary_email_idx on public.invites (lower(primary_email));
create index if not exists invites_secondary_email_idx on public.invites (lower(secondary_email));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists invites_set_updated_at on public.invites;

create trigger invites_set_updated_at
before update on public.invites
for each row
execute function public.set_updated_at();

alter table public.invites enable row level security;
