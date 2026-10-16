import { z } from "zod"

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
})

export const registerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(6),
})

export const createBranchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  code: z.string().optional(),
  url: z.string().optional(),
  adminUsername: z.string().min(1, "Admin username is required"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
})

const userRoleSchema = z.enum(["SUPER_ADMIN", "BRANCH_ADMIN", "MANAGER", "CASHIER"])

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  username: z.string().trim().min(1, "Username is required").max(50),
  email: z.string().trim().email("A valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: userRoleSchema,
  branchId: z.string().cuid().nullable().optional(),
})

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100).optional(),
  username: z.string().trim().min(1, "Username is required").max(50).optional(),
  email: z.string().trim().email("A valid email is required").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: userRoleSchema.optional(),
  branchId: z.string().cuid().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field is required")

export type BranchInput = z.infer<typeof createBranchSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(100),
  desc: z.string().trim().max(500).nullable().optional(),
  active: z.boolean().optional(),
  branchId: z.string().cuid().nullable().optional(),
})

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(100).optional(),
  desc: z.string().trim().max(500).nullable().optional(),
  active: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field is required")

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(150),
  description: z.string().trim().max(1000).nullable().optional(),
  price: z.coerce.number().min(0, "Price must be 0 or more"),
  cost: z.coerce.number().min(0, "Cost must be 0 or more").optional(),
  sku: z.string().trim().max(50).nullable().optional(),
  barcode: z.string().trim().max(50).nullable().optional(),
  taxable: z.boolean().optional(),
  active: z.boolean().optional(),
  categoryId: z.string().cuid().nullable().optional(),
  branchId: z.string().cuid().nullable().optional(),
  initialQuantity: z.coerce.number().int().min(0).optional(),
  minStock: z.coerce.number().int().min(0).optional(),
})

export const updateProductSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(150).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  price: z.coerce.number().min(0, "Price must be 0 or more").optional(),
  cost: z.coerce.number().min(0, "Cost must be 0 or more").optional(),
  sku: z.string().trim().max(50).nullable().optional(),
  barcode: z.string().trim().max(50).nullable().optional(),
  taxable: z.boolean().optional(),
  active: z.boolean().optional(),
  categoryId: z.string().cuid().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field is required")

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>

export const updateInventorySchema = z.object({
  quantity: z.coerce.number().int().min(0, "Quantity cannot be negative").optional(),
  minStock: z.coerce.number().int().min(0, "Minimum stock cannot be negative").optional(),
  adjustBy: z.coerce.number().int().optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field is required")

export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>

export const updateRolePermissionsSchema = z.object({
  role: z.enum(["BRANCH_ADMIN", "MANAGER", "CASHIER"]),
  permissions: z.record(z.string(), z.boolean()),
})

export type UpdateRolePermissionsInput = z.infer<typeof updateRolePermissionsSchema>

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional()

export const createVendorSchema = z.object({
  name: z.string().trim().min(1, "Vendor name is required").max(150),
  code: optionalText(50),
  contactName: optionalText(100),
  email: z.string().trim().email("A valid email is required").nullable().optional(),
  phone: optionalText(50),
  address: optionalText(300),
  paymentTerms: optionalText(100),
  notes: optionalText(1000),
  active: z.boolean().optional(),
  branchId: z.string().cuid().nullable().optional(),
})

export const updateVendorSchema = z.object({
  name: z.string().trim().min(1, "Vendor name is required").max(150).optional(),
  code: optionalText(50),
  contactName: optionalText(100),
  email: z.string().trim().email("A valid email is required").nullable().optional(),
  phone: optionalText(50),
  address: optionalText(300),
  paymentTerms: optionalText(100),
  notes: optionalText(1000),
  active: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field is required")

export type CreateVendorInput = z.infer<typeof createVendorSchema>
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>

const dateString = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date")

const purchaseOrderItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unitCost: z.coerce.number().min(0, "Unit cost must be 0 or more"),
})

export const createPurchaseOrderSchema = z.object({
  vendorId: z.string().cuid("A vendor is required"),
  branchId: z.string().cuid().nullable().optional(),
  expectedDate: dateString.nullable().optional(),
  tax: z.coerce.number().min(0).optional(),
  shipping: z.coerce.number().min(0).optional(),
  notes: optionalText(1000),
  items: z.array(purchaseOrderItemSchema).min(1, "Add at least one item").max(200),
})

export const updatePurchaseOrderSchema = z.object({
  vendorId: z.string().cuid().optional(),
  expectedDate: dateString.nullable().optional(),
  tax: z.coerce.number().min(0).optional(),
  shipping: z.coerce.number().min(0).optional(),
  notes: optionalText(1000),
  items: z.array(purchaseOrderItemSchema).min(1, "Add at least one item").max(200).optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field is required")

export const updatePurchaseOrderStatusSchema = z.object({
  status: z.enum(["ORDERED", "CANCELLED"]),
})

export const receivePurchaseOrderSchema = z.object({
  items: z.array(z.object({
    itemId: z.string().cuid(),
    quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  })).min(1, "Enter a received quantity for at least one item"),
  note: optionalText(500),
})

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>
export type UpdatePurchaseOrderStatusInput = z.infer<typeof updatePurchaseOrderStatusSchema>
export type ReceivePurchaseOrderInput = z.infer<typeof receivePurchaseOrderSchema>

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
