import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    username?: string
    role?: string
    branchId?: string
    branchCode?: string
  }

  interface Session {
    user: {
      username?: string
      role?: string
      branchId?: string
      branchCode?: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string
    role?: string
    branchId?: string
    branchCode?: string
  }
}
