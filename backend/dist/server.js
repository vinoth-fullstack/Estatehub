"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const database_1 = require("./config/database");
const env_1 = require("./config/env");
const app = (0, app_1.createApp)();
const server = app.listen(env_1.env.PORT, () => {
    console.log(`EstateHub API running on http://localhost:${env_1.env.PORT}`);
    console.log(`API docs:            http://localhost:${env_1.env.PORT}/api-docs`);
});
function shutdown(signal) {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
        await database_1.pool.end();
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
;
;
