BEGIN;

ALTER TABLE public.otp_codes
    ALTER COLUMN user_id DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS recipient_email varchar(100),
    ADD COLUMN IF NOT EXISTS purpose varchar(40),
    ADD COLUMN IF NOT EXISTS otp_hash varchar(255),
    ADD COLUMN IF NOT EXISTS used_at timestamp without time zone;

UPDATE public.otp_codes AS code
SET recipient_email = user_record.email
FROM public.users AS user_record
WHERE code.user_id = user_record.user_id
  AND code.recipient_email IS NULL;

UPDATE public.otp_codes
SET status = 'EXPIRED',
    recipient_email = COALESCE(recipient_email, 'legacy-expired@velocity.invalid'),
    purpose = COALESCE(purpose, 'LEGACY'),
    otp_hash = COALESCE(otp_hash, 'LEGACY_EXPIRED_OTP'),
    created_at = COALESCE(created_at, CURRENT_TIMESTAMP)
WHERE recipient_email IS NULL
   OR purpose IS NULL
   OR otp_hash IS NULL
   OR status = 'ACTIVE';

ALTER TABLE public.otp_codes
    ALTER COLUMN recipient_email SET NOT NULL,
    ALTER COLUMN purpose SET NOT NULL,
    ALTER COLUMN otp_hash SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    DROP COLUMN otp;

CREATE INDEX IF NOT EXISTS idx_otp_codes_expiry
    ON public.otp_codes (expires_at);

CREATE UNIQUE INDEX IF NOT EXISTS uq_otp_codes_active_recipient_purpose
    ON public.otp_codes (lower(recipient_email), purpose)
    WHERE status = 'ACTIVE';

COMMIT;
