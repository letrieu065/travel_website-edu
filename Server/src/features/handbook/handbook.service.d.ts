export interface HandbookFilterParams {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
}
export declare const getHandbooks: (filters?: HandbookFilterParams) => Promise<{
    total: number;
    page: number;
    limit: number;
    handbooks: any[];
}>;
export declare const getHandbookById: (id: string) => Promise<any>;
declare const _default: {
    getHandbooks: typeof getHandbooks;
    getHandbookById: typeof getHandbookById;
};
export default _default;
