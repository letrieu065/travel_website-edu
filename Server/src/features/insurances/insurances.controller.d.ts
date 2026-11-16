import { Request, Response } from 'express';
declare const getPackages: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getPackageById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const calculateFee: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const attachInsuranceToBooking: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    getPackages: typeof getPackages;
    getPackageById: typeof getPackageById;
    calculateFee: typeof calculateFee;
    attachInsuranceToBooking: typeof attachInsuranceToBooking;
};
export default _default;
