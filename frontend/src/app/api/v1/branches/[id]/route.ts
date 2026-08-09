import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { getAllBranches, getBranch, deleteBranch, duplicateBranch } from "@loukdo/backend/services/branch"
import { hasRole, ROLES, type AccessUser } from "@loukdo/backend/services/access"

function isSuperAdmin(user: AccessUser | undefined): boolean {
  return hasRole(user ?? null, ROLES.SUPER_ADMIN)
}

/**
 * @swagger
 * /api/v1/branches/{id}:
 *   get:
 *     tags: [Branches]
 *     summary: Get a branch by id
 *     description: Returns a single branch including its users (SUPER_ADMIN only).
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Branch id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Branch details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Branch'
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
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!isSuperAdmin(session?.user as AccessUser | undefined)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const branch = await getBranch(id)
  if (!branch) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(branch)
}

/**
 * @swagger
 * /api/v1/branches/{id}:
 *   delete:
 *     tags: [Branches]
 *     summary: Delete a branch
 *     description: Deletes a branch and its related sales and users (SUPER_ADMIN only).
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Branch id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Branch deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       403:
 *         description: Forbidden - requires SUPER_ADMIN role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!isSuperAdmin(session?.user as AccessUser | undefined)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  await deleteBranch(id)
  return NextResponse.json({ success: true })
}

/**
 * @swagger
 * /api/v1/branches/{id}:
 *   post:
 *     tags: [Branches]
 *     summary: Duplicate a branch
 *     description: Creates a new branch copied from the source branch (SUPER_ADMIN only).
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Source branch id
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DuplicateBranchInput'
 *     responses:
 *       201:
 *         description: Branch duplicated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Branch'
 *       400:
 *         description: Missing required fields
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
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!isSuperAdmin(session?.user as AccessUser | undefined)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await request.json()

  if (!body.name || !body.adminUsername || !body.adminPassword) {
    return NextResponse.json({ error: "name, adminUsername, and adminPassword are required" }, { status: 400 })
  }

  try {
    const result = await duplicateBranch(id, body)
    return NextResponse.json(result, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to duplicate branch"
    return NextResponse.json({ error: message }, { status: 409 })
  }
}