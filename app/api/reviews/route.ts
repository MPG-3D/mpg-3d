import { NextResponse } from "next/server"
import { prisma } from "@/prisma/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get("productId")

  const reviews = await prisma.review.findMany({
    where: productId ? { productId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return NextResponse.json({ reviews })
}

export async function POST(req: Request) {
  try {
    const { productId, name, rating, comment } = await req.json()

    if (!productId || !name || !rating || !comment) {
      return NextResponse.json({ error: "Alle Felder erforderlich" }, { status: 400 })
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Bewertung muss zwischen 1 und 5 sein" }, { status: 400 })
    }

    const review = await prisma.review.create({
      data: { productId, name, rating: Number(rating), comment },
    })

    return NextResponse.json({ review })
  } catch (error) {
    return NextResponse.json({ error: "Fehler beim Speichern der Bewertung" }, { status: 500 })
  }
}
