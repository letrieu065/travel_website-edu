"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHandbookById = exports.getHandbooks = void 0;
const prisma_1 = require("../../config/prisma");
const getHandbooks = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}) {
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
    const countResult = yield prisma_1.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);
    const dataValues = [...values, limit, offset];
    const dataResult = yield prisma_1.pool.query(dataQuery, dataValues);
    return {
        total,
        page,
        limit,
        handbooks: dataResult.rows,
    };
});
exports.getHandbooks = getHandbooks;
const getHandbookById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `
        SELECT id, title, category, summary, image_url, read_time, content, tips, created_at
        FROM travel_handbooks
        WHERE id = $1
    `;
    const result = yield prisma_1.pool.query(query, [id]);
    return result.rows[0] || null;
});
exports.getHandbookById = getHandbookById;
exports.default = {
    getHandbooks: exports.getHandbooks,
    getHandbookById: exports.getHandbookById,
};
//# sourceMappingURL=handbook.service.js.map