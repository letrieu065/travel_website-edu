export interface InsurancePackage {
    id: string;
    name: string;
    type: 'travel' | 'cancellation';
    price_per_person: number;
    max_coverage: number;
    benefits: string[];
    description: string;
}
export interface CalculateInsuranceInput {
    package_id: string;
    guests: number;
    days?: number;
    booking_amount?: number;
}
declare const getPackages: (type?: 'travel' | 'cancellation') => Promise<InsurancePackage[]>;
declare const getPackageById: (id: string) => Promise<InsurancePackage | null>;
declare const calculateFee: (input: CalculateInsuranceInput) => Promise<{
    package: InsurancePackage;
    guests: number;
    days: number;
    total_fee: number;
}>;
declare const attachInsuranceToBooking: (bookingId: string, packageId: string, guests?: number, userId?: string, role?: string) => Promise<{
    booking_id: string;
    insurance: InsurancePackage;
    insurance_fee: number;
    new_total_price: number;
}>;
declare const _default: {
    getPackages: typeof getPackages;
    getPackageById: typeof getPackageById;
    calculateFee: typeof calculateFee;
    attachInsuranceToBooking: typeof attachInsuranceToBooking;
};
export default _default;
