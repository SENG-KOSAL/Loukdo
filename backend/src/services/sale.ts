import prisma from "./prisma"

export async function getSalesByBranch(branchId: string) {
  return prisma.sale.findMany({
    where: { branchId },
    orderBy: { createdAt: "desc" },
  })
}

export async function createSale(data: { branchId: string; total: number }) {
  return prisma.sale.create({ data })
}
