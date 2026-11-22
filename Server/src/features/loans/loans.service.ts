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

const calculateInstallment = async (input: CalculateLoanInput) => {
    const amount = Math.max(0, Number(input.loan_amount));
    const months = [3, 6, 9, 12].includes(Number(input.term_months)) ? Number(input.term_months) : 6;
    const monthlyInterestRate = 0.015; // 1.5% / tháng

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

    // Lưu chi tiết hồ sơ vay lâu dài vào PostgreSQL (model travel_loans)
    const application = await prisma.travel_loans.create({
        data: {
            id: paymentRecord.id,
            user_id: input.user_id,
            booking_id: input.booking_id,
            full_name: input.full_name,
            phone_number: input.phone_number,
            identity_number: input.identity_number,
            monthly_income: input.monthly_income,
            loan_amount: calculation.loan_amount,
            term_months: calculation.term_months,
            total_interest: calculation.total_interest,
            total_payable: calculation.total_payable,
            monthly_payment: calculation.monthly_payment,
            status: 'pending_review',
        },
    });

    return {
        ...application,
        loan_amount: Number(application.loan_amount),
        total_interest: Number(application.total_interest),
        total_payable: Number(application.total_payable),
        monthly_payment: Number(application.monthly_payment),
        monthly_income: Number(application.monthly_income),
    };
};

const getMyLoans = async (userId: string) => {
    const loans = await prisma.travel_loans.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
    });

    if (loans.length > 0) {
        return loans.map((l) => ({
            ...l,
            loan_amount: Number(l.loan_amount),
            total_interest: Number(l.total_interest),
            total_payable: Number(l.total_payable),
            monthly_payment: Number(l.monthly_payment),
            monthly_income: Number(l.monthly_income),
        }));
    }

    return prisma.payments.findMany({
        where: {
            payment_method: 'f88_loan',
            bookings: { user_id: userId },
        },
        include: { bookings: true },
    });
};

const getLoanById = async (userId: string, id: string) => {
    const loan = await prisma.travel_loans.findFirst({
        where: { id, user_id: userId },
    });

    if (loan) {
        return {
            ...loan,
            loan_amount: Number(loan.loan_amount),
            total_interest: Number(loan.total_interest),
            total_payable: Number(loan.total_payable),
            monthly_payment: Number(loan.monthly_payment),
            monthly_income: Number(loan.monthly_income),
        };
    }

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

