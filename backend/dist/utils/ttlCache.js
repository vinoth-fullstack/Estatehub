"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TtlCache = void 0;
class TtlCache {
    ttlMs;
    maxEntries;
    entries = new Map();
    constructor(ttlMs, maxEntries = 5000) {
        this.ttlMs = ttlMs;
        this.maxEntries = maxEntries;
    }
    get(key) {
        const entry = this.entries.get(key);
        if (!entry)
            return undefined;
        if (entry.expiresAt < Date.now()) {
            this.entries.delete(key);
            return undefined;
        }
        return entry.value;
    }
    set(key, value) {
        if (this.entries.size >= this.maxEntries) {
            const oldestKey = this.entries.keys().next().value;
            if (oldestKey !== undefined)
                this.entries.delete(oldestKey);
        }
        this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    }
    delete(key) {
        this.entries.delete(key);
    }
}
exports.TtlCache = TtlCache;
