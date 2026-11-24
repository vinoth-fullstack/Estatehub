import { query, withTransaction } from "../../config/database";
import { CreateInquiryInput } from "./inquiry.schemas";

export async function findPropertyForInquiry(propertyId: number) {
  const { rows } = await query<{ id: number; ownerId: number; status: string; }>(
    `SELECT id, owner_id AS "ownerId", status FROM properties WHERE id = $1`,
    [propertyId],
  );
  return rows[0];
}

export async function insertInquiry(propertyId: number, senderId: number, input: CreateInquiryInput) {
  const { rows } = await query<{ id: number; createdAt: Date; }>(
    `INSERT INTO inquiries (property_id, sender_id, name, email, phone, message)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (property_id, sender_id) DO NOTHING
     RETURNING id, created_at AS "createdAt"`,
    [propertyId, senderId, input.name, input.email, input.phone, input.message],
  );
  return rows[0];
}

export async function listReceivedInquiries(ownerId: number, limit: number, offset: number) {
  const [{ rows }, count] = await Promise.all([
    query(
      `SELECT i.id, i.property_id AS "propertyId", p.title AS "propertyTitle", p.locality, p.city, p.price,
              i.name, i.email, i.phone, i.message, i.status, i.created_at AS "createdAt",
              u.avatar_file_name AS "requesterAvatarFileName", cover.file_name AS "coverFileName",
              owner.id AS "ownerId", owner.name AS "ownerName", owner.avatar_file_name AS "ownerAvatarFileName"
         FROM inquiries i JOIN properties p ON p.id = i.property_id
         JOIN users u ON u.id = i.sender_id JOIN users owner ON owner.id = p.owner_id
         LEFT JOIN LATERAL (SELECT file_name FROM property_images WHERE property_id = p.id ORDER BY position, id LIMIT 1) cover ON true
        WHERE p.owner_id = $1
        ORDER BY i.created_at DESC, i.id DESC
        LIMIT $2 OFFSET $3`,
      [ownerId, limit, offset],
    ),
    query<{ total: number; }>(
      `SELECT count(*) AS total FROM inquiries i JOIN properties p ON p.id = i.property_id WHERE p.owner_id = $1`,
      [ownerId],
    ),
  ]);
  return { rows, total: count.rows[0].total };
}

export async function listSentInquiries(senderId: number, limit: number, offset: number) {
  const [{ rows }, count] = await Promise.all([
    query(
      `SELECT i.id, i.property_id AS "propertyId", p.title AS "propertyTitle", p.locality, p.city, p.price,
              i.message, i.status, i.created_at AS "createdAt", cover.file_name AS "coverFileName",
              owner.id AS "ownerId", owner.name AS "ownerName", owner.avatar_file_name AS "ownerAvatarFileName"
         FROM inquiries i JOIN properties p ON p.id = i.property_id
         JOIN users owner ON owner.id = p.owner_id
         LEFT JOIN LATERAL (SELECT file_name FROM property_images WHERE property_id = p.id ORDER BY position, id LIMIT 1) cover ON true
        WHERE i.sender_id = $1
        ORDER BY i.created_at DESC, i.id DESC
        LIMIT $2 OFFSET $3`,
      [senderId, limit, offset],
    ),
    query<{ total: number; }>(`SELECT count(*) AS total FROM inquiries WHERE sender_id = $1`, [senderId]),
  ]);
  return { rows, total: count.rows[0].total };
}

export async function getInquiryParticipants(inquiryId: number) {
  const { rows } = await query<{ id: number; senderId: number; ownerId: number; }>(`SELECT i.id, i.sender_id AS "senderId", p.owner_id AS "ownerId" FROM inquiries i JOIN properties p ON p.id=i.property_id WHERE i.id=$1`, [inquiryId]);
  return rows[0];
}
export async function listMessages(inquiryId: number) {
  const { rows } = await query(`
    SELECT * FROM (
      SELECT -i.id AS id, i.id AS "inquiryId", i.sender_id AS "senderId", i.message,
             i.created_at AS "createdAt", u.name AS "senderName", u.avatar_file_name AS "senderAvatarFileName"
        FROM inquiries i JOIN users u ON u.id=i.sender_id WHERE i.id=$1
      UNION ALL
      SELECT m.id, m.inquiry_id AS "inquiryId", m.sender_id AS "senderId", m.message,
             m.created_at AS "createdAt", u.name AS "senderName", u.avatar_file_name AS "senderAvatarFileName"
        FROM inquiry_messages m JOIN users u ON u.id=m.sender_id WHERE m.inquiry_id=$1
    ) conversation ORDER BY "createdAt", id`, [inquiryId]);
  return rows;
}
export async function insertMessage(inquiryId: number, senderId: number, message: string) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(`INSERT INTO inquiry_messages (inquiry_id, sender_id, message) VALUES ($1,$2,$3) RETURNING id, inquiry_id AS "inquiryId", sender_id AS "senderId", message, created_at AS "createdAt"`, [inquiryId, senderId, message]);
    await client.query(`UPDATE inquiries SET status='replied' WHERE id=$1 AND status='pending'`, [inquiryId]);
    return rows[0];
  });
}
export async function updateInquiryStatus(inquiryId: number, status: string) {
  const { rows } = await query(`UPDATE inquiries SET status=$2 WHERE id=$1 RETURNING id,status`, [inquiryId, status]); return rows[0];
}
