import { Request, Response } from 'express';
declare const calculateInstallment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const applyTravelLoan: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getMyLoans: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getLoanById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    calculateInstallment: typeof calculateInstallment;
    applyTravelLoan: typeof applyTravelLoan;
    getMyLoans: typeof getMyLoans;
    getLoanById: typeof getLoanById;
};
export default _default;
