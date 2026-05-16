import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/prisma/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      orders: { orderBy: { createdAt: "desc" } },
      uploads: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  })

  return NextResponse.json({ user })
}
