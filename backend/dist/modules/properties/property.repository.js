"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestProperties = suggestProperties;
exports.searchPropertyRows = searchPropertyRows;
exports.countProperties = countProperties;
exports.findPropertyById = findPropertyById;
exports.findOwnerId = findOwnerId;
exports.findImages = findImages;
exports.insertProperty = insertProperty;
exports.updateProperty = updateProperty;
exports.deleteProperty = deleteProperty;
exports.countImages = countImages;
exports.insertImages = insertImages;
exports.deleteImage = deleteImage;
exports.listImageFileNames = listImageFileNames;
exports.findSimilarProperties = findSimilarProperties;
exports.listForSitemap = listForSitemap;
const database_1 = require("../../config/database");
const sql_1 = require("../../utils/sql");
const CARD_COLUMNS = `
  p.id, p.title, p.property_type AS "propertyType", p.listing_type AS "listingType",
  p.price, p.bedrooms, p.bathrooms, p.area_sqft AS "areaSqft",
  p.locality, p.city, p.state, p.status, p.created_at AS "createdAt",
  (SELECT i.file_name FROM property_images i
    WHERE i.property_id = p.id ORDER BY i.position, i.id LIMIT 1) AS "coverFileName"`;
const DETAIL_COLUMNS = `
  ${CARD_COLUMNS},
  p.owner_id AS "ownerId", u.name AS "ownerName", p.description,
  p.address_line AS "addressLine", p.pincode, p.amenities, p.updated_at AS "updatedAt"`;
