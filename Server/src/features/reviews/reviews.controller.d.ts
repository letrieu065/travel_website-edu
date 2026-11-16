import { Request, Response } from 'express';
declare const getTopReviews: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getReviewsByItem: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const createReview: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const deleteMyReview: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    getTopReviews: typeof getTopReviews;
    getReviewsByItem: typeof getReviewsByItem;
    createReview: typeof createReview;
    deleteMyReview: typeof deleteMyReview;
};
export default _default;
