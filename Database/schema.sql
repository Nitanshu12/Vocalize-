-- Vocalize schema v1: auth only. Run once against your local/dev database.
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Opaque, rotating refresh tokens. We store a hash, never the raw token —
-- if this table leaked, no session could be replayed from it.
create table if not exists refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  replaced_by_id uuid references refresh_tokens(id),
  user_agent text,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_refresh_tokens_user_id on refresh_tokens(user_id);

-- Schema v2: post-signup onboarding profile. Columns stay null until the
-- user finishes the onboarding flow; existing rows are unaffected.
alter table users add column if not exists onboarding_completed_at timestamptz;
alter table users add column if not exists practice_goal text;
alter table users add column if not exists confidence_level text;
alter table users add column if not exists weekly_time_commitment text;
