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
const handbook_service_1 = __importDefault(require("./handbook.service"));
const getHandbooks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = typeof req.query.category === 'string' ? req.query.category : undefined;
        const search = typeof req.query.search === 'string' ? req.query.search : undefined;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 100;
        const result = yield handbook_service_1.default.getHandbooks({
            category,
            search,
            page,
            limit,
        });
        return res.status(200).json(Object.assign({ status: 'success' }, result));
    }
    catch (error) {
        console.error('Lỗi khi lấy danh sách cẩm nang:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Đã có lỗi xảy ra khi lấy danh mục cẩm nang',
        });
    }
});
const getHandbookById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const handbook = yield handbook_service_1.default.getHandbookById(id);
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
    }
    catch (error) {
        console.error('Lỗi khi lấy chi tiết cẩm nang:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Đã có lỗi xảy ra khi lấy chi tiết cẩm nang',
        });
    }
});
exports.default = {
    getHandbooks,
    getHandbookById,
};
//# sourceMappingURL=handbook.controller.js.map