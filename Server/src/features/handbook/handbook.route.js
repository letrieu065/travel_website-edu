"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const handbook_controller_1 = __importDefault(require("./handbook.controller"));
const router = express_1.default.Router();
router.get('/', handbook_controller_1.default.getHandbooks);
router.get('/:id', handbook_controller_1.default.getHandbookById);
exports.default = router;
//# sourceMappingURL=handbook.route.js.map