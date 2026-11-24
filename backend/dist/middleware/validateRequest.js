"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const AppError_1 = require("../utils/AppError");
const validateRequest = (schemas) => (req, _res, next) => {
    const problems = [];
    for (const location of ["params", "query", "body"]) {
        const schema = schemas[location];
        if (!schema)
            continue;
        const result = schema.safeParse(req[location]);
        if (result.success) {
            req[location] = result.data;
        }
        else {
            for (const issue of result.error.issues) {
                problems.push({ location, path: issue.path.join("."), message: issue.message });
            }
        }
    }
    if (problems.length > 0) {
        return next(new AppError_1.AppError(400, "Validation failed", "VALIDATION_ERROR", problems));
    }
    next();
};
exports.validateRequest = validateRequest;
