import { auth } from "@/app/api/auth/[...nextauth]/auth.config"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth?.user

  const branchMatch = pathname.match(/^\/branch\/([^/]+)$/)
  const branchLoginMatch = pathname.match(/^\/branch\/([^/]+)\/login$/)

  if (branchMatch && isLoggedIn) return
  if (branchLoginMatch) return

  const isOnDashboard = pathname.startsWith("/dashboard")
  if (isOnDashboard && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url)
    return Response.redirect(loginUrl)
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register).*)"],
}
