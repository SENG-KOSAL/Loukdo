import type { Metadata } from "next"
import "./globals.css"
import ThemeRegistry from "@/components/providers/ThemeRegistry"
import AuthProvider from "@/components/providers/AuthProvider"
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Loukdo POS",
  description: "Loukdo Point of Sale System",
  icons: {},
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <ThemeRegistry>
          <AuthProvider>{children}</AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  )
}
