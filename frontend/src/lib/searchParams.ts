
export const FILTER_KEYS = ["q", "listingType", "propertyType", "minPrice", "maxPrice", "minArea", "maxArea", "bedrooms", "amenities", "sort"] as const;

export type RawSearchParams = Record<string, string | string[] | undefined>;

const firstValue = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export function pickFilterParams(raw: RawSearchParams): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = firstValue(raw[key])?.trim();
    if (value) params.set(key, value);
  }
  const page = Number(firstValue(raw.page));
  if (Number.isInteger(page) && page > 1) params.set("page", String(page));
  return params;
}