const SORTS = {
    newest: { column: "p.created_at", direction: "DESC", cast: "timestamptz" },
    price_asc: { column: "p.price", direction: "ASC", cast: "bigint" },
    price_desc: { column: "p.price", direction: "DESC", cast: "bigint" },
};
function buildWhere(filters, scope) {
    const conditions = [];
    const params = [];
    const addParam = (value) => {
        params.push(value);
        return `$${params.length}`;
    };
    if (scope.ownerId !== undefined) {
        conditions.push(`p.owner_id = ${addParam(scope.ownerId)}`);
    }
    else {
        conditions.push(`p.status = 'active'`);
    }
    if (filters.q) {
        const groups = filters.q.toLowerCase().split(/[,;|]/).map((group) => group.trim().split(/\s+/).filter(Boolean).slice(0, 8)).filter((group) => group.length > 0).slice(0, 5);
        const alternatives = groups.map((words) => `(${words.map((word) => `p.search_text LIKE ${addParam(`%${(0, sql_1.escapeLike)(word)}%`)}`).join(" AND ")})`);
        if (alternatives.length)
            conditions.push(`(${alternatives.join(" OR ")})`);
    }
    if (filters.listingType)
        conditions.push(`p.listing_type = ${addParam(filters.listingType)}`);
    if (filters.propertyType)
        conditions.push(`p.property_type = ${addParam(filters.propertyType)}`);
    if (filters.minPrice !== undefined)
        conditions.push(`p.price >= ${addParam(filters.minPrice)}`);
    if (filters.maxPrice !== undefined)
        conditions.push(`p.price <= ${addParam(filters.maxPrice)}`);
    if (filters.minArea !== undefined)
        conditions.push(`p.area_sqft >= ${addParam(filters.minArea)}`);
    if (filters.maxArea !== undefined)
        conditions.push(`p.area_sqft <= ${addParam(filters.maxArea)}`);
    if (filters.amenities) {
        const amenities = [...new Set(filters.amenities.split(",").map((item) => item.trim()).filter(Boolean))].slice(0, 12);
        if (amenities.length)
            conditions.push(`p.amenities @> ${addParam(amenities)}::text[]`);
    }
    if (filters.bedrooms !== undefined) {
        conditions.push(filters.bedrooms >= 5 ? `p.bedrooms >= 5` : `p.bedrooms = ${addParam(filters.bedrooms)}`);
    }
    return { conditions, params, addParam };
}
async function suggestProperties(q) {
    const term = `%${(0, sql_1.escapeLike)(q.trim().toLowerCase())}%`;
    const { rows } = await (0, database_1.query)(`WITH locations AS (
       SELECT locality AS label, city AS detail, 'locality' AS kind,
              locality || ', ' || city AS value,
              CASE WHEN lower(locality) LIKE $1 THEN 0 ELSE 1 END AS rank
         FROM properties
        WHERE status = 'active' AND (lower(locality) LIKE $1 OR lower(city) LIKE $1)
        GROUP BY locality, city
     ), cities AS (
       SELECT city AS label, state AS detail, 'city' AS kind, city AS value,
              CASE WHEN lower(city) LIKE $1 THEN 0 ELSE 1 END AS rank
         FROM properties WHERE status = 'active' AND lower(city) LIKE $1
        GROUP BY city, state
     ), titles AS (
       SELECT title AS label, locality || ', ' || city AS detail, 'property' AS kind,
              title AS value, 2 AS rank
         FROM properties WHERE status = 'active' AND lower(title) LIKE $1
        ORDER BY created_at DESC LIMIT 5
     )
     SELECT DISTINCT ON (value) value, label, detail, kind
       FROM (SELECT * FROM locations UNION ALL SELECT * FROM cities UNION ALL SELECT * FROM titles) suggestions
      ORDER BY value, rank, label LIMIT 8`, [term]);
    return rows;
}
async function searchPropertyRows(filters, scope, cursor) {
    const { conditions, params, addParam } = buildWhere(filters, scope);
    const sort = SORTS[filters.sort];
    if (cursor) {
        const comparison = sort.direction === "DESC" ? "<" : ">";
        conditions.push(`(${sort.column}, p.id) ${comparison} (${addParam(cursor.value)}::${sort.cast}, ${addParam(cursor.id)}::bigint)`);
    }
    const limitPlaceholder = addParam(filters.limit + 1);
    const offsetClause = cursor ? "" : `OFFSET ${addParam((filters.page - 1) * filters.limit)}`;
    const sql = `
    SELECT ${CARD_COLUMNS}, ${sort.column}::text AS "sortValue"
      FROM properties p
     WHERE ${conditions.join(" AND ")}
     ORDER BY ${sort.column} ${sort.direction}, p.id ${sort.direction}
     LIMIT ${limitPlaceholder} ${offsetClause}`;
    const { rows } = await (0, database_1.query)(sql, params);
    return { rows };
}
async function countProperties(filters, scope) {
    const { conditions, params } = buildWhere(filters, scope);
    const { rows } = await (0, database_1.query)(`SELECT count(*) AS total FROM properties p WHERE ${conditions.join(" AND ")}`, params);
    return rows[0].total;
}
async function findPropertyById(id) {
    const { rows } = await (0, database_1.query)(`SELECT ${DETAIL_COLUMNS}
       FROM properties p JOIN users u ON u.id = p.owner_id
      WHERE p.id = $1`, [id]);
    return rows[0];
}
async function findOwnerId(id) {
    const { rows } = await (0, database_1.query)(`SELECT owner_id AS "ownerId" FROM properties WHERE id = $1`, [id]);
    return rows[0]?.ownerId;
}
async function findImages(propertyId) {
    const { rows } = await (0, database_1.query)(`SELECT id, file_name AS "fileName", position
       FROM property_images WHERE property_id = $1 ORDER BY position, id`, [propertyId]);
    return rows;
}
async function insertProperty(ownerId, input) {
    const { rows } = await (0, database_1.query)(`INSERT INTO properties
       (owner_id, title, description, property_type, listing_type, price, bedrooms, bathrooms,
        area_sqft, address_line, locality, city, state, pincode, amenities)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING id`, [
        ownerId, input.title, input.description, input.propertyType, input.listingType, input.price,
        input.bedrooms, input.bathrooms, input.areaSqft, input.addressLine, input.locality,
        input.city, input.state, input.pincode, input.amenities,
    ]);
    return rows[0].id;
}
const UPDATABLE_COLUMNS = {
    title: "title",
    description: "description",
    propertyType: "property_type",
    listingType: "listing_type",
    price: "price",
    bedrooms: "bedrooms",
    bathrooms: "bathrooms",
    areaSqft: "area_sqft",
    addressLine: "address_line",
    locality: "locality",
    city: "city",
    state: "state",
    pincode: "pincode",
    amenities: "amenities",
    status: "status",
};
async function updateProperty(id, changes) {
    const assignments = [];
    const params = [];
    for (const [field, value] of Object.entries(changes)) {
        const column = UPDATABLE_COLUMNS[field];
        if (!column || value === undefined)
            continue;
        params.push(value);
        assignments.push(`${column} = $${params.length}`);
    }
    params.push(id);
    await (0, database_1.query)(`UPDATE properties SET ${assignments.join(", ")}, updated_at = now() WHERE id = $${params.length}`, params);
}
async function deleteProperty(id) {
    await (0, database_1.query)(`DELETE FROM properties WHERE id = $1`, [id]);
}
async function countImages(propertyId) {
    const { rows } = await (0, database_1.query)(`SELECT count(*) AS total FROM property_images WHERE property_id = $1`, [propertyId]);
    return rows[0].total;
}
async function insertImages(propertyId, fileNames, client) {
    const run = client ? client.query.bind(client) : database_1.query;
    await run(`INSERT INTO property_images (property_id, file_name, position)
     SELECT $1, f.file_name, base.next_position + f.ordinality - 1
       FROM unnest($2::text[]) WITH ORDINALITY AS f(file_name, ordinality),
            (SELECT COALESCE(max(position) + 1, 0) AS next_position
               FROM property_images WHERE property_id = $1) AS base`, [propertyId, fileNames]);
}
async function deleteImage(propertyId, imageId) {
    const { rows } = await (0, database_1.query)(`DELETE FROM property_images WHERE id = $1 AND property_id = $2 RETURNING file_name AS "fileName"`, [imageId, propertyId]);
    return rows[0]?.fileName;
}
async function listImageFileNames(propertyId) {
    const { rows } = await (0, database_1.query)(`SELECT file_name AS "fileName" FROM property_images WHERE property_id = $1`, [propertyId]);
    return rows.map((row) => row.fileName);
}
async function findSimilarProperties(target, options) {
    const { rows } = await (0, database_1.query)(`SELECT ${CARD_COLUMNS}
       FROM properties p
      WHERE p.status = 'active'
        AND p.city = $1
        AND p.listing_type = $2
        AND ($3::boolean = false OR p.property_type = $4)
        AND p.price BETWEEN $5 AND $6
        AND p.id <> ALL($7::bigint[])
      ORDER BY (
              CASE WHEN p.locality = $8 THEN 0 ELSE 2.0 END
            + 3.0 * abs(p.price - $9::bigint)::float8 / $9::bigint
            + 0.5 * abs(p.bedrooms - $10::int)
            + 1.0 * abs(p.area_sqft - $11::int)::float8 / $11::int
            ), p.id
      LIMIT $12`, [
        target.city, target.listingType, options.sameType, target.propertyType,
        options.minPrice, options.maxPrice, options.excludeIds,
        target.locality, target.price, target.bedrooms, target.areaSqft, options.limit,
    ]);
    return rows;
}
async function listForSitemap(limit) {
    const { rows } = await (0, database_1.query)(`SELECT id, title, updated_at AS "updatedAt"
       FROM properties WHERE status = 'active'
      ORDER BY created_at DESC, id DESC LIMIT $1`, [limit]);
    return rows;
}
