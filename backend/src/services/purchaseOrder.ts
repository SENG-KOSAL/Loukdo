import prisma from "./prisma"
import type { Prisma } from "../generated/prisma"

/** A business-rule failure (bad input, wrong status...) that should be shown to the user. */
export class PurchaseOrderError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = "PurchaseOrderError"
    this.status = status
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100

function newPoNumber() {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `PO-${ymd}-${suffix}`
}

const poInclude = {
  vendor: { select: { id: true, name: true, code: true } },
  items: {
    include: { product: { select: { id: true, name: true, sku: true } } },
    orderBy: { id: "asc" as const },
  },
}

export async function getPurchaseOrdersByBranch(branchId: string) {
  return prisma.purchaseOrder.findMany({
    where: { branchId },
    include: poInclude,
    orderBy: { createdAt: "desc" },
  })
}

export async function getAllPurchaseOrders() {
  return prisma.purchaseOrder.findMany({
    include: { ...poInclude, branch: { select: { id: true, name: true, code: true } } },
    orderBy: { createdAt: "desc" },
  })
}

export async function findPurchaseOrderById(id: string) {
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: { ...poInclude, branch: { select: { id: true, name: true, code: true } } },
  })
}

export type PurchaseOrderItemInput = { productId: string; quantity: number; unitCost: number }

/** Merges duplicate product lines (a product can appear once per PO): quantities add up, the last unit cost wins. */
function mergeItems(items: PurchaseOrderItemInput[]) {
  const merged = new Map<string, PurchaseOrderItemInput>()
  for (const item of items) {
    const existing = merged.get(item.productId)
    merged.set(item.productId, {
      productId: item.productId,
      quantity: (existing?.quantity ?? 0) + item.quantity,
      unitCost: item.unitCost,
    })
  }
  return [...merged.values()]
}

type Tx = Prisma.TransactionClient

type PurchaseOrderMovementStatus = "PENDING" | "CANCELLED"

async function assertVendor(tx: Tx, vendorId: string, branchId: string) {
  const vendor = await tx.vendor.findFirst({ where: { id: vendorId, branchId } })
  if (!vendor) throw new PurchaseOrderError("Vendor not found in this branch")
  if (!vendor.active) throw new PurchaseOrderError("This vendor is inactive")
}

async function buildLines(tx: Tx, branchId: string, items: PurchaseOrderItemInput[]) {
  const merged = mergeItems(items)
  const products = await tx.product.findMany({
    where: { id: { in: merged.map((i) => i.productId) }, branchId },
    select: { id: true },
  })
  if (products.length !== merged.length) {
    throw new PurchaseOrderError("One or more products do not belong to this branch")
  }
  return merged.map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
    unitCost: i.unitCost,
    total: round2(i.unitCost * i.quantity),
  }))
}

async function recordPurchaseOrderStatusMovements(
  tx: Tx,
  purchaseOrder: { id: string; branchId: string; items: { id: string; productId: string }[] },
  status: PurchaseOrderMovementStatus,
  createdById?: string,
) {
  const inventories = await tx.inventoryItem.findMany({
    where: {
      branchId: purchaseOrder.branchId,
      productId: { in: purchaseOrder.items.map((item) => item.productId) },
    },
    select: { productId: true, quantity: true },
  })
  const quantities = new Map(inventories.map((inventory) => [inventory.productId, inventory.quantity]))

  await tx.stockMovement.createMany({
    data: purchaseOrder.items.map((item) => {
      const quantity = quantities.get(item.productId) ?? 0
      return {
        type: "PURCHASE_ORDER_STATUS",
        status,
        quantity: 0,
        quantityBefore: quantity,
        quantityAfter: quantity,
        productId: item.productId,
        branchId: purchaseOrder.branchId,
        purchaseOrderId: purchaseOrder.id,
        purchaseOrderItemId: item.id,
        createdById: createdById ?? null,
      }
    }),
  })
}

export type PurchaseOrderCreateInput = {
  branchId: string
  vendorId: string
  createdById?: string
  expectedDate?: string | null
  tax?: number
  shipping?: number
  notes?: string | null
  items: PurchaseOrderItemInput[]
}

export async function createPurchaseOrder(data: PurchaseOrderCreateInput) {
  return prisma.$transaction(async (tx) => {
    await assertVendor(tx, data.vendorId, data.branchId)
    const lines = await buildLines(tx, data.branchId, data.items)

    const subtotal = round2(lines.reduce((sum, l) => sum + l.total, 0))
    const tax = data.tax ?? 0
    const shipping = data.shipping ?? 0

    return tx.purchaseOrder.create({
      data: {
        poNumber: newPoNumber(),
        status: "DRAFT",
        branchId: data.branchId,
        vendorId: data.vendorId,
        createdById: data.createdById ?? null,
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        notes: data.notes || null,
        subtotal,
        tax,
        shipping,
        total: round2(subtotal + tax + shipping),
        items: { create: lines },
      },
      include: poInclude,
    })
  })
}

export type PurchaseOrderUpdateInput = {
  vendorId?: string
  expectedDate?: string | null
  tax?: number
  shipping?: number
  notes?: string | null
  items?: PurchaseOrderItemInput[]
}

