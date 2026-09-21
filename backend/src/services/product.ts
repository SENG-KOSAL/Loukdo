import prisma from "./prisma"

export async function getProductsByBranch(branchId: string) {
  return prisma.product.findMany({
    where: { branchId },
    include: {
      category: { select: { id: true, name: true } },
      inventory: { select: { id: true, quantity: true, minStock: true } },
    },
    orderBy: { name: "asc" },
  })
}

export async function getAllProducts() {
  return prisma.product.findMany({
    include: {
      branch: { select: { id: true, name: true, code: true } },
      category: { select: { id: true, name: true } },
      inventory: { select: { id: true, quantity: true, minStock: true } },
    },
    orderBy: { name: "asc" },
  })
}

export async function findProductById(id: string) {
  return prisma.product.findUnique({ where: { id } })
}

export type ProductCreateInput = {
  name: string
  description?: string | null
  price: number
  cost?: number
  sku?: string | null
  barcode?: string | null
  taxable?: boolean
  active?: boolean
  categoryId?: string | null
  branchId: string
  initialQuantity?: number
  minStock?: number
}

export async function createProduct(data: ProductCreateInput) {
  return prisma.product.create({
    data: {
      name: data.name,
      description: data.description || null,
      price: data.price,
      cost: data.cost ?? 0,
      sku: data.sku || null,
      barcode: data.barcode || null,
      taxable: data.taxable ?? true,
      active: data.active ?? true,
      categoryId: data.categoryId || null,
      branchId: data.branchId,
      inventory: {
        create: {
          branchId: data.branchId,
          quantity: data.initialQuantity ?? 0,
          minStock: data.minStock ?? 0,
        },
      },
    },
    include: {
      category: { select: { id: true, name: true } },
      inventory: { select: { id: true, quantity: true, minStock: true } },
    },
  })
}

export type ProductUpdateInput = {
  name?: string
  description?: string | null
  price?: number
  cost?: number
  sku?: string | null
  barcode?: string | null
  taxable?: boolean
  active?: boolean
  categoryId?: string | null
}

export async function updateProduct(id: string, data: ProductUpdateInput) {
  return prisma.product.update({
    where: { id },
    data,
    include: {
      category: { select: { id: true, name: true } },
      inventory: { select: { id: true, quantity: true, minStock: true } },
    },
  })
}

export async function deleteProduct(id: string) {
  const soldCount = await prisma.saleItem.count({ where: { productId: id } })
  if (soldCount > 0) {
    throw new Error("This product has sales history and cannot be deleted. Deactivate it instead.")
  }
  await prisma.inventoryItem.deleteMany({ where: { productId: id } })
  return prisma.product.delete({ where: { id } })
}
