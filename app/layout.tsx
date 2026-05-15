import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "MPG-3D",
  description: "3D Druck Plattform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}