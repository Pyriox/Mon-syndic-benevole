-- Idempotence Stripe webhooks: one event id processed once.
create table if not exists public.stripe_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  status text not null check (status in ('processing', 'processed', 'failed')),
  received_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  failure_reason text
);

create index if not exists stripe_webhook_events_status_idx
  on public.stripe_webhook_events (status, received_at desc);
