"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerSummary = exports.getInventorySummary = exports.getSalesSummary = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// GET ONLY - Sales Summary
const getSalesSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const salesSummary = yield prisma.salesSummary.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.json(salesSummary);
    }
    catch (error) {
        res.status(500).json({ message: "Error retrieving sales summary" });
    }
});
exports.getSalesSummary = getSalesSummary;
// GET ONLY - Inventory Summary
const getInventorySummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const inventorySummary = yield prisma.inventorySummary.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.json(inventorySummary);
    }
    catch (error) {
        res.status(500).json({ message: "Error retrieving inventory summary" });
    }
});
exports.getInventorySummary = getInventorySummary;
// GET ONLY - Customer Summary
const getCustomerSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const customerSummary = yield prisma.customerSummary.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.json(customerSummary);
    }
    catch (error) {
        res.status(500).json({ message: "Error retrieving customer summary" });
    }
});
exports.getCustomerSummary = getCustomerSummary;
