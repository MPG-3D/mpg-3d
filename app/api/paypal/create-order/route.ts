import { NextResponse } from "next/server"

const PAYPAL_API = process.env.PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com"

async function getAccessToken() {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64")

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })
  const data = await res.json()
  return data.access_token as string
}

export async function POST(req: Request) {
  try {
    const { amount, orderId } = await req.json()

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Ungültiger Betrag" }, { status: 400 })
    }

    const accessToken = await getAccessToken()

    const order = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: String(orderId),
            description: "MPG-3D Druckauftrag",
            amount: {
              currency_code: "EUR",
              value: amount.toFixed(2),
            },
          },
        ],
        application_context: {
          return_url: `${process.env.NEXT_PUBLIC_URL}/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_URL}/cancel`,
          brand_name: "MPG-3D",
          user_action: "PAY_NOW",
        },
      }),
    })

    const orderData = await order.json()

    if (!order.ok) {
      console.error("PayPal error:", orderData)
      return NextResponse.json({ error: "PayPal Fehler" }, { status: 500 })
    }

    const approvalUrl = orderData.links?.find((l: any) => l.rel === "approve")?.href

    return NextResponse.json({ url: approvalUrl })
  } catch (error) {
    console.error("PayPal error:", error)
    return NextResponse.json({ error: "Fehler beim Erstellen der PayPal-Zahlung" }, { status: 500 })
  }
}
