import { query, withTransaction } from "../../config/database";

export interface UserRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatarFileName: string | null;
  createdAt: Date;
  passwordHash: string;
}

export interface RefreshTokenRow {
  id: number;
  userId: number;
  expiresAt: Date;
  revokedAt: Date | null;
}

const USER_COLUMNS = `id, name, email, phone, avatar_file_name AS "avatarFileName", created_at AS "createdAt", password_hash AS "passwordHash"`;

export async function findUserByEmail(email: string): Promise<UserRow | undefined> {
  const { rows } = await query<UserRow>(
    `SELECT ${USER_COLUMNS} FROM users WHERE lower(email) = lower($1)`,
    [email],
  );
  return rows[0];
}

export async function findUserById(id: number): Promise<UserRow | undefined> {
  const { rows } = await query<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [id]);
  return rows[0];
}

export async function updateUserProfile(id: number, changes: { name?: string; email?: string; phone?: string | null; avatarFileName?: string | null; }): Promise<UserRow | undefined> {
  const assignments: string[] = [];
  const values: unknown[] = [];
  if (changes.name !== undefined) { values.push(changes.name); assignments.push(`name = $${values.length}`); }
  if (changes.phone !== undefined) { values.push(changes.phone); assignments.push(`phone = $${values.length}`); }
  if (changes.email !== undefined) { values.push(changes.email); assignments.push(`email = $${values.length}`); }
  if (changes.avatarFileName !== undefined) { values.push(changes.avatarFileName); assignments.push(`avatar_file_name = $${values.length}`); }
  if (assignments.length === 0) return findUserById(id);
  values.push(id);
  const { rows } = await query<UserRow>(
    `UPDATE users SET ${assignments.join(", ")}, updated_at = now() WHERE id = $${values.length} RETURNING ${USER_COLUMNS}`,
    values,
  );
  return rows[0];
}

export async function setPasswordHash(userId: number, passwordHash: string) {
  await query(`UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`, [userId, passwordHash]);
}
export async function insertPasswordReset(userId: number, tokenHash: string, expiresAt: Date) {
  await query(`UPDATE password_reset_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL`, [userId]);
  await query(`INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`, [userId, tokenHash, expiresAt]);
}
export async function findValidPasswordReset(tokenHash: string) {
  const { rows } = await query<{ id: number; userId: number; }>(`SELECT id, user_id AS "userId" FROM password_reset_tokens WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()`, [tokenHash]);
  return rows[0];
}
export async function consumePasswordReset(id: number, userId: number, passwordHash: string) {
  return withTransaction(async (client) => {
    const { rowCount } = await client.query(`UPDATE password_reset_tokens SET used_at = now() WHERE id = $1 AND user_id = $2 AND used_at IS NULL AND expires_at > now()`, [id, userId]);
    if (!rowCount) return false;
    await client.query(`UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`, [userId, passwordHash]);
    await client.query(`UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [userId]);
    return true;
  });
}
export async function findPasswordHash(userId: number) {
  const { rows } = await query<{ passwordHash: string; }>(`SELECT password_hash AS "passwordHash" FROM users WHERE id = $1`, [userId]);
  return rows[0]?.passwordHash;
}
export async function changePassword(userId: number, passwordHash: string) {
  await withTransaction(async (client) => {
    await client.query(`UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`, [userId, passwordHash]);
    await client.query(`UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [userId]);
  });
}

export async function insertUser(input: {
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
}): Promise<UserRow> {
  const { rows } = await query<UserRow>(
    `INSERT INTO users (name, email, phone, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING ${USER_COLUMNS}`,
    [input.name, input.email, input.phone ?? null, input.passwordHash],
  );
  return rows[0];
}

export async function insertRefreshToken(userId: number, tokenHash: string, expiresAt: Date) {
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt],
  );
}

export async function findRefreshToken(tokenHash: string): Promise<RefreshTokenRow | undefined> {
  const { rows } = await query<RefreshTokenRow>(
    `SELECT id, user_id AS "userId", expires_at AS "expiresAt", revoked_at AS "revokedAt"
       FROM refresh_tokens WHERE token_hash = $1`,
    [tokenHash],
  );
  return rows[0];
}

export async function revokeRefreshToken(id: number): Promise<boolean> {
  const result = await query(
    `UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function revokeRefreshTokenByHash(tokenHash: string) {
  await query(`UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`, [
    tokenHash,
  ]);
}

export async function revokeAllRefreshTokensForUser(userId: number) {
  await query(`UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [
    userId,
  ]);
}
