import prisma from "./prisma"

export async function getInventoryByBranch(branchId: string) {
  return prisma.inventoryItem.findMany({
    where: { branchId },
    include: {
      product: { select: { id: true, name: true, sku: true, price: true, active: true } },
    },
    orderBy: { updatedAt: "desc" },
  })
}

export async function getAllInventory() {
  return prisma.inventoryItem.findMany({
    include: {
      product: { select: { id: true, name: true, sku: true, price: true, active: true } },
      branch: { select: { id: true, name: true, code: true } },
    },
    orderBy: { updatedAt: "desc" },
  })
}

export async function findInventoryById(id: string) {
  return prisma.inventoryItem.findUnique({ where: { id } })
}

export type InventoryUpdateInput = {
  quantity?: number
  minStock?: number
  adjustBy?: number
}

export async function updateInventory(id: string, data: InventoryUpdateInput) {
  if (typeof data.adjustBy === "number") {
    const current = await prisma.inventoryItem.findUnique({ where: { id } })
    if (!current) throw new Error("Inventory record not found")
    const nextQuantity = Math.max(0, current.quantity + data.adjustBy)
    return prisma.inventoryItem.update({
      where: { id },
      data: { quantity: nextQuantity, ...(typeof data.minStock === "number" ? { minStock: data.minStock } : {}) },
      include: { product: { select: { id: true, name: true, sku: true, price: true, active: true } } },
    })
  }

  return prisma.inventoryItem.update({
    where: { id },
    data: {
      ...(typeof data.quantity === "number" ? { quantity: data.quantity } : {}),
      ...(typeof data.minStock === "number" ? { minStock: data.minStock } : {}),
    },
    include: { product: { select: { id: true, name: true, sku: true, price: true, active: true } } },
  })
}
