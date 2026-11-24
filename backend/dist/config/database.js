"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.query = query;
exports.withTransaction = withTransaction;
const pg_1 = require("pg");
const env_1 = require("./env");
pg_1.types.setTypeParser(20, (value) => parseInt(value, 10));
exports.pool = new pg_1.Pool({
    connectionString: env_1.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
});
exports.pool.on("error", (error) => {
    console.error("Unexpected error on idle PostgreSQL client", error);
});
async function query(text, params = []) {
    return exports.pool.query(text, params);
}
async function withTransaction(work) {
    const client = await exports.pool.connect();
    try {
        await client.query("BEGIN");
        const result = await work(client);
        await client.query("COMMIT");
        return result;
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
}
