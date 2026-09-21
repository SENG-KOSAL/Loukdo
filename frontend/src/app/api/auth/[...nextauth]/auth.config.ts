import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
      if (isOnDashboard && !isLoggedIn) return false
      return true
    },
    jwt({ token }) {
      return token
    },
    session({ session, token }) {
      const t = token as { id?: string; username?: string; role?: string; branchId?: string; branchCode?: string }
      return { ...session, user: { ...session.user, ...t } }
    },
  },
  providers: [],
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
