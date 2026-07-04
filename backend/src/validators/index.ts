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
  address: z.string().optional(),
  phone: z.string().optional(),
  code: z.string().min(1, "Branch code is required"),
})

export type BranchInput = z.infer<typeof createBranchSchema>

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
