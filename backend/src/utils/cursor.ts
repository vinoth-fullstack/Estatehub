import { AppError } from "./AppError";

export interface KeysetCursor {
  value: string;
  id: number;
}

export const encodeCursor = (cursor: KeysetCursor) =>
  Buffer.from(JSON.stringify(cursor)).toString("base64url");

export function decodeCursor(raw: string): KeysetCursor {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof parsed.value === "string" && Number.isInteger(parsed.id)) {
      return { value: parsed.value, id: parsed.id };
    }
  } catch {

  }
  throw AppError.badRequest("Invalid pagination cursor");
}
