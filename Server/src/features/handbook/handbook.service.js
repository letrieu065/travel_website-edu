"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHandbookById = exports.getHandbooks = void 0;
const prisma_1 = require("../../config/prisma");

const getHandbooks = async (filters = {}) => {
    const { category, search, page = 1, limit = 100 } = filters;
    const offset = (page - 1) * limit;

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (category && category !== 'all') {
        conditions.push(`category = $${paramIndex++}`);
        values.push(category);
    }

    if (search && search.trim()) {
        conditions.push(`(title ILIKE $${paramIndex} OR summary ILIKE $${paramIndex})`);
        values.push(`%${search.trim()}%`);
        paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) FROM travel_handbooks ${whereClause}`;
    const dataQuery = `
        SELECT id, title, category, summary, image_url, read_time, content, tips, created_at
        FROM travel_handbooks
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const countResult = await prisma_1.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataValues = [...values, limit, offset];
    const dataResult = await prisma_1.pool.query(dataQuery, dataValues);

    return {
        total,
        page,
        limit,
        handbooks: dataResult.rows,
    };
};
exports.getHandbooks = getHandbooks;

const getHandbookById = async (id) => {
    const query = `
        SELECT id, title, category, summary, image_url, read_time, content, tips, created_at
        FROM travel_handbooks
        WHERE id = $1
    `;
    const result = await prisma_1.pool.query(query, [id]);
    return result.rows[0] || null;
};
exports.getHandbookById = getHandbookById;

exports.default = {
    getHandbooks,
    getHandbookById,
};
