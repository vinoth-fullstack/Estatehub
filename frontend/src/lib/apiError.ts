export interface FieldProblem {
  location?: string;
  path: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string = "ERROR",
    public readonly details: FieldProblem[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = await response.json();
    const error = body?.error;
    return new ApiError(
      response.status,
      error?.message ?? "Request failed",
      error?.code,
      Array.isArray(error?.details) ? error.details : [],
    );
  } catch {
    return new ApiError(response.status, `Request failed (${response.status})`);
  }
}

export function fieldErrorsFrom(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};
  const result: Record<string, string> = {};
  for (const problem of error.details) {
    if (problem.path && !result[problem.path]) result[problem.path] = problem.message;
  }
  return result;
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Please try again.";
