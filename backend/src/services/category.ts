import prisma from "./prisma"

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || `cat-${Date.now()}`
}

export async function getCategoriesByBranch(branchId: string) {
  return prisma.category.findMany({
    where: { branchId },
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  })
}

export async function getAllCategories() {
  return prisma.category.findMany({
    include: {
      branch: { select: { id: true, name: true, code: true } },
      _count: { select: { products: true } },
    },
    orderBy: { name: "asc" },
  })
}

export async function findCategoryById(id: string) {
  return prisma.category.findUnique({ where: { id } })
}

export type CategoryCreateInput = {
  name: string
  desc?: string | null
  active?: boolean
  branchId: string
}

export async function createCategory(data: CategoryCreateInput) {
  return prisma.category.create({
    data: {
      name: data.name,
      desc: data.desc || null,
      active: data.active ?? true,
      branchId: data.branchId,
      slug: slugify(data.name),
    },
  })
}

export type CategoryUpdateInput = {
  name?: string
  desc?: string | null
  active?: boolean
}

export async function updateCategory(id: string, data: CategoryUpdateInput) {
  return prisma.category.update({
    where: { id },
    data: {
      ...data,
      ...(data.name ? { slug: slugify(data.name) } : {}),
    },
  })
}

export async function deleteCategory(id: string) {
  return prisma.category.delete({ where: { id } })
}
