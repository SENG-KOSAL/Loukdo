import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import prisma from "@loukdo/backend/services/prisma"
import { getAllBranches, createBranch } from "@loukdo/backend/services/branch"
import { createBranchSchema } from "@loukdo/backend/validators"
import { hasRole, ROLES, type AccessUser } from "@loukdo/backend/services/access"

function isSuperAdmin(user: AccessUser | undefined): boolean {
  return hasRole(user ?? null, ROLES.SUPER_ADMIN)
}

/**
 * @swagger
 * /api/v1/branches:
 *   get:
 *     tags: [Branches]
 *     summary: List branches or look up a branch by code
 *     description: >-
 *       Returns all branches (SUPER_ADMIN only). Pass `?code=` to look up a
 *       single branch publicly without authentication.
 *     security:
 *       - cookieAuth: []
 *       - {}
 *     parameters:
 *       - name: code
 *         in: query
 *         required: false
 *         description: Branch code for a public single-branch lookup
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of branches, or a single branch when `code` is provided
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/Branch'
 *                 - $ref: '#/components/schemas/Branch'
 *       403:
 *         description: Forbidden - requires SUPER_ADMIN role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Branch not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const branch = await prisma.branch.findUnique({ where: { code } })
    if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 })
    return NextResponse.json(branch)
  }

  const session = await auth()
  if (!isSuperAdmin(session?.user as AccessUser | undefined)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const branches = await getAllBranches()
  return NextResponse.json(branches)
}

/**
 * @swagger
 * /api/v1/branches:
 *   post:
 *     tags: [Branches]
 *     summary: Create a branch
 *     description: Creates a branch and optionally a BRANCH_ADMIN user (SUPER_ADMIN only).
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBranchInput'
 *     responses:
 *       201:
 *         description: Branch created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Branch'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - requires SUPER_ADMIN role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Branch name or code already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!isSuperAdmin(session?.user as AccessUser | undefined)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = createBranchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  try {
    const result = await createBranch(parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create branch"
    return NextResponse.json({ error: message }, { status: 409 })
  }
}