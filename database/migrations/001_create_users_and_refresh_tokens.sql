

CREATE TABLE users (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(100)  NOT NULL,
    email          VARCHAR(255)  NOT NULL,
    password_hash  VARCHAR(100)  NOT NULL,
    phone          VARCHAR(15),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_users_email_lower ON users (lower(email));

CREATE TABLE refresh_tokens (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash   CHAR(64)     NOT NULL UNIQUE,
    expires_at   TIMESTAMPTZ  NOT NULL,
    revoked_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);
