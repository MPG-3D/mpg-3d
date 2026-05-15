import type { Metadata } from "next"
import "./globals.css"
import { SessionProvider } from "./providers"

export const metadata: Metadata = {
  title: "MPG-3D",
  description: "3D Druck Plattform",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
