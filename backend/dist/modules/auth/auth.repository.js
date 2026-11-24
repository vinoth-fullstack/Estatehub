"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByEmail = findUserByEmail;
exports.findUserById = findUserById;
exports.updateUserProfile = updateUserProfile;
exports.setPasswordHash = setPasswordHash;
exports.insertPasswordReset = insertPasswordReset;
exports.findValidPasswordReset = findValidPasswordReset;
exports.consumePasswordReset = consumePasswordReset;
exports.findPasswordHash = findPasswordHash;
exports.changePassword = changePassword;
exports.insertUser = insertUser;
exports.insertRefreshToken = insertRefreshToken;
exports.findRefreshToken = findRefreshToken;
exports.revokeRefreshToken = revokeRefreshToken;
exports.revokeRefreshTokenByHash = revokeRefreshTokenByHash;
exports.revokeAllRefreshTokensForUser = revokeAllRefreshTokensForUser;
const database_1 = require("../../config/database");
const USER_COLUMNS = `id, name, email, phone, avatar_file_name AS "avatarFileName", created_at AS "createdAt", password_hash AS "passwordHash"`;
async function findUserByEmail(email) {
    const { rows } = await (0, database_1.query)(`SELECT ${USER_COLUMNS} FROM users WHERE lower(email) = lower($1)`, [email]);
    return rows[0];
}
async function findUserById(id) {
    const { rows } = await (0, database_1.query)(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [id]);
    return rows[0];
}
async function updateUserProfile(id, changes) {
    const assignments = [];
    const values = [];
    if (changes.name !== undefined) {
        values.push(changes.name);
        assignments.push(`name = $${values.length}`);
    }
    if (changes.phone !== undefined) {
        values.push(changes.phone);
        assignments.push(`phone = $${values.length}`);
    }
    if (changes.email !== undefined) {
        values.push(changes.email);
        assignments.push(`email = $${values.length}`);
    }
    if (changes.avatarFileName !== undefined) {
        values.push(changes.avatarFileName);
        assignments.push(`avatar_file_name = $${values.length}`);
    }
    if (assignments.length === 0)
        return findUserById(id);
    values.push(id);
    const { rows } = await (0, database_1.query)(`UPDATE users SET ${assignments.join(", ")}, updated_at = now() WHERE id = $${values.length} RETURNING ${USER_COLUMNS}`, values);
    return rows[0];
}
async function setPasswordHash(userId, passwordHash) {
    await (0, database_1.query)(`UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`, [userId, passwordHash]);
}
async function insertPasswordReset(userId, tokenHash, expiresAt) {
    await (0, database_1.query)(`UPDATE password_reset_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL`, [userId]);
    await (0, database_1.query)(`INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`, [userId, tokenHash, expiresAt]);
}
async function findValidPasswordReset(tokenHash) {
    const { rows } = await (0, database_1.query)(`SELECT id, user_id AS "userId" FROM password_reset_tokens WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()`, [tokenHash]);
    return rows[0];
}
async function consumePasswordReset(id, userId, passwordHash) {
    return (0, database_1.withTransaction)(async (client) => {
        const { rowCount } = await client.query(`UPDATE password_reset_tokens SET used_at = now() WHERE id = $1 AND user_id = $2 AND used_at IS NULL AND expires_at > now()`, [id, userId]);
        if (!rowCount)
            return false;
        await client.query(`UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`, [userId, passwordHash]);
        await client.query(`UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [userId]);
        return true;
    });
}
async function findPasswordHash(userId) {
    const { rows } = await (0, database_1.query)(`SELECT password_hash AS "passwordHash" FROM users WHERE id = $1`, [userId]);
    return rows[0]?.passwordHash;
}
async function changePassword(userId, passwordHash) {
    await (0, database_1.withTransaction)(async (client) => {
        await client.query(`UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`, [userId, passwordHash]);
        await client.query(`UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [userId]);
    });
}
async function insertUser(input) {
    const { rows } = await (0, database_1.query)(`INSERT INTO users (name, email, phone, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING ${USER_COLUMNS}`, [input.name, input.email, input.phone ?? null, input.passwordHash]);
    return rows[0];
}
async function insertRefreshToken(userId, tokenHash, expiresAt) {
    await (0, database_1.query)(`INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`, [userId, tokenHash, expiresAt]);
}
async function findRefreshToken(tokenHash) {
    const { rows } = await (0, database_1.query)(`SELECT id, user_id AS "userId", expires_at AS "expiresAt", revoked_at AS "revokedAt"
       FROM refresh_tokens WHERE token_hash = $1`, [tokenHash]);
    return rows[0];
}
async function revokeRefreshToken(id) {
    const result = await (0, database_1.query)(`UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL`, [id]);
    return (result.rowCount ?? 0) > 0;
}
async function revokeRefreshTokenByHash(tokenHash) {
    await (0, database_1.query)(`UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`, [
        tokenHash,
    ]);
}
async function revokeAllRefreshTokensForUser(userId) {
    await (0, database_1.query)(`UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [
        userId,
    ]);
}
