import { NextResponse } from "next/server"
import { Resend } from "resend"
import { prisma } from "@/prisma/lib/prisma"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { name, email, phone, material, description } = await req.json()

    if (!name || !email || !description) {
      return NextResponse.json({ error: "Name, Email und Beschreibung erforderlich" }, { status: 400 })
    }

    await prisma.request.create({
      data: { name, email, phone: phone || "", material: material || "PLA", description },
    })

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: "MPG-3D <noreply@mpg-3d.de>",
        to: email,
        subject: "MPG-3D — Deine Anfrage wurde empfangen",
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#000;color:#fff;padding:32px;border-radius:16px">
            <h1 style="color:#3b82f6;margin-bottom:8px">MPG-3D</h1>
            <p style="color:#9ca3af;margin-bottom:24px">Premium 3D Druck Service</p>
            <h2 style="margin-bottom:16px">Hallo ${name}! 👋</h2>
            <p style="color:#d1d5db;line-height:1.6">
              Wir haben deine Anfrage erhalten und melden uns in Kürze bei dir.
            </p>
            <div style="background:#111827;border-radius:12px;padding:20px;margin:24px 0;border:1px solid #1f2937">
              <p style="margin:0 0 8px;color:#9ca3af;font-size:14px">Deine Anfrage:</p>
              <p style="margin:0 0 4px"><strong>Material:</strong> ${material}</p>
              <p style="margin:0;color:#d1d5db">${description}</p>
            </div>
            <p style="color:#6b7280;font-size:14px;margin-top:32px">
              MPG-3D | <a href="https://mpg-3d.de" style="color:#3b82f6">mpg-3d.de</a>
            </p>
          </div>
        `,
      })

      await resend.emails.send({
        from: "MPG-3D <noreply@mpg-3d.de>",
        to: "info@mpg-3d.de",
        subject: `Neue Anfrage von ${name}`,
        html: `
          <div style="font-family:sans-serif;padding:24px">
            <h2>Neue Anfrage</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Telefon:</strong> ${phone || "–"}</p>
            <p><strong>Material:</strong> ${material}</p>
            <p><strong>Beschreibung:</strong> ${description}</p>
          </div>
        `,
      })
    }

    return NextResponse.json({ message: "Anfrage erfolgreich gesendet" })
  } catch (error) {
    console.error("Request error:", error)
    return NextResponse.json({ error: "Fehler beim Senden der Anfrage" }, { status: 500 })
  }
}
