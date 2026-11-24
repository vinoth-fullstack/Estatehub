"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeCursor = void 0;
exports.decodeCursor = decodeCursor;
const AppError_1 = require("./AppError");
const encodeCursor = (cursor) => Buffer.from(JSON.stringify(cursor)).toString("base64url");
exports.encodeCursor = encodeCursor;
function decodeCursor(raw) {
    try {
        const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
        if (typeof parsed.value === "string" && Number.isInteger(parsed.id)) {
            return { value: parsed.value, id: parsed.id };
        }
    }
    catch {
    }
    throw AppError_1.AppError.badRequest("Invalid pagination cursor");
}
