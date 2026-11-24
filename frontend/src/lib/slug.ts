
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const propertySlug = (id: number, title: string) => `${slugify(title)}-${id}`;
export const propertyPath = (id: number, title: string) => `/properties/${propertySlug(id, title)}`;

export function parsePropertyId(slug: string): number | null {
  const match = slug.match(/(\d+)$/);
  return match ? Number(match[1]) : null;
}
