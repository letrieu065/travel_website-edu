export interface CalculateLoanInput {
    loan_amount: number;
    term_months: 3 | 6 | 9 | 12;
}
export interface ApplyLoanInput {
    user_id: string;
    booking_id: string;
    full_name: string;
    phone_number: string;
    identity_number: string;
    monthly_income: number;
    term_months: 3 | 6 | 9 | 12;
}
declare const calculateInstallment: (input: CalculateLoanInput) => Promise<{
    loan_amount: number;
    term_months: number;
    monthly_interest_rate_percent: number;
    total_interest: number;
    total_payable: number;
    monthly_payment: number;
}>;
declare const applyTravelLoan: (input: ApplyLoanInput) => Promise<{
    id: string;
    user_id: string;
    booking_id: string;
    full_name: string;
    phone_number: string;
    identity_number: string;
    term_months: number;
    status: string;
    created_at: Date | null;
    loan_amount: number;
    total_interest: number;
    total_payable: number;
    monthly_payment: number;
    monthly_income: number;
}>;
declare const getMyLoans: (userId: string) => Promise<{
    id: string;
    user_id: string;
    booking_id: string;
    full_name: string;
    phone_number: string;
    identity_number: string;
    term_months: number;
    status: string;
    created_at: Date | null;
    loan_amount: number;
    total_interest: number;
    total_payable: number;
    monthly_payment: number;
    monthly_income: number;
}[] | ({
    bookings: {
        id: string;
        user_id: string | null;
        total_price: import("@prisma/client-runtime-utils").Decimal;
        created_at: Date | null;
    } | null;
} & {
    id: string;
    booking_id: string | null;
    amount: import("@prisma/client-runtime-utils").Decimal;
    payment_method: string;
    transaction_id: string | null;
    payment_status: string | null;
    payment_date: Date | null;
})[]>;
declare const getLoanById: (userId: string, id: string) => Promise<{
    id: string;
    user_id: string;
    booking_id: string;
    full_name: string;
    phone_number: string;
    identity_number: string;
    term_months: number;
    status: string;
    created_at: Date | null;
    loan_amount: number;
    total_interest: number;
    total_payable: number;
    monthly_payment: number;
    monthly_income: number;
} | ({
    bookings: {
        id: string;
        user_id: string | null;
        total_price: import("@prisma/client-runtime-utils").Decimal;
        created_at: Date | null;
    } | null;
} & {
    id: string;
    booking_id: string | null;
    amount: import("@prisma/client-runtime-utils").Decimal;
    payment_method: string;
    transaction_id: string | null;
    payment_status: string | null;
    payment_date: Date | null;
}) | null>;
declare const _default: {
    calculateInstallment: typeof calculateInstallment;
    applyTravelLoan: typeof applyTravelLoan;
    getMyLoans: typeof getMyLoans;
    getLoanById: typeof getLoanById;
};
export default _default;
