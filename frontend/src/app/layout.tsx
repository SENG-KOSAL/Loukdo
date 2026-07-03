import type { Metadata } from "next"
import ThemeRegistry from "@/components/providers/ThemeRegistry"
import AuthProvider from "@/components/providers/AuthProvider"

export const metadata: Metadata = {
  title: "Loukdo POS",
  description: "Loukdo Point of Sale System",
  icons: {},
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <AuthProvider>{children}</AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  )
}
