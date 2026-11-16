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
// TODO: Tạo bảng travel_loans trong schema.prisma để lưu chi tiết hồ sơ vay (CCCD, thu nhập, trạng thái duyệt)
const loanApplicationsStore = [];
/* ============================== SERVICE METHODS ============================== */
const calculateInstallment = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const amount = Math.max(0, Number(input.loan_amount));
    const months = [3, 6, 9, 12].includes(Number(input.term_months)) ? Number(input.term_months) : 6;
    const monthlyInterestRate = 0.015; // 1.5% / tháng (demo)
    const totalInterest = Math.round(amount * monthlyInterestRate * months);
    const totalPayable = amount + totalInterest;
    const monthlyPayment = Math.round(totalPayable / months);
    return {
        loan_amount: amount,
        term_months: months,
        monthly_interest_rate_percent: 1.5,
        total_interest: totalInterest,
        total_payable: totalPayable,
        monthly_payment: monthlyPayment,
    };
});
const applyTravelLoan = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield prisma_1.default.bookings.findFirst({
        where: { id: input.booking_id, user_id: input.user_id },
    });
    if (!booking) {
        throw new Error('Không tìm thấy đơn đặt chỗ của bạn để đăng ký vay');
    }
    const loanAmount = Number(booking.total_price);
    const calculation = yield calculateInstallment({
        loan_amount: loanAmount,
        term_months: input.term_months,
    });
    // Ghi nhận yêu cầu thanh toán trả góp vào bảng payments
    const paymentRecord = yield prisma_1.default.payments.create({
        data: {
            booking_id: booking.id,
            amount: loanAmount,
            payment_method: 'f88_loan',
            transaction_id: `LOAN_${Date.now()}`,
            payment_status: 'pending',
        },
    });
    const application = Object.assign(Object.assign({ id: paymentRecord.id, user_id: input.user_id, booking_id: input.booking_id, full_name: input.full_name, phone_number: input.phone_number, identity_number: input.identity_number, monthly_income: input.monthly_income }, calculation), { status: 'pending_review', created_at: new Date().toISOString() });
    loanApplicationsStore.push(application);
    return application;
});
const getMyLoans = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const storeItems = loanApplicationsStore.filter((l) => l.user_id === userId);
    if (storeItems.length > 0)
        return storeItems;
    return prisma_1.default.payments.findMany({
        where: {
            payment_method: 'f88_loan',
            bookings: { user_id: userId },
        },
        include: { bookings: true },
    });
});
const getLoanById = (userId, id) => __awaiter(void 0, void 0, void 0, function* () {
    const found = loanApplicationsStore.find((l) => l.id === id && l.user_id === userId);
    if (found)
        return found;
    return prisma_1.default.payments.findFirst({
        where: {
            id,
            payment_method: 'f88_loan',
            bookings: { user_id: userId },
        },
        include: { bookings: true },
    });
});
exports.default = {
    calculateInstallment,
    applyTravelLoan,
    getMyLoans,
    getLoanById,
};
//# sourceMappingURL=loans.service.js.map