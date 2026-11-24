

ALTER TABLE properties
  ADD COLUMN search_text TEXT GENERATED ALWAYS AS (
    lower(title || ' ' || address_line || ' ' || locality || ' ' || city || ' ' || state)
  ) STORED;

CREATE INDEX idx_properties_search_trgm
  ON properties USING gin (search_text gin_trgm_ops)
  WHERE status = 'active';

CREATE INDEX idx_properties_suggestion_location
  ON properties (lower(city), lower(locality))
  WHERE status = 'active';

CREATE INDEX idx_properties_area
  ON properties (area_sqft)
  WHERE status = 'active';

CREATE INDEX idx_properties_amenities
  ON properties USING gin (amenities)
  WHERE status = 'active';
