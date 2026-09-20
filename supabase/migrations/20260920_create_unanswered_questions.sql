create extension if not exists pgcrypto;

create table if not exists public.unanswered_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  reason text not null,
  top_score numeric,
  reviewed boolean not null default false,
  created_at timestamptz not null default now(),
  constraint unanswered_questions_reason_check
    check (reason in ('no_results', 'low_similarity', 'missing_profile_info')),
  constraint unanswered_questions_question_length_check
    check (char_length(btrim(question)) between 1 and 400)
);

alter table public.unanswered_questions enable row level security;

revoke all on table public.unanswered_questions from anon, authenticated;
grant select, insert, update, delete
  on table public.unanswered_questions
  to service_role;

create index if not exists unanswered_questions_review_queue_idx
  on public.unanswered_questions (reviewed, created_at desc);
