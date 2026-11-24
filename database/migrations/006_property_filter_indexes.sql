
CREATE INDEX idx_properties_area
  ON properties (area_sqft)
  WHERE status = 'active';

CREATE INDEX idx_properties_amenities
  ON properties USING gin (amenities)
  WHERE status = 'active';
