import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import prisma from "@loukdo/backend/services/prisma"
import { hash, verify } from "@/lib/password"
import { authConfig } from "./auth.config"

const DEFAULT_ADMIN_USERNAME = "admin"
const DEFAULT_ADMIN_PASSWORD = "admin"

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
          try {
            // SUPER_ADMIN accounts live in the database so their password can
            // be changed from Settings. On first-ever login with the default
            // credentials, seed that record automatically.
            let admin = await prisma.user.findFirst({
              where: { role: "SUPER_ADMIN", username },
            })

            if (!admin) {
              const anySuperAdmin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } })
              const isDefaultLogin =
                !anySuperAdmin &&
                username === DEFAULT_ADMIN_USERNAME &&
                password === DEFAULT_ADMIN_PASSWORD

              if (!isDefaultLogin) return null

              admin = await prisma.user.create({
                data: {
                  username: DEFAULT_ADMIN_USERNAME,
                  email: "admin@loukdo.com",
                  name: "Administrator",
                  password: hash(DEFAULT_ADMIN_PASSWORD),
                  role: "SUPER_ADMIN",
                },
              })
            }

            if (!verify(password, admin.password)) return null

            return {
              id: admin.id,
              name: admin.name ?? admin.username,
              email: admin.email,
              username: admin.username,
              role: admin.role as string,
            }
          } catch {
            return null
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
              branchCode: branch.code,
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
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.branchId = user.branchId
        token.branchCode = user.branchCode
      }
      return token
    },
    session({ session, token }) {
      const t = token as { id?: string; username?: string; role?: string; branchId?: string; branchCode?: string }
      return { ...session, user: { ...session.user, ...t } }
    },
  },
})
