import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import { AppError } from "../utils/AppError";

interface RequestSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export const validateRequest =
  (schemas: RequestSchemas) => (req: Request, _res: Response, next: NextFunction) => {
    const problems: { location: string; path: string; message: string; }[] = [];

    for (const location of ["params", "query", "body"] as const) {
      const schema = schemas[location];
      if (!schema) continue;

      const result = schema.safeParse(req[location]);
      if (result.success) {
        (req as unknown as Record<string, unknown>)[location] = result.data;
      } else {
        for (const issue of result.error.issues) {
          problems.push({ location, path: issue.path.join("."), message: issue.message });
        }
      }
    }

    if (problems.length > 0) {
      return next(new AppError(400, "Validation failed", "VALIDATION_ERROR", problems));
    }
    next();
  };
