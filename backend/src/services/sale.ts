import prisma from "./prisma"

export async function getSalesByBranch(branchId: string) {
  return prisma.sale.findMany({
    where: { branchId },
    orderBy: { createdAt: "desc" },
  })
}

/** A business-rule failure (bad input, out of stock...) that should be shown to the cashier. */
export class SaleError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = "SaleError"
    this.status = status
  }
}

export type SaleItemInput = { productId: string; quantity: number }

const round2 = (n: number) => Math.round(n * 100) / 100

function newReceiptNo() {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `R-${ymd}-${suffix}`
}

/**
 * Creates a completed sale and deducts the sold quantities from the branch inventory.
 *
 * - Prices are always read from the database, never from the client.
 * - Everything runs in one transaction: if any line is out of stock, nothing is saved
 *   and no stock is deducted.
 * - Stock is deducted with a conditional update (quantity >= requested), so two
 *   cashiers selling the last unit at the same time cannot oversell it.
 */
export async function createSale(data: { branchId: string; items: SaleItemInput[] }) {
  const { branchId } = data

  // Merge duplicate lines (SaleItem is unique per sale + product).
  const wanted = new Map<string, number>()
  for (const item of data.items) {
    wanted.set(item.productId, (wanted.get(item.productId) ?? 0) + item.quantity)
  }
  if (wanted.size === 0) throw new SaleError("Add at least one item to the sale")

  return prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: [...wanted.keys()] }, branchId, active: true },
      select: { id: true, name: true, price: true },
    })
    if (products.length !== wanted.size) {
      throw new SaleError("One or more products are not available in this branch", 400)
    }

    const lines = products.map((p) => {
      const quantity = wanted.get(p.id)!
      const unitPrice = Number(p.price)
      return { productId: p.id, name: p.name, quantity, unitPrice, total: round2(unitPrice * quantity) }
    })

    for (const line of lines) {
      const res = await tx.inventoryItem.updateMany({
        where: { productId: line.productId, branchId, quantity: { gte: line.quantity } },
        data: { quantity: { decrement: line.quantity } },
      })
      if (res.count === 0) {
        throw new SaleError(`Not enough stock for "${line.name}". Refresh and try again.`, 409)
      }
    }

    const subtotal = round2(lines.reduce((sum, l) => sum + l.total, 0))

    return tx.sale.create({
      data: {
        branchId,
        receiptNo: newReceiptNo(),
        subtotal,
        tax: 0,
        total: subtotal,
        items: {
          create: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            total: l.total,
          })),
        },
      },
      include: {
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    })
  })
}
