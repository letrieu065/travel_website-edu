"use strict";
/* ============================== TYPES ============================== */
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
// TODO: Thêm bảng restaurants vào schema.prisma để quản lý trong PostgreSQL
const MOCK_RESTAURANTS = [
    {
        id: 'rest_01',
        name: 'Nhà hàng Hải Sản Biển Xanh',
        city: 'Đà Nẵng',
        address: 'Đường Võ Nguyên Giáp, Sơn Trà, Đà Nẵng',
        cuisine: 'Hải sản tươi sống',
        average_price: 450000,
        rating: 4.9,
        review_count: 128,
        images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'],
        description: 'Thưởng thức hải sản tươi ngon ngay bên bờ biển Mỹ Khê.',
    },
    {
        id: 'rest_02',
        name: 'Bếp Nhà Phố Cổ',
        city: 'Hà Nội',
        address: 'Phố Hàng Bông, Hoàn Kiếm, Hà Nội',
        cuisine: 'Ẩm thực truyền thống Bắc Bộ',
        average_price: 300000,
        rating: 4.8,
        review_count: 95,
        images: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5'],
        description: 'Không gian ấm cúng mang đậm nét văn hóa phố cổ Hà Nội.',
    },
    {
        id: 'rest_03',
        name: 'Sài Gòn Bistro Rooftop',
        city: 'TP. Hồ Chí Minh',
        address: 'Quận 1, TP. Hồ Chí Minh',
        cuisine: 'Á - Âu kết hợp',
        average_price: 650000,
        rating: 4.7,
        review_count: 84,
        images: ['https://images.unsplash.com/photo-1514933651103-005eec06c04b'],
        description: 'Ngắm nhìn toàn cảnh thành phố về đêm từ tầng thượng sang trọng.',
    },
];
// (Đã thêm)
const getPagination = (pageInput, limitInput) => {
    const page = Math.max(1, Number(pageInput) || 1);
    const limit = Math.max(1, Number(limitInput) || 10);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
/* ============================== SERVICE METHODS ============================== */
const getRestaurants = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip } = getPagination(params.page, params.limit);
    let list = [...MOCK_RESTAURANTS];
    if (params.search) {
        const keyword = params.search.toLowerCase();
        list = list.filter((r) => r.name.toLowerCase().includes(keyword) ||
            r.city.toLowerCase().includes(keyword) ||
            r.cuisine.toLowerCase().includes(keyword));
    }
    if (params.city) {
        list = list.filter((r) => r.city.toLowerCase().includes(params.city.toLowerCase()));
    }
    if (params.cuisine) {
        list = list.filter((r) => r.cuisine.toLowerCase().includes(params.cuisine.toLowerCase()));
    }
    if (params.min_rating !== undefined) {
        list = list.filter((r) => r.rating >= Number(params.min_rating));
    }
    if (params.sort === 'price_asc') {
        list.sort((a, b) => a.average_price - b.average_price);
    }
    else if (params.sort === 'price_desc') {
        list.sort((a, b) => b.average_price - a.average_price);
    }
    else {
        list.sort((a, b) => b.rating - a.rating);
    }
    const total = list.length;
    const restaurants = list.slice(skip, skip + limit);
    return { restaurants, total, page, limit };
});
const getTopRestaurants = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (limit = 6) {
    return [...MOCK_RESTAURANTS].sort((a, b) => b.rating - a.rating).slice(0, limit);
});
const getRestaurantById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return MOCK_RESTAURANTS.find((r) => r.id === id) || null;
});
exports.default = {
    getRestaurants,
    getTopRestaurants,
    getRestaurantById,
};
//# sourceMappingURL=restaurants.service.js.map