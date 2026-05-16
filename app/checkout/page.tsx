"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CheckoutPage() {
  const [cart, setCart] = useState<{ title: string; price: number; menge: number }[]>([])
  const [loading, setLoading] = useState<"stripe" | "paypal" | null>(null)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem("mpg3d-cart")
    if (stored) setCart(JSON.parse(stored))
  }, [])

  const total = cart.reduce((sum, item) => sum + item.price * item.menge, 0)
  const itemCount = cart.reduce((sum, item) => sum + item.menge, 0)

  const handleStripe = async () => {
    setLoading("stripe")
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, orderId: Date.now() }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert("Fehler beim Bezahlen.")
    } finally {
      setLoading(null)
    }
  }

  const handlePayPal = async () => {
    setLoading("paypal")
    try {
      const res = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, orderId: Date.now() }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert("Fehler beim PayPal-Bezahlen.")
    } finally {
      setLoading(null)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
        <p className="text-white text-2xl font-bold">Dein Warenkorb ist leer</p>
        <a href="/" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold transition">
          Zurück zum Shop
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-lg mx-auto px-6 py-16">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white mb-8 flex items-center gap-2 transition">
          ← Zurück
        </button>

        <h1 className="text-4xl font-black mb-10">Kasse</h1>

        {/* Bestellübersicht */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
          <h2 className="text-lg font-bold mb-4 text-gray-300">Deine Bestellung</h2>
          {cart.map((item, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-gray-800 last:border-0">
              <span className="text-gray-300">{item.menge}× {item.title}</span>
              <span className="font-bold">{(item.price * item.menge).toFixed(2)} €</span>
            </div>
          ))}
          <div className="flex justify-between pt-4 mt-2 text-xl font-black">
            <span>Gesamt</span>
            <span>{total.toFixed(2)} €</span>
          </div>
        </div>

        {/* Zahlungsart wählen */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-bold mb-6 text-gray-300">Zahlungsart wählen</h2>
          <div className="flex flex-col gap-4">
            <button
              onClick={handleStripe}
              disabled={loading !== null}
              className="w-full py-5 rounded-2xl font-black text-lg bg-blue-600 hover:bg-blue-500 transition flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading === "stripe" ? "⏳ Wird verarbeitet..." : (
                <>
                  <span>💳</span>
                  <span>Kreditkarte / Debitkarte</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-700" />
              <span className="text-gray-500 text-sm">oder</span>
              <div className="flex-1 h-px bg-gray-700" />
            </div>

            <button
              onClick={handlePayPal}
              disabled={loading !== null}
              className="w-full py-5 rounded-2xl font-black text-lg bg-[#FFC439] hover:bg-[#f0b429] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading === "paypal" ? (
                <span className="text-[#003087]">⏳ Wird verarbeitet...</span>
              ) : (
                <>
                  <span className="text-[#003087] text-2xl font-black">Pay</span>
                  <span className="text-[#009cde] text-2xl font-black">Pal</span>
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          🔒 Sichere & verschlüsselte Zahlung
        </p>
      </div>
    </div>
  )
}
