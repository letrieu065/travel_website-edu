"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const handbook_service_1 = __importDefault(require("./handbook.service"));

const getHandbooks = async (req, res) => {
    try {
        const category = typeof req.query.category === 'string' ? req.query.category : undefined;
        const search = typeof req.query.search === 'string' ? req.query.search : undefined;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 100;

        const result = await handbook_service_1.default.getHandbooks({
            category,
            search,
            page,
            limit,
        });

        return res.status(200).json({
            status: 'success',
            ...result,
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách cẩm nang:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Đã có lỗi xảy ra khi lấy danh mục cẩm nang',
        });
    }
};

const getHandbookById = async (req, res) => {
    try {
        const { id } = req.params;
        const handbook = await handbook_service_1.default.getHandbookById(id);

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
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết cẩm nang:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Đã có lỗi xảy ra khi lấy chi tiết cẩm nang',
        });
    }
};

exports.default = {
    getHandbooks,
    getHandbookById,
};
