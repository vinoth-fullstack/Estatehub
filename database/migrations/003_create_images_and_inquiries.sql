

CREATE TABLE property_images (
    id           BIGSERIAL PRIMARY KEY,
    property_id  BIGINT        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    file_name    VARCHAR(100)  NOT NULL,
    position     SMALLINT      NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_property_images_property ON property_images (property_id, position, id);

CREATE TABLE inquiries (
    id           BIGSERIAL PRIMARY KEY,
    property_id  BIGINT        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    sender_id    BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         VARCHAR(100)  NOT NULL,
    email        VARCHAR(255)  NOT NULL,
    phone        VARCHAR(15)   NOT NULL,
    message      TEXT          NOT NULL,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT uq_inquiry_per_user_per_property UNIQUE (property_id, sender_id)
);

CREATE INDEX idx_inquiries_sender ON inquiries (sender_id, created_at DESC);
