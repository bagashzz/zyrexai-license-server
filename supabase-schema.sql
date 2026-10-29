
create table if not exists public.zyrex_licenses (
  id bigint generated always as identity primary key,
  serial_hash text unique not null,
  masked_serial text not null,
  active boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);

alter table public.zyrex_licenses enable row level security;

revoke all on public.zyrex_licenses from anon, authenticated;

