
ALTER TABLE users ADD COLUMN avatar_file_name VARCHAR(100);
ALTER TABLE inquiries ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending';
ALTER TABLE inquiries ADD CONSTRAINT inquiries_status_check CHECK (status IN ('pending', 'replied', 'accepted', 'rejected'));

CREATE TABLE inquiry_messages (
  id BIGSERIAL PRIMARY KEY,
  inquiry_id BIGINT NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_inquiry_messages_thread ON inquiry_messages (inquiry_id, created_at, id);

CREATE TABLE password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_password_reset_user_created ON password_reset_tokens (user_id, created_at DESC);
