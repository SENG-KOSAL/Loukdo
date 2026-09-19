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

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
