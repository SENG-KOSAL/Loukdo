import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import prisma from "@loukdo/backend/services/prisma"
import { verify } from "@/lib/password"
import { authConfig } from "./auth.config"

const ADMIN_USERNAME = "admin"
const ADMIN_PASSWORD = "admin"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        branchCode: { label: "Branch Code", type: "text" },
        loginType: { label: "Login Type", type: "text" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string
        const password = credentials?.password as string
        const loginType = credentials?.loginType as string | undefined
        const branchCode = credentials?.branchCode as string | undefined

        if (!username || !password) return null

        if (loginType === "admin") {
          if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) return null
          return {
            id: "admin-id",
            name: "Administrator",
            email: "admin@loukdo.com",
            username: "admin",
            role: "ADMIN",
          }
        }

        if (loginType === "branch") {
          if (!branchCode) return null
          try {
            const branch = await prisma.branch.findUnique({ where: { code: branchCode } })
            if (!branch) return null

            const user = await prisma.user.findUnique({ where: { username } })
            if (!user || !verify(password, user.password)) return null
            if (user.branchId !== branch.id) return null

            return {
              id: user.id,
              name: user.name ?? user.username,
              email: user.email,
              username: user.username,
              role: user.role as string,
              branchId: user.branchId ?? undefined,
            }
          } catch {
            return null
          }
        }

        return null
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.username = user.username
        token.role = user.role
        token.branchId = user.branchId
      }
      return token
    },
    session({ session, token }) {
      const t = token as { username?: string; role?: string; branchId?: string }
      return { ...session, user: { ...session.user, ...t } }
    },
  },
})
