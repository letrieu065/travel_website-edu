import prisma from '../../config/prisma';

/* ============================== TYPES ============================== */

export interface CalculateLoanInput {
    loan_amount: number;
    term_months: 3 | 6 | 9 | 12;
}

export interface ApplyLoanInput {
    user_id: string;
    booking_id: string;
    full_name: string;
    phone_number: string;
    identity_number: string; // CCCD / CMND
    monthly_income: number;
    term_months: 3 | 6 | 9 | 12;
}

// TODO: Tạo bảng travel_loans trong schema.prisma để lưu chi tiết hồ sơ vay (CCCD, thu nhập, trạng thái duyệt)
const loanApplicationsStore: any[] = [];

/* ============================== SERVICE METHODS ============================== */

const calculateInstallment = async (input: CalculateLoanInput) => {
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
};

const applyTravelLoan = async (input: ApplyLoanInput) => {
    const booking = await prisma.bookings.findFirst({
        where: { id: input.booking_id, user_id: input.user_id },
    });

    if (!booking) {
        throw new Error('Không tìm thấy đơn đặt chỗ của bạn để đăng ký vay');
    }

    const loanAmount = Number(booking.total_price);
    const calculation = await calculateInstallment({
        loan_amount: loanAmount,
        term_months: input.term_months,
    });

    // Ghi nhận yêu cầu thanh toán trả góp vào bảng payments
    const paymentRecord = await prisma.payments.create({
        data: {
            booking_id: booking.id,
            amount: loanAmount,
            payment_method: 'f88_loan',
            transaction_id: `LOAN_${Date.now()}`,
            payment_status: 'pending',
        },
    });

    const application = {
        id: paymentRecord.id,
        user_id: input.user_id,
        booking_id: input.booking_id,
        full_name: input.full_name,
        phone_number: input.phone_number,
        identity_number: input.identity_number,
        monthly_income: input.monthly_income,
        ...calculation,
        status: 'pending_review',
        created_at: new Date().toISOString(),
    };

    loanApplicationsStore.push(application);
    return application;
};

const getMyLoans = async (userId: string) => {
    const storeItems = loanApplicationsStore.filter((l) => l.user_id === userId);
    if (storeItems.length > 0) return storeItems;

    return prisma.payments.findMany({
        where: {
            payment_method: 'f88_loan',
            bookings: { user_id: userId },
        },
        include: { bookings: true },
    });
};

const getLoanById = async (userId: string, id: string) => {
    const found = loanApplicationsStore.find((l) => l.id === id && l.user_id === userId);
    if (found) return found;

    return prisma.payments.findFirst({
        where: {
            id,
            payment_method: 'f88_loan',
            bookings: { user_id: userId },
        },
        include: { bookings: true },
    });
};

export default {
    calculateInstallment,
    applyTravelLoan,
    getMyLoans,
    getLoanById,
};

