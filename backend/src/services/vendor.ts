import prisma from "./prisma"

export async function getVendorsByBranch(branchId: string) {
  return prisma.vendor.findMany({
    where: { branchId },
    include: { _count: { select: { purchaseOrders: true } } },
    orderBy: { name: "asc" },
  })
}

export async function getAllVendors() {
  return prisma.vendor.findMany({
    include: {
      branch: { select: { id: true, name: true, code: true } },
      _count: { select: { purchaseOrders: true } },
    },
    orderBy: { name: "asc" },
  })
}

export async function findVendorById(id: string) {
  return prisma.vendor.findUnique({ where: { id } })
}

export type VendorCreateInput = {
  name: string
  code?: string | null
  contactName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  paymentTerms?: string | null
  notes?: string | null
  active?: boolean
  branchId: string
}

export async function createVendor(data: VendorCreateInput) {
  return prisma.vendor.create({
    data: {
      name: data.name,
      code: data.code || null,
      contactName: data.contactName || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      paymentTerms: data.paymentTerms || null,
      notes: data.notes || null,
      active: data.active ?? true,
      branchId: data.branchId,
    },
    include: { _count: { select: { purchaseOrders: true } } },
  })
}

export type VendorUpdateInput = {
  name?: string
  code?: string | null
  contactName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  paymentTerms?: string | null
  notes?: string | null
  active?: boolean
}

export async function updateVendor(id: string, data: VendorUpdateInput) {
  const clean: VendorUpdateInput = { ...data }
  // Empty strings become null so optional fields can be cleared.
  for (const key of ["code", "contactName", "email", "phone", "address", "paymentTerms", "notes"] as const) {
    if (key in clean) clean[key] = clean[key] || null
  }
  return prisma.vendor.update({
    where: { id },
    data: clean,
    include: { _count: { select: { purchaseOrders: true } } },
  })
}

export async function deleteVendor(id: string) {
  const poCount = await prisma.purchaseOrder.count({ where: { vendorId: id } })
  if (poCount > 0) {
    throw new Error("This vendor has purchase orders and cannot be deleted. Deactivate it instead.")
  }
  return prisma.vendor.delete({ where: { id } })
}
