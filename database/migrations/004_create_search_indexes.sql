

CREATE INDEX idx_properties_location_trgm
    ON properties USING gin (location_text gin_trgm_ops)
    WHERE status = 'active';

CREATE INDEX idx_properties_feed
    ON properties (created_at DESC, id DESC)
    WHERE status = 'active';

CREATE INDEX idx_properties_price
    ON properties (price, id)
    WHERE status = 'active';

CREATE INDEX idx_properties_filters
    ON properties (listing_type, property_type, bedrooms, price)
    WHERE status = 'active';

CREATE INDEX idx_properties_similar
    ON properties (city, listing_type, property_type, price)
    WHERE status = 'active';

CREATE INDEX idx_properties_owner
    ON properties (owner_id, created_at DESC);
