import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { changePasswordSchema } from "@loukdo/backend/validators"
import { findUserById, updateUserPassword } from "@loukdo/backend/services/user"
import { verify } from "@loukdo/backend/services/password"
import type { AccessUser } from "@loukdo/backend/services/access"

/**
 * @swagger
 * /api/v1/users/me/password:
 *   patch:
 *     tags: [Users]
 *     summary: Change the signed-in user's own password
 *     description: >-
 *       Verifies the current password before updating to the new one.
 *       Available to any authenticated user, including SUPER_ADMIN.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Current password is incorrect
 */
export async function PATCH(request: Request) {
  const session = await auth()
  const sessionUser = session?.user as AccessUser | undefined

  if (!sessionUser?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = changePasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const user = await findUserById(sessionUser.id)
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const isValid = verify(parsed.data.currentPassword, user.password)
  if (!isValid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 })
  }

  await updateUserPassword(user.id, parsed.data.newPassword)
  return NextResponse.json({ success: true })
}
