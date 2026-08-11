BEGIN;

CREATE TABLE IF NOT EXISTS public.user_roles (
    role_assignment_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('PASSENGER', 'DRIVER', 'ADMIN')),
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role)
);

INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'PASSENGER'
FROM public.passengers
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'DRIVER'
FROM public.drivers
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'ADMIN'
FROM public.users
WHERE is_admin = TRUE OR LOWER(role) = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.auth_sessions (
    session_id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    active_mode VARCHAR(20) NOT NULL CHECK (active_mode IN ('PASSENGER', 'DRIVER', 'ADMIN')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    revoked_reason VARCHAR(50)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_auth_sessions_one_active_user
ON public.auth_sessions (user_id)
WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_hash
ON public.auth_sessions (token_hash);

COMMIT;
