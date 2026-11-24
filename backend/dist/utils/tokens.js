"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256 = exports.generateOpaqueToken = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const generateOpaqueToken = () => node_crypto_1.default.randomBytes(48).toString("base64url");
exports.generateOpaqueToken = generateOpaqueToken;
const sha256 = (value) => node_crypto_1.default.createHash("sha256").update(value).digest("hex");
exports.sha256 = sha256;
