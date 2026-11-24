

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE properties (
    id             BIGSERIAL PRIMARY KEY,
    owner_id       BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title          VARCHAR(150)  NOT NULL,
    description    TEXT          NOT NULL,
    property_type  VARCHAR(20)   NOT NULL
                   CHECK (property_type IN ('apartment', 'house', 'villa', 'plot', 'commercial')),
    listing_type   VARCHAR(10)   NOT NULL
                   CHECK (listing_type IN ('sale', 'rent')),
    price          BIGINT        NOT NULL CHECK (price > 0),
    bedrooms       SMALLINT      NOT NULL DEFAULT 0 CHECK (bedrooms BETWEEN 0 AND 20),
    bathrooms      SMALLINT      NOT NULL DEFAULT 0 CHECK (bathrooms BETWEEN 0 AND 20),
    area_sqft      INTEGER       NOT NULL CHECK (area_sqft > 0),
    address_line   VARCHAR(255)  NOT NULL,
    locality       VARCHAR(100)  NOT NULL,
    city           VARCHAR(100)  NOT NULL,
    state          VARCHAR(100)  NOT NULL,
    pincode        CHAR(6)       NOT NULL,
    amenities      TEXT[]        NOT NULL DEFAULT '{}',
    status         VARCHAR(10)   NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'inactive')),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),

    location_text  TEXT GENERATED ALWAYS AS (lower(city || ' ' || locality || ' ' || state)) STORED
);
