"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const combos_controller_1 = __importDefault(require("./combos.controller"));
const router = express_1.default.Router();
router.get('/', combos_controller_1.default.getPopularCombos);
router.post('/suggest', combos_controller_1.default.suggestCombo);
router.get('/:tourId', combos_controller_1.default.getComboByTourId);
exports.default = router;
// Gắn vào index.ts:
// import combosRoute from './features/combos/combos.route';
// app.use('/api/v1/combos', combosRoute);
//# sourceMappingURL=combos.route.js.map