import { Request, Response } from 'express';
import handbookService from './handbook.service';

const getHandbooks = async (req: Request, res: Response) => {
    try {
        const category = typeof req.query.category === 'string' ? req.query.category : undefined;
        const search = typeof req.query.search === 'string' ? req.query.search : undefined;
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 100;

        const result = await handbookService.getHandbooks({
            category,
            search,
            page,
            limit,
        });

        return res.status(200).json({
            status: 'success',
            ...result,
        });
    } catch (error: any) {
        console.error('Lỗi khi lấy danh sách cẩm nang:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Đã có lỗi xảy ra khi lấy danh mục cẩm nang',
        });
    }
};

const getHandbookById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const handbook = await handbookService.getHandbookById(id as string);

        if (!handbook) {
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy bài viết cẩm nang',
            });
        }

        return res.status(200).json({
            status: 'success',
            data: handbook,
        });
    } catch (error: any) {
        console.error('Lỗi khi lấy chi tiết cẩm nang:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Đã có lỗi xảy ra khi lấy chi tiết cẩm nang',
        });
    }
};

export default {
    getHandbooks,
    getHandbookById,
};
