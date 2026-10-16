import type { Metadata } from "next"
import "./globals.css"
import AuthProvider from "@/components/providers/AuthProvider"
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Loukdo POS",
  description: "Loukdo Point of Sale System",
  icons: {},
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-body antialiased")}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
