import { NextResponse } from "next/server"
import { Resend } from "resend"
import { prisma } from "@/prisma/lib/prisma"
import { sendDiscordWebhook } from "@/lib/discord"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function calculateSTL(fileSize: number, material: string) {
  const estimatedVolume = fileSize / 120
  const densityMap: Record<string, number> = {
    "PLA Standard": 1.24,
    "PLA+ Premium": 1.24,
    PETG: 1.27,
    ABS: 1.04,
    "TPU Flexibel": 1.21,
    Resin: 1.15,
  }
  const density = densityMap[material] ?? 1.24
  const estimatedWeight = estimatedVolume * density
  const estimatedPrintHours = estimatedWeight / 18
  const supportNeeded = estimatedWeight > 120
  const materialCost = estimatedWeight * 0.08
  const printCost = estimatedPrintHours * 2.5
  const supportCost = supportNeeded ? 4 : 0
  const shipping = 5
  const totalPrice = materialCost + printCost + supportCost + shipping

  return {
    volume: estimatedVolume.toFixed(2),
    weight: estimatedWeight.toFixed(2),
    printHours: estimatedPrintHours.toFixed(1),
    supportNeeded,
    price: Math.max(totalPrice, 9.99).toFixed(2),
  }
}

export async function POST(req: Request) {
  try {
    const { name, email, phone, material, description, fileSize, fileUrl } = await req.json()

    if (!name || !email || !description) {
      return NextResponse.json({ error: "Name, Email und Beschreibung erforderlich" }, { status: 400 })
    }

    const analysis = fileSize ? calculateSTL(Number(fileSize), material || "PLA Standard") : null

    await prisma.request.create({
      data: {
        name,
        email,
        phone: phone || "",
        material: material || "PLA Standard",
        description,
        volume: analysis?.volume ?? "0",
        weight: analysis?.weight ?? "0",
        printHours: analysis?.printHours ?? "0",
        price: analysis?.price ?? "0",
      },
    })

    if (resend) {
      await resend.emails.send({
        from: "MPG-3D <noreply@mpg-3d.de>",
        to: email,
        subject: "MPG-3D — Deine Anfrage & Preisschätzung",
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#000;color:#fff;padding:32px;border-radius:16px">
            <h1 style="color:#3b82f6;margin-bottom:4px">MPG-3D</h1>
            <p style="color:#6b7280;margin:0 0 24px">Premium 3D Druck Service</p>
            <h2 style="margin-bottom:8px">Hallo ${name}! 👋</h2>
            <p style="color:#d1d5db">Deine Anfrage wurde empfangen. Hier ist deine Preisschätzung:</p>
            <div style="background:#111827;border-radius:12px;padding:20px;margin:24px 0;border:1px solid #1f2937">
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="color:#9ca3af;padding:6px 0">Material</td><td style="text-align:right;font-weight:bold">${material}</td></tr>
                ${analysis ? `
                <tr><td style="color:#9ca3af;padding:6px 0">Volumen</td><td style="text-align:right">${analysis.volume} cm³</td></tr>
                <tr><td style="color:#9ca3af;padding:6px 0">Gewicht</td><td style="text-align:right">${analysis.weight} g</td></tr>
                <tr><td style="color:#9ca3af;padding:6px 0">Druckzeit</td><td style="text-align:right">${analysis.printHours} h</td></tr>
                <tr><td style="color:#9ca3af;padding:6px 0">Support nötig</td><td style="text-align:right">${analysis.supportNeeded ? "Ja" : "Nein"}</td></tr>
                <tr style="border-top:1px solid #374151"><td style="padding-top:12px;font-size:18px;font-weight:bold">Geschätzter Preis</td><td style="text-align:right;font-size:24px;font-weight:bold;color:#3b82f6;padding-top:12px">${analysis.price} €</td></tr>
                ` : ""}
              </table>
            </div>
            <p style="color:#6b7280;font-size:13px">Wir melden uns in Kürze mit einem finalen Angebot.</p>
            <p style="color:#6b7280;font-size:12px;margin-top:24px">MPG-3D | <a href="https://mpg-3d.de" style="color:#3b82f6">mpg-3d.de</a></p>
          </div>
        `,
      })
    }

    await sendDiscordWebhook("", [{
      title: "📬 Neue STL Anfrage — MPG-3D",
      color: 0x3b82f6,
      fields: [
        { name: "👤 Name", value: name, inline: true },
        { name: "📧 Email", value: email, inline: true },
        { name: "🔩 Material", value: material || "PLA Standard", inline: true },
        ...(analysis ? [
          { name: "⚖️ Gewicht", value: `${analysis.weight} g`, inline: true },
          { name: "🕒 Druckzeit", value: `${analysis.printHours} h`, inline: true },
          { name: "💰 Preis", value: `${analysis.price} €`, inline: true },
          { name: "🔧 Support", value: analysis.supportNeeded ? "Ja" : "Nein", inline: true },
        ] : []),
        { name: "📝 Beschreibung", value: description.slice(0, 200) },
      ],
      timestamp: new Date().toISOString(),
    }])

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    console.error("Request error:", error)
    return NextResponse.json({ error: "Fehler beim Senden der Anfrage" }, { status: 500 })
  }
}
