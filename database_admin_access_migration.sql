BEGIN;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS is_admin boolean;

UPDATE public.users
SET is_admin = false
WHERE is_admin IS NULL;

ALTER TABLE public.users
    ALTER COLUMN is_admin SET DEFAULT false,
    ALTER COLUMN is_admin SET NOT NULL;


ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS account_status character varying(20);

UPDATE public.users
SET account_status = 'ACTIVE'
WHERE account_status IS NULL;

ALTER TABLE public.users
    ALTER COLUMN account_status SET DEFAULT 'ACTIVE',
    ALTER COLUMN account_status SET NOT NULL;


ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS suspension_reason character varying(500);

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS suspended_at timestamp without time zone;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS suspended_by integer;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS reactivated_at timestamp without time zone;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS reactivated_by integer;


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_account_status_check'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_account_status_check
            CHECK (account_status IN ('ACTIVE', 'SUSPENDED'));
    END IF;
END
$$;


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_suspended_by_fkey'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_suspended_by_fkey
            FOREIGN KEY (suspended_by)
            REFERENCES public.users(user_id)
            ON DELETE SET NULL;
    END IF;
END
$$;


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_reactivated_by_fkey'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_reactivated_by_fkey
            FOREIGN KEY (reactivated_by)
            REFERENCES public.users(user_id)
            ON DELETE SET NULL;
    END IF;
END
$$;


CREATE INDEX IF NOT EXISTS idx_users_admin
    ON public.users (is_admin)
    WHERE is_admin = true;

CREATE INDEX IF NOT EXISTS idx_users_account_status
    ON public.users (account_status);

COMMIT;