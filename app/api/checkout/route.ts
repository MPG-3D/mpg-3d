import { NextResponse } from "next/server"
import Stripe from "stripe"
import { sendDiscordWebhook } from "@/lib/discord"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  try {
    const { amount, orderId } = await req.json()

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Ungültiger Betrag" }, { status: 400 })
    }

    const unitAmount = Math.round(amount * 100)
    if (unitAmount < 50) {
      return NextResponse.json({ error: "Mindestbetrag ist 0.50€" }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "MPG-3D Druckauftrag",
              description: orderId ? `Bestellung #${orderId}` : "MPG-3D Bestellung",
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cancel`,
    })

    await sendDiscordWebhook("", [{
      title: "💳 Neue Zahlung — MPG-3D",
      color: 0x22c55e,
      fields: [
        { name: "💶 Betrag", value: `${amount.toFixed(2)} €`, inline: true },
        { name: "🧾 Bestellung", value: `#${orderId}`, inline: true },
      ],
      timestamp: new Date().toISOString(),
    }])

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Stripe error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fehler beim Erstellen der Zahlung" },
      { status: 500 }
    )
  }
}
