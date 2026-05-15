import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/prisma/lib/prisma"

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()
    if (!email || !password) return NextResponse.json({ error: "Email und Passwort erforderlich" }, { status: 400 })
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return NextResponse.json({ error: "Email bereits registriert" }, { status: 400 })
    const hashedPassword = await bcrypt.hash(password, 12)
    await prisma.user.create({ data: { email, password: hashedPassword, name } })
    return NextResponse.json({ message: "Konto erstellt" })
  } catch {
    return NextResponse.json({ error: "Fehler beim Erstellen des Kontos" }, { status: 500 })
  }
}
