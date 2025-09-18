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
exports.deletePurchase = exports.updatePurchase = exports.createPurchase = exports.getPurchaseById = exports.getPurchases = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getPurchases = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const purchases = yield prisma.purchases.findMany({
            include: {
                product: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.json(purchases);
    }
    catch (error) {
        res.status(500).json({ message: "Error retrieving purchases" });
    }
});
exports.getPurchases = getPurchases;
const getPurchaseById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const purchase = yield prisma.purchases.findUnique({
            where: { purchaseId: id },
            include: {
                product: true,
            },
        });
        if (!purchase) {
            res.status(404).json({ message: "Purchase not found" });
            return;
        }
        res.json(purchase);
    }
    catch (error) {
        res.status(500).json({ message: "Error retrieving purchase" });
    }
});
exports.getPurchaseById = getPurchaseById;
const createPurchase = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productId, quantity, unitCost, totalCost } = req.body;
        // Start a transaction to update product stock and create purchase
        const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Create the purchase
            const purchase = yield tx.purchases.create({
                data: {
                    productId,
                    quantity,
                    unitCost,
                    totalCost,
                },
                include: {
                    product: true,
                },
            });
            // Update product stock quantity
            yield tx.products.update({
                where: { productId },
                data: {
                    stockQuantity: {
                        increment: quantity,
                    },
                },
            });
            return purchase;
        }));
        res.status(201).json(result);
    }
    catch (error) {
        res.status(500).json({ message: "Error creating purchase" });
    }
});
exports.createPurchase = createPurchase;
const updatePurchase = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { productId, quantity, unitCost, totalCost } = req.body;
        // Get the original purchase to calculate stock difference
        const originalPurchase = yield prisma.purchases.findUnique({
            where: { purchaseId: id },
        });
        if (!originalPurchase) {
            res.status(404).json({ message: "Purchase not found" });
            return;
        }
        const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const updateData = {};
            if (productId !== undefined)
                updateData.productId = productId;
            if (quantity !== undefined)
                updateData.quantity = quantity;
            if (unitCost !== undefined)
                updateData.unitCost = unitCost;
            if (totalCost !== undefined)
                updateData.totalCost = totalCost;
            const purchase = yield tx.purchases.update({
                where: { purchaseId: id },
                data: updateData,
                include: {
                    product: true,
                },
            });
            // If quantity changed, update product stock
            if (quantity !== undefined && quantity !== originalPurchase.quantity) {
                const stockDifference = quantity - originalPurchase.quantity;
                yield tx.products.update({
                    where: { productId: originalPurchase.productId },
                    data: {
                        stockQuantity: {
                            increment: stockDifference,
                        },
                    },
                });
            }
            return purchase;
        }));
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: "Error updating purchase" });
    }
});
exports.updatePurchase = updatePurchase;
const deletePurchase = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Get the purchase to reverse stock changes
        const purchase = yield prisma.purchases.findUnique({
            where: { purchaseId: id },
        });
        if (!purchase) {
            res.status(404).json({ message: "Purchase not found" });
            return;
        }
        yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Delete the purchase
            yield tx.purchases.delete({
                where: { purchaseId: id },
            });
            // Reverse the stock quantity
            yield tx.products.update({
                where: { productId: purchase.productId },
                data: {
                    stockQuantity: {
                        decrement: purchase.quantity,
                    },
                },
            });
        }));
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting purchase" });
    }
});
exports.deletePurchase = deletePurchase;
