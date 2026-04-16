-- Enable RLS on stripe_webhook_events.
-- This table is written exclusively by the backend via the service role key.
-- No client-facing policies are needed: all direct client access is denied by default.
alter table public.stripe_webhook_events enable row level security;
