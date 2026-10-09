import prisma from "./prisma"

export type StockMovementFilter = {
  productId?: string
  purchaseOrderId?: string
  limit?: number
}

const movementInclude = {
  product: { select: { id: true, name: true, sku: true } },
  purchaseOrder: { select: { id: true, poNumber: true } },
  createdBy: { select: { id: true, name: true, username: true } },
}

function clampLimit(limit?: number) {
  return Math.min(Math.max(limit ?? 200, 1), 500)
}

export async function getStockMovementsByBranch(branchId: string, filter: StockMovementFilter = {}) {
  return prisma.stockMovement.findMany({
    where: {
      branchId,
      ...(filter.productId ? { productId: filter.productId } : {}),
      ...(filter.purchaseOrderId ? { purchaseOrderId: filter.purchaseOrderId } : {}),
    },
    include: movementInclude,
    orderBy: { createdAt: "desc" },
    take: clampLimit(filter.limit),
  })
}

export async function getAllStockMovements(filter: StockMovementFilter = {}) {
  return prisma.stockMovement.findMany({
    where: {
      ...(filter.productId ? { productId: filter.productId } : {}),
      ...(filter.purchaseOrderId ? { purchaseOrderId: filter.purchaseOrderId } : {}),
    },
    include: { ...movementInclude, branch: { select: { id: true, name: true, code: true } } },
    orderBy: { createdAt: "desc" },
    take: clampLimit(filter.limit),
  })
}
