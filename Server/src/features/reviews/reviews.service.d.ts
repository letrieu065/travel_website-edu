export type ReviewItemType = 'tour' | 'hotel' | 'flight';
export interface CreateReviewData {
    user_id: string;
    item_id: string;
    item_type: ReviewItemType;
    rating: number;
    comment?: string;
    media_urls?: string[];
}
declare const getReviewsByItem: (itemType: ReviewItemType, itemId: string, params: {
    page: number;
    limit: number;
    rating?: number;
}) => Promise<{
    reviews: ({
        users: {
            avatar_url: string | null;
            full_name: string;
            id: string;
        };
    } & {
        user_id: string;
        rating: number;
        comment: string | null;
        created_at: Date | null;
        item_id: string;
        item_type: string;
    })[];
    total: number;
    page: number;
    limit: number;
    summary: {
        averageRating: number;
        totalReviews: number;
    };
}>;
declare const getTopReviews: (limit?: number, itemType?: ReviewItemType) => Promise<({
    users: {
        avatar_url: string | null;
        full_name: string;
        id: string;
    };
} & {
    user_id: string;
    rating: number;
    comment: string | null;
    created_at: Date | null;
    item_id: string;
    item_type: string;
})[]>;
declare const createReview: (data: CreateReviewData) => Promise<{
    users: {
        avatar_url: string | null;
        full_name: string;
        id: string;
    };
} & {
    user_id: string;
    rating: number;
    comment: string | null;
    created_at: Date | null;
    item_id: string;
    item_type: string;
}>;
declare const deleteMyReview: (userId: string, itemType: ReviewItemType, itemId: string) => Promise<{
    user_id: string;
    rating: number;
    comment: string | null;
    created_at: Date | null;
    item_id: string;
    item_type: string;
}>;
declare const _default: {
    getReviewsByItem: typeof getReviewsByItem;
    getTopReviews: typeof getTopReviews;
    createReview: typeof createReview;
    deleteMyReview: typeof deleteMyReview;
};
export default _default;
