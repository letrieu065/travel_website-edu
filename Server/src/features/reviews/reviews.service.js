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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../config/prisma"));
// (Đã thêm)
const getPagination = (pageInput, limitInput) => {
    const page = Math.max(1, Number(pageInput) || 1);
    const limit = Math.max(1, Number(limitInput) || 10);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
/* ============================== SERVICE METHODS ============================== */
const getReviewsByItem = (itemType, itemId, params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { page, limit, skip } = getPagination(params.page, params.limit);
    const where = {
        item_type: itemType,
        item_id: itemId,
    };
    if (params.rating !== undefined) {
        where.rating = Number(params.rating);
    }
    const [total, items, aggregate] = yield Promise.all([
        prisma_1.default.reviews.count({ where }),
        prisma_1.default.reviews.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        avatar_url: true,
                    },
                },
            },
        }),
        prisma_1.default.reviews.aggregate({
            where: { item_type: itemType, item_id: itemId },
            _avg: { rating: true },
            _count: { rating: true },
        }),
    ]);
    return {
        reviews: items,
        total,
        page,
        limit,
        summary: {
            averageRating: Number(((_a = aggregate._avg.rating) !== null && _a !== void 0 ? _a : 0).toFixed(1)),
            totalReviews: aggregate._count.rating,
        },
    };
});
const getTopReviews = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (limit = 6, itemType) {
    const where = { rating: { gte: 4 } };
    if (itemType)
        where.item_type = itemType;
    return prisma_1.default.reviews.findMany({
        where,
        take: limit,
        orderBy: [{ rating: 'desc' }, { created_at: 'desc' }],
        include: {
            users: {
                select: {
                    id: true,
                    full_name: true,
                    avatar_url: true,
                },
            },
        },
    });
});
const createReview = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const rating = Math.min(5, Math.max(1, Number(data.rating)));
    return prisma_1.default.reviews.upsert({
        where: {
            user_id_item_id_item_type: {
                user_id: data.user_id,
                item_id: data.item_id,
                item_type: data.item_type,
            },
        },
        update: {
            rating,
            comment: data.comment,
        },
        create: {
            user_id: data.user_id,
            item_id: data.item_id,
            item_type: data.item_type,
            rating,
            comment: data.comment,
        },
        include: {
            users: {
                select: { id: true, full_name: true, avatar_url: true },
            },
        },
    });
});
const deleteMyReview = (userId, itemType, itemId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.reviews.delete({
        where: {
            user_id_item_id_item_type: {
                user_id: userId,
                item_id: itemId,
                item_type: itemType,
            },
        },
    });
});
exports.default = {
    getReviewsByItem,
    getTopReviews,
    createReview,
    deleteMyReview,
};
//# sourceMappingURL=reviews.service.js.map