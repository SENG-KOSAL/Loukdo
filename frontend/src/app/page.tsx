import { redirect } from "next/navigation"
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth"

export default async function HomePage() {
  const session = await auth()
  if (session?.user) redirect("/dashboard/admin")
  redirect("/login")
}
