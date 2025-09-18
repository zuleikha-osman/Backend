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
exports.getDashboardMetrics = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getDashboardMetrics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get all dashboard data in parallel
        const [salesSummary, inventorySummary, customerSummary, topProducts, recentSales, recentPurchases,] = yield Promise.all([
            prisma.salesSummary.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
            prisma.inventorySummary.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
            prisma.customerSummary.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
            prisma.products.findMany({
                orderBy: { stockQuantity: 'desc' },
                take: 10,
                include: {
                    sales: true,
                    purchases: true,
                },
            }),
            prisma.sales.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    product: true,
                    customer: true,
                },
            }),
            prisma.purchases.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    product: true,
                },
            }),
        ]);
        const dashboardMetrics = {
            salesSummary,
            inventorySummary,
            customerSummary,
            topProducts,
            recentSales,
            recentPurchases,
        };
        res.json(dashboardMetrics);
    }
    catch (error) {
        res.status(500).json({ message: "Error retrieving dashboard metrics" });
    }
});
exports.getDashboardMetrics = getDashboardMetrics;
