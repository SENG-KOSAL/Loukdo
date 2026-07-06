import { auth } from "@/app/api/auth/[...nextauth]/auth.config"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth?.user

  const branchPathMatch = pathname.match(/^\/branch\/([^/]+)/)
  const isBranchRoute = !!branchPathMatch
  const isBranchLogin = pathname.match(/\/login$/)

  if (isBranchRoute && isBranchLogin) return
  if (isBranchRoute && isLoggedIn) return

  const isOnDashboard = pathname.startsWith("/dashboard")
  if (isOnDashboard && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url)
    return Response.redirect(loginUrl)
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register).*)"],
}
