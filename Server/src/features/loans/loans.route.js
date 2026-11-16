"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const loans_controller_1 = __importDefault(require("./loans.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = express_1.default.Router();
router.post('/calculate', loans_controller_1.default.calculateInstallment);
router.post('/apply', auth_middleware_1.authenticate, loans_controller_1.default.applyTravelLoan);
router.get('/my-loans', auth_middleware_1.authenticate, loans_controller_1.default.getMyLoans);
router.get('/:id', auth_middleware_1.authenticate, loans_controller_1.default.getLoanById);
exports.default = router;
// Gắn vào index.ts:
// import loansRoute from './features/loans/loans.route';
// app.use('/api/v1/loans', loansRoute);
//# sourceMappingURL=loans.route.js.map