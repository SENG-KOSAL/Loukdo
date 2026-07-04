import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // TODO: call backend service to validate credentials
        if (credentials?.username === "admin" && credentials?.password === "admin") {
          return { id: "1", name: "Admin", username: "admin", email: "admin@loukdo.com" }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.username = user.username
      }
      return token
    },
    session({ session, token }) {
      if (token.username) {
        session.user.username = token.username
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
      if (isOnDashboard && !isLoggedIn) return false
      return true
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
