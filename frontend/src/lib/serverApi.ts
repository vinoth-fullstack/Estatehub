import { SERVER_API_URL } from "./config";
import { toApiError } from "./apiError";

interface ServerFetchOptions {

  revalidate: number;
  tags?: string[];
}

export async function serverFetch<T>(path: string, options: ServerFetchOptions): Promise<T> {
  const response = await fetch(`${SERVER_API_URL}${path}`, {
    next: { revalidate: options.revalidate, tags: options.tags },
  });
  if (!response.ok) throw await toApiError(response);
  return response.json() as Promise<T>;
}
