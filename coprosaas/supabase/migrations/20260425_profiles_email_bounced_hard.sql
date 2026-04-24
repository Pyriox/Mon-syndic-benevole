-- Migration: Add email_bounced_hard flag to profiles
-- Used to prevent sending emails to permanently bounced addresses (Resend webhook).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_bounced_hard boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN profiles.email_bounced_hard IS
  'Set to true when Resend reports a permanent (hard) bounce for this user''s email. '
  'Used to suppress future outbound emails to this address.';

-- Index for fast lookup by email (e.g. bounce webhook sets flag by email address)
CREATE INDEX IF NOT EXISTS idx_profiles_email_bounced
  ON profiles (email)
  WHERE email_bounced_hard = true;
