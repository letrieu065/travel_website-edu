"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ai_controller_1 = __importDefault(require("./ai.controller"));
const router = express_1.default.Router();
router.post('/generate-itinerary', ai_controller_1.default.generateItinerary);
router.post('/compare-tours', ai_controller_1.default.compareTours);
exports.default = router;
// Gắn vào index.ts:
// import aiRoute from './features/ai/ai.route';
// app.use('/api/v1/ai', aiRoute);
//# sourceMappingURL=ai.route.js.map