import { auth } from "@/app/api/auth/[...nextauth]/auth.config"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const user = req.auth?.user as
    | { role?: string; branchCode?: string; branchId?: string }
    | undefined
  const isLoggedIn = !!user

  const branchPathMatch = pathname.match(/^\/branch\/([^/]+)/)
  const branchCodeFromUrl = branchPathMatch?.[1]
  const isBranchRoute = !!branchPathMatch
  const isBranchLogin = pathname.match(/\/login$/)

  // ---------------------------------------------------------------------------
  // 1. Public: Branch login page
  //    Route: /branch/:code/login
  //    Anyone can access — users must log in before entering a branch.
  // ---------------------------------------------------------------------------
  if (isBranchRoute && isBranchLogin) return

  // ---------------------------------------------------------------------------
  // 2. Protected: Admin dashboard
  //    Routes: /dashboard/admin, /dashboard/admin/*
  //    Only authenticated users with role "ADMIN" may access.
  //    Non-admin users (branch MANAGER/STAFF) are redirected to /login.
  // ---------------------------------------------------------------------------
  const isOnDashboard = pathname.startsWith("/dashboard")

  if (isOnDashboard) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url)
      return Response.redirect(loginUrl)
    }
    if (user?.role !== "ADMIN") {
      const loginUrl = new URL("/login", req.url)
      return Response.redirect(loginUrl)
    }
    return
  }

  // ---------------------------------------------------------------------------
  // 3. Protected: Branch pages
  //    Routes: /branch/:code/* (except /login)
  //    Only authenticated users whose session branchCode matches the URL code
  //    may access. Redirects unauthenticated users or wrong-branch users
  //    to the branch-specific login page.
  // ---------------------------------------------------------------------------
  if (isBranchRoute) {
    if (!isLoggedIn) {
      const branchLoginUrl = new URL(`/branch/${branchCodeFromUrl}/login`, req.url)
      return Response.redirect(branchLoginUrl)
    }
    if (user?.branchCode && user.branchCode !== branchCodeFromUrl) {
      const branchLoginUrl = new URL(`/branch/${branchCodeFromUrl}/login`, req.url)
      return Response.redirect(branchLoginUrl)
    }
    return
  }
})

// Middleware does NOT run on API routes, static assets, or auth pages.
// API routes handle their own auth via auth() + role checks.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register).*)"],
}
