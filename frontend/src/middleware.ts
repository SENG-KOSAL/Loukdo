export { auth as middleware } from "@/app/api/auth/[...nextauth]/auth.config"

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register).*)"],
}
