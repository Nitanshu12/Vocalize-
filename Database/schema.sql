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

-- Schema v3: Practice Mode — one row per completed practice session, plus
-- gamification counters on the user. Idempotent; existing rows are unaffected.
create table if not exists practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  source text not null,                  -- 'library' | 'custom'
  paragraph_id text,                     -- library paragraph slug; null for custom
  custom_text text,                      -- user's own text; null for library
  mode text not null default 'audio',    -- 'audio' | 'video'
  timed boolean not null default false,
  prep_seconds integer,
  duration_seconds integer not null,
  transcript text not null,
  wpm integer,
  filler_count integer,
  coverage_pct integer,                  -- % match vs reference; null if no reference
  keyphrase_hit_pct integer,             -- % of key phrases spoken; null for custom
  overall_score integer,                 -- 0..100 combined score
  points_earned integer not null default 0,
  ai_feedback jsonb,                     -- LLM coach output; null if not generated
  created_at timestamptz not null default now()
);

create index if not exists idx_practice_sessions_user_created
  on practice_sessions (user_id, created_at desc);

alter table users add column if not exists total_points integer not null default 0;
alter table users add column if not exists current_streak integer not null default 0;
alter table users add column if not exists longest_streak integer not null default 0;
alter table users add column if not exists last_practice_date date;

-- Schema v4: Whisper transcription upgrade — word timestamps let us count the
-- long pauses (>1.5s gaps) in a session. Idempotent.
alter table practice_sessions add column if not exists long_pauses integer;
