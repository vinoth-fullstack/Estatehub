"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeLike = void 0;
const escapeLike = (value) => value.replace(/[\\%_]/g, (char) => `\\${char}`);
exports.escapeLike = escapeLike;