/** Only DRAFT purchase orders can be edited. */
export async function updatePurchaseOrder(id: string, data: PurchaseOrderUpdateInput) {
  return prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({ where: { id } })
    if (!po) throw new PurchaseOrderError("Purchase order not found", 404)
    if (po.status !== "DRAFT") throw new PurchaseOrderError("Only draft purchase orders can be edited", 409)

    if (data.vendorId) await assertVendor(tx, data.vendorId, po.branchId)

    const lines = data.items ? await buildLines(tx, po.branchId, data.items) : null
    const subtotal = lines ? round2(lines.reduce((sum, l) => sum + l.total, 0)) : Number(po.subtotal)
    const tax = data.tax ?? Number(po.tax)
    const shipping = data.shipping ?? Number(po.shipping)

    return tx.purchaseOrder.update({
      where: { id },
      data: {
        ...(data.vendorId ? { vendorId: data.vendorId } : {}),
        ...(data.expectedDate !== undefined ? { expectedDate: data.expectedDate ? new Date(data.expectedDate) : null } : {}),
        ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
        subtotal,
        tax,
        shipping,
        total: round2(subtotal + tax + shipping),
        ...(lines ? { items: { deleteMany: {}, create: lines } } : {}),
      },
      include: poInclude,
    })
  })
}

/** DRAFT → ORDERED records PENDING movements; DRAFT/ORDERED → CANCELLED records CANCELLED movements. */
export async function setPurchaseOrderStatus(id: string, status: "ORDERED" | "CANCELLED", userId?: string) {
  return prisma.$transaction(async (tx) => {
    const allowedFrom = status === "ORDERED" ? (["DRAFT"] as const) : (["DRAFT", "ORDERED"] as const)
    const po = await tx.purchaseOrder.findUnique({ where: { id }, include: { items: true } })
    if (!po) throw new PurchaseOrderError("Purchase order not found", 404)
    if (!(allowedFrom as readonly string[]).includes(po.status)) {
      throw new PurchaseOrderError(
        status === "ORDERED"
          ? "Only draft purchase orders can be marked as ordered"
          : "Only draft or ordered purchase orders can be cancelled",
        409,
      )
    }

    await tx.purchaseOrder.update({ where: { id }, data: { status } })
    await recordPurchaseOrderStatusMovements(
      tx,
      po,
      status === "ORDERED" ? "PENDING" : "CANCELLED",
      userId,
    )

    return tx.purchaseOrder.findUniqueOrThrow({ where: { id }, include: poInclude })
  })
}

/** Only DRAFT purchase orders can be deleted. */
export async function deletePurchaseOrder(id: string) {
  const res = await prisma.purchaseOrder.deleteMany({ where: { id, status: "DRAFT" } })
  if (res.count === 0) {
    const exists = await prisma.purchaseOrder.findUnique({ where: { id }, select: { id: true } })
    if (!exists) throw new PurchaseOrderError("Purchase order not found", 404)
    throw new PurchaseOrderError("Only draft purchase orders can be deleted. Cancel it instead.", 409)
  }
}

export type ReceiveInput = {
  items: { itemId: string; quantity: number }[]
  note?: string | null
  userId?: string
}

/**
 * Receives stock against an ORDERED / PARTIALLY_RECEIVED purchase order.
 *
 * In one transaction, for every received line it:
 *  - increases the PO line's receivedQuantity (never beyond the ordered quantity),
 *  - increases the branch inventory (creating the inventory row if missing),
 *  - writes a PURCHASE_RECEIPT StockMovement with before/after quantities.
 * Then it sets the PO to PARTIALLY_RECEIVED or RECEIVED. Product cost is left unchanged.
 */
export async function receivePurchaseOrder(id: string, data: ReceiveInput) {
  // Merge duplicate lines in the request.
  const wanted = new Map<string, number>()
  for (const line of data.items) wanted.set(line.itemId, (wanted.get(line.itemId) ?? 0) + line.quantity)

  return prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({
      where: { id },
      include: { items: { include: { product: { select: { name: true } } } } },
    })
    if (!po) throw new PurchaseOrderError("Purchase order not found", 404)
    if (po.status !== "ORDERED" && po.status !== "PARTIALLY_RECEIVED") {
      throw new PurchaseOrderError("Only ordered purchase orders can receive stock", 409)
    }

    for (const [itemId, qty] of wanted) {
      const item = po.items.find((i) => i.id === itemId)
      if (!item) throw new PurchaseOrderError("One or more items do not belong to this purchase order")

      const remaining = item.quantity - item.receivedQuantity
      if (qty > remaining) {
        throw new PurchaseOrderError(`Cannot receive ${qty} of "${item.product.name}": only ${remaining} still expected`, 409)
      }

      // Conditional update guards against two people receiving the same line at once.
      const updated = await tx.purchaseOrderItem.updateMany({
        where: { id: item.id, receivedQuantity: { lte: item.quantity - qty } },
        data: { receivedQuantity: { increment: qty } },
      })
      if (updated.count === 0) {
        throw new PurchaseOrderError(`"${item.product.name}" was just updated. Refresh and try again.`, 409)
      }

      const inventory = await tx.inventoryItem.upsert({
        where: { productId_branchId: { productId: item.productId, branchId: po.branchId } },
        create: { productId: item.productId, branchId: po.branchId, quantity: qty, minStock: 0 },
        update: { quantity: { increment: qty } },
      })

      await tx.stockMovement.create({
        data: {
          type: "PURCHASE_RECEIPT",
          status: "COMPLETED",
          quantity: qty,
          quantityBefore: inventory.quantity - qty,
          quantityAfter: inventory.quantity,
          note: data.note || null,
          productId: item.productId,
          branchId: po.branchId,
          purchaseOrderId: po.id,
          purchaseOrderItemId: item.id,
          createdById: data.userId ?? null,
        },
      })
    }

    const items = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: id } })
    const complete = items.every((i) => i.receivedQuantity >= i.quantity)

    return tx.purchaseOrder.update({
      where: { id },
      data: complete
        ? { status: "RECEIVED", receivedAt: new Date() }
        : { status: "PARTIALLY_RECEIVED" },
      include: poInclude,
    })
  })
}
