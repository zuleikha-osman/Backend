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
exports.deleteSale = exports.updateSale = exports.createSale = exports.getSaleById = exports.getSales = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getSales = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sales = yield prisma.sales.findMany({
            include: {
                product: true,
                customer: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.json(sales);
    }
    catch (error) {
        res.status(500).json({ message: "Error retrieving sales" });
    }
});
exports.getSales = getSales;
const getSaleById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const sale = yield prisma.sales.findUnique({
            where: { saleId: id },
            include: {
                product: true,
                customer: true,
            },
        });
        if (!sale) {
            res.status(404).json({ message: "Sale not found" });
            return;
        }
        res.json(sale);
    }
    catch (error) {
        res.status(500).json({ message: "Error retrieving sale" });
    }
});
exports.getSaleById = getSaleById;
const createSale = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productId, customerId, quantity, unitPrice, totalAmount, profit } = req.body;
        // Start a transaction to update product stock and create sale
        const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Check if product has enough stock
            const product = yield tx.products.findUnique({
                where: { productId },
            });
            if (!product) {
                throw new Error("Product not found");
            }
            if (product.stockQuantity < quantity) {
                throw new Error("Insufficient stock");
            }
            // Create the sale
            const sale = yield tx.sales.create({
                data: {
                    productId,
                    customerId,
                    quantity,
                    unitPrice,
                    totalAmount,
                    profit,
                },
                include: {
                    product: true,
                    customer: true,
                },
            });
            // Update product stock quantity
            yield tx.products.update({
                where: { productId },
                data: {
                    stockQuantity: {
                        decrement: quantity,
                    },
                },
            });
            return sale;
        }));
        res.status(201).json(result);
    }
    catch (error) {
        if (error.message === "Product not found") {
            res.status(404).json({ message: "Product not found" });
        }
        else if (error.message === "Insufficient stock") {
            res.status(400).json({ message: "Insufficient stock" });
        }
        else {
            res.status(500).json({ message: "Error creating sale" });
        }
    }
});
exports.createSale = createSale;
const updateSale = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { productId, customerId, quantity, unitPrice, totalAmount, profit } = req.body;
        // Get the original sale to calculate stock difference
        const originalSale = yield prisma.sales.findUnique({
            where: { saleId: id },
        });
        if (!originalSale) {
            res.status(404).json({ message: "Sale not found" });
            return;
        }
        const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const updateData = {};
            if (productId !== undefined)
                updateData.productId = productId;
            if (customerId !== undefined)
                updateData.customerId = customerId;
            if (quantity !== undefined)
                updateData.quantity = quantity;
            if (unitPrice !== undefined)
                updateData.unitPrice = unitPrice;
            if (totalAmount !== undefined)
                updateData.totalAmount = totalAmount;
            if (profit !== undefined)
                updateData.profit = profit;
            const sale = yield tx.sales.update({
                where: { saleId: id },
                data: updateData,
                include: {
                    product: true,
                    customer: true,
                },
            });
            // If quantity changed, update product stock
            if (quantity !== undefined && quantity !== originalSale.quantity) {
                const stockDifference = originalSale.quantity - quantity; // Reverse logic for sales
                yield tx.products.update({
                    where: { productId: originalSale.productId },
                    data: {
                        stockQuantity: {
                            increment: stockDifference,
                        },
                    },
                });
            }
            return sale;
        }));
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: "Error updating sale" });
    }
});
exports.updateSale = updateSale;
const deleteSale = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Get the sale to reverse stock changes
        const sale = yield prisma.sales.findUnique({
            where: { saleId: id },
        });
        if (!sale) {
            res.status(404).json({ message: "Sale not found" });
            return;
        }
        yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Delete the sale
            yield tx.sales.delete({
                where: { saleId: id },
            });
            // Reverse the stock quantity (add back the sold quantity)
            yield tx.products.update({
                where: { productId: sale.productId },
                data: {
                    stockQuantity: {
                        increment: sale.quantity,
                    },
                },
            });
        }));
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting sale" });
    }
});
exports.deleteSale = deleteSale;
