import prisma from '../../config/prisma';

/* ============================== TYPES ============================== */

export type ReviewItemType = 'tour' | 'hotel' | 'flight';

export interface CreateReviewData {
    user_id: string;
    item_id: string;
    item_type: ReviewItemType;
    rating: number;
    comment?: string;
    // TODO: Thêm cột media_urls String[] vào bảng reviews trong schema.prisma để lưu ảnh/video đính kèm
    media_urls?: string[];
}

// (Đã thêm)
const getPagination = (pageInput: number, limitInput: number) => {
    const page = Math.max(1, Number(pageInput) || 1);
    const limit = Math.max(1, Number(limitInput) || 10);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

/* ============================== SERVICE METHODS ============================== */

const getReviewsByItem = async (
    itemType: ReviewItemType,
    itemId: string,
    params: { page: number; limit: number; rating?: number }
) => {
    const { page, limit, skip } = getPagination(params.page, params.limit);
    const where: any = {
        item_type: itemType,
        item_id: itemId,
    };
    if (params.rating !== undefined) {
        where.rating = Number(params.rating);
    }

    const [total, items, aggregate] = await Promise.all([
        prisma.reviews.count({ where }),
        prisma.reviews.findMany({
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
        prisma.reviews.aggregate({
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
            averageRating: Number((aggregate._avg.rating ?? 0).toFixed(1)),
            totalReviews: aggregate._count.rating,
        },
    };
};

const getTopReviews = async (limit: number = 6, itemType?: ReviewItemType) => {
    const where: any = { rating: { gte: 4 } };
    if (itemType) where.item_type = itemType;

    return prisma.reviews.findMany({
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
};

const createReview = async (data: CreateReviewData) => {
    const rating = Math.min(5, Math.max(1, Number(data.rating)));

    return prisma.reviews.upsert({
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
};

const deleteMyReview = async (userId: string, itemType: ReviewItemType, itemId: string) => {
    return prisma.reviews.delete({
        where: {
            user_id_item_id_item_type: {
                user_id: userId,
                item_id: itemId,
                item_type: itemType,
            },
        },
    });
};

export default {
    getReviewsByItem,
    getTopReviews,
    createReview,
    deleteMyReview,
};

