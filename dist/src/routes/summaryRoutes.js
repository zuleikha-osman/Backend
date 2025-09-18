"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const summaryController_1 = require("../controllers/summaryController");
const router = (0, express_1.Router)();
// GET ONLY routes for summary data
router.get("/sales", summaryController_1.getSalesSummary);
router.get("/inventory", summaryController_1.getInventorySummary);
router.get("/customers", summaryController_1.getCustomerSummary);
exports.default = router;
