"use client"
import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Order {
  id: string
  status: string
  totalPrice: number
  createdAt: string
}

interface DashboardData {
  user: {
    id: string
    email: string
    name: string | null
    role: string
    createdAt: string
    orders: Order[]
  } | null
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  PAID: "bg-green-500/20 text-green-400 border-green-500/30",
  PRINTING: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  SHIPPED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  DONE: "bg-gray-500/20 text-gray-400 border-gray-500/30",
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Ausstehend",
  PAID: "Bezahlt",
  PRINTING: "Im Druck",
  SHIPPED: "Versendet",
  DONE: "Abgeschlossen",
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status === "authenticated") {
      fetch("/api/dashboard")
        .then(r => r.json())
        .then(d => { setData(d); setLoading(false) })
        .catch(() => setLoading(false))
    }
  }, [status, router])

  const downloadInvoice = (order: Order) => {
    const { jsPDF } = require("jspdf")
    const doc = new jsPDF()

    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.text("MPG-3D", 20, 25)

    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.text("Premium 3D Druck Service", 20, 33)
    doc.text("info@mpg-3d.de | mpg-3d.de", 20, 40)

    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("RECHNUNG", 20, 58)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Rechnungsnummer: #${order.id.slice(-8).toUpperCase()}`, 20, 68)
    doc.text(`Datum: ${new Date(order.createdAt).toLocaleDateString("de-DE")}`, 20, 75)
    doc.text(`Status: ${STATUS_LABELS[order.status] ?? order.status}`, 20, 82)

    doc.text(`Kunde: ${data?.user?.name ?? ""} (${data?.user?.email ?? ""})`, 20, 92)

    doc.line(20, 100, 190, 100)

    doc.setFont("helvetica", "bold")
    doc.text("Beschreibung", 20, 110)
    doc.text("Betrag", 160, 110)
    doc.setFont("helvetica", "normal")
    doc.text("MPG-3D 3D Druckauftrag", 20, 120)
    doc.text(`${order.totalPrice.toFixed(2)} EUR`, 155, 120)

    doc.line(20, 128, 190, 128)
    doc.setFont("helvetica", "bold")
    doc.text("Gesamt (inkl. MwSt.)", 20, 138)
    doc.text(`${order.totalPrice.toFixed(2)} EUR`, 155, 138)

    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text("Enthaltene MwSt. (19%): " + (order.totalPrice * 0.19 / 1.19).toFixed(2) + " EUR", 20, 150)

    doc.setFontSize(8)
    doc.text("Vielen Dank für Ihre Bestellung bei MPG-3D!", 20, 175)

    doc.save(`MPG-3D-Rechnung-${order.id.slice(-8).toUpperCase()}.pdf`)
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Laden...</div>
      </div>
    )
  }

  const user = data?.user
  const orders = user?.orders ?? []

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-black/80 border-b border-blue-500/10 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-2xl font-black">MPG-3D</a>
            <span className="text-gray-500">/</span>
            <span className="text-gray-300">Mein Konto</span>
          </div>
          <div className="flex items-center gap-4">
            {(session?.user as any)?.role === "ADMIN" && (
              <a href="/admin" className="px-3 py-1 rounded-lg border border-blue-500/30 text-sm font-bold hover:bg-blue-600/20 transition">
                Admin
              </a>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-4 py-2 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-600/40 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">

        <div className="bg-gradient-to-b from-blue-950/40 to-black border border-blue-500/10 rounded-3xl p-8 mb-8">
          <h1 className="text-3xl font-black mb-1">👤 Mein Konto</h1>
          <p className="text-gray-400">{user?.email}</p>
          {user?.name && <p className="text-gray-300 mt-1">{user.name}</p>}
          <div className="flex items-center gap-3 mt-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${user?.role === "ADMIN" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"}`}>
              {user?.role === "ADMIN" ? "Administrator" : "Kunde"}
            </span>
            <span className="text-gray-500 text-xs">
              Mitglied seit {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("de-DE") : ""}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-b from-blue-950/40 to-black border border-blue-500/10 rounded-3xl p-8">
          <h2 className="text-2xl font-black mb-6">📦 Meine Bestellungen</h2>

          {orders.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg mb-4">Noch keine Bestellungen</p>
              <a href="/#shop" className="bg-blue-600 hover:bg-blue-500 transition px-6 py-3 rounded-xl font-bold">
                Jetzt bestellen
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-black/40 border border-blue-500/10 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-lg">Bestellung #{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {new Date(order.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[order.status] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                    <span className="font-black text-blue-400 text-lg">{order.totalPrice.toFixed(2)} €</span>
                    <button
                      onClick={() => downloadInvoice(order)}
                      className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition text-sm font-bold flex items-center gap-2"
                    >
                      📄 Rechnung
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
