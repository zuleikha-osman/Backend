import type { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const getSales = async (req: Request, res: Response): Promise<void> => {
  try {
    const sales = await prisma.sales.findMany({
      include: {
        product: true,
        customer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    res.json(sales)
  } catch (error) {
    res.status(500).json({ message: "Error retrieving sales" })
  }
}

export const getSaleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const sale = await prisma.sales.findUnique({
      where: { saleId: id },
      include: {
        product: true,
        customer: true,
      },
    })

    if (!sale) {
      res.status(404).json({ message: "Sale not found" })
      return
    }

    res.json(sale)
  } catch (error) {
    res.status(500).json({ message: "Error retrieving sale" })
  }
}

export const createSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, customerId, quantity, unitPrice, totalAmount, profit } = req.body
    
    // Start a transaction to update product stock and create sale
    const result = await prisma.$transaction(async (tx) => {
      // Check if product has enough stock
      const product = await tx.products.findUnique({
        where: { productId },
      })

      if (!product) {
        throw new Error("Product not found")
      }

      if (product.stockQuantity < quantity) {
        throw new Error("Insufficient stock")
      }

      // Create the sale
      const sale = await tx.sales.create({
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
      })

      // Update product stock quantity
      await tx.products.update({
        where: { productId },
        data: {
          stockQuantity: {
            decrement: quantity,
          },
        },
      })

      return sale
    })

    res.status(201).json(result)
  } catch (error: any) {
    if (error.message === "Product not found") {
      res.status(404).json({ message: "Product not found" })
    } else if (error.message === "Insufficient stock") {
      res.status(400).json({ message: "Insufficient stock" })
    } else {
      res.status(500).json({ message: "Error creating sale" })
    }
  }
}

export const updateSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { productId, customerId, quantity, unitPrice, totalAmount, profit } = req.body

    // Get the original sale to calculate stock difference
    const originalSale = await prisma.sales.findUnique({
      where: { saleId: id },
    })

    if (!originalSale) {
      res.status(404).json({ message: "Sale not found" })
      return
    }

    const result = await prisma.$transaction(async (tx) => {
      const updateData: any = {}
      if (productId !== undefined) updateData.productId = productId
      if (customerId !== undefined) updateData.customerId = customerId
      if (quantity !== undefined) updateData.quantity = quantity
      if (unitPrice !== undefined) updateData.unitPrice = unitPrice
      if (totalAmount !== undefined) updateData.totalAmount = totalAmount
      if (profit !== undefined) updateData.profit = profit

      const sale = await tx.sales.update({
        where: { saleId: id },
        data: updateData,
        include: {
          product: true,
          customer: true,
        },
      })

      // If quantity changed, update product stock
      if (quantity !== undefined && quantity !== originalSale.quantity) {
        const stockDifference = originalSale.quantity - quantity // Reverse logic for sales
        await tx.products.update({
          where: { productId: originalSale.productId },
          data: {
            stockQuantity: {
              increment: stockDifference,
            },
          },
        })
      }

      return sale
    })

    res.json(result)
  } catch (error) {
    res.status(500).json({ message: "Error updating sale" })
  }
}

export const deleteSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Get the sale to reverse stock changes
    const sale = await prisma.sales.findUnique({
      where: { saleId: id },
    })

    if (!sale) {
      res.status(404).json({ message: "Sale not found" })
      return
    }

    await prisma.$transaction(async (tx) => {
      // Delete the sale
      await tx.sales.delete({
        where: { saleId: id },
      })

      // Reverse the stock quantity (add back the sold quantity)
      await tx.products.update({
        where: { productId: sale.productId },
        data: {
          stockQuantity: {
            increment: sale.quantity,
          },
        },
      })
    })

    res.status(204).send()
  } catch (error) {
    res.status(500).json({ message: "Error deleting sale" })
  }
}