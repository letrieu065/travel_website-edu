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
    loan_amount: number;
    term_months: number;
    monthly_interest_rate_percent: number;
    total_interest: number;
    total_payable: number;
    monthly_payment: number;
    id: string;
    user_id: string;
    booking_id: string;
    full_name: string;
    phone_number: string;
    identity_number: string;
    monthly_income: number;
    status: string;
    created_at: string;
}>;
declare const getMyLoans: (userId: string) => Promise<any[]>;
declare const getLoanById: (userId: string, id: string) => Promise<any>;
declare const _default: {
    calculateInstallment: typeof calculateInstallment;
    applyTravelLoan: typeof applyTravelLoan;
    getMyLoans: typeof getMyLoans;
    getLoanById: typeof getLoanById;
};
export default _default;
