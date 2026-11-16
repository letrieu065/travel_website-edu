"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const insurances_controller_1 = __importDefault(require("./insurances.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = express_1.default.Router();
router.get('/', insurances_controller_1.default.getPackages);
router.get('/:id', insurances_controller_1.default.getPackageById);
router.post('/calculate', insurances_controller_1.default.calculateFee);
router.post('/attach', auth_middleware_1.authenticate, insurances_controller_1.default.attachInsuranceToBooking);
exports.default = router;
// Gắn vào index.ts:
// import insurancesRoute from './features/insurances/insurances.route';
// app.use('/api/v1/insurances', insurancesRoute);
//# sourceMappingURL=insurances.route.js.map