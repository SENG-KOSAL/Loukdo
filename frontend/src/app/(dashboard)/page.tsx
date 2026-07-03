import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/layouts/DashboardLayout"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <DashboardLayout>
      <p>Welcome to Loukdo POS dashboard.</p>
    </DashboardLayout>
  )
}
