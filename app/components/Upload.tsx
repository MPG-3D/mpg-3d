"use client"

import { useState } from "react"
import { UploadButton } from "@uploadthing/react"
import type { OurFileRouter } from "@/app/api/uploadthing/core"
import dynamic from "next/dynamic"

const STLViewer = dynamic(() => import("./STLViewer"), { ssr: false })

const MATERIALIEN = [
  { name: "PLA Standard", preis: 0.05 },
  { name: "PLA+ Premium", preis: 0.08 },
  { name: "PETG", preis: 0.09 },
  { name: "ABS", preis: 0.10 },
  { name: "TPU Flexibel", preis: 0.12 },
]

export default function Upload() {
  const [dateiUrl, setDateiUrl] = useState<string | null>(null)
  const [dateiName, setDateiName] = useState<string | null>(null)
  const [material, setMaterial] = useState(MATERIALIEN[0])
  const [menge, setMenge] = useState(1)
  const [ladeVorgang, setLadeVorgang] = useState<"stripe" | "paypal" | null>(null)

  const basisPreis = 15
  const materialPreis = material.preis * 100
  const gesamtPreis = (basisPreis + materialPreis) * menge

  const handleStripe = async () => {
    if (!dateiUrl) return
    setLadeVorgang("stripe")
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: gesamtPreis, orderId: Date.now() }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert("Fehler beim Bezahlen. Bitte versuche es erneut.")
    } finally {
      setLadeVorgang(null)
    }
  }

  const handlePayPal = async () => {
    if (!dateiUrl) return
    setLadeVorgang("paypal")
    try {
      const res = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: gesamtPreis, orderId: Date.now() }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert("Fehler beim PayPal-Bezahlen. Bitte versuche es erneut.")
    } finally {
      setLadeVorgang(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Schritt 1: Upload */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">
          1. STL-Datei hochladen
        </h2>
        {!dateiUrl ? (
          <UploadButton<OurFileRouter, "imageUploader">
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              setDateiUrl(res[0].url)
              setDateiName(res[0].name)
            }}
            onUploadError={(error: Error) => {
              alert(error.message)
            }}
            appearance={{
              button: "bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl w-full",
            }}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-green-900/30 border border-green-700 rounded-xl p-4">
              <span className="text-green-400 text-2xl">✓</span>
              <div>
                <p className="text-green-400 font-semibold">Datei hochgeladen!</p>
                <p className="text-gray-400 text-sm">{dateiName}</p>
              </div>
              <button
                onClick={() => { setDateiUrl(null); setDateiName(null) }}
                className="ml-auto text-gray-500 hover:text-white text-sm"
              >
                Ändern
              </button>
            </div>
            {dateiName?.toLowerCase().endsWith(".stl") && (
              <div>
                <p className="text-gray-400 text-sm mb-2 font-semibold">3D Vorschau</p>
                <STLViewer url={dateiUrl!} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Schritt 2: Konfiguration */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">
          2. Material & Menge wählen
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Material</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MATERIALIEN.map((m) => (
                <button
                  key={m.name}
                  onClick={() => setMaterial(m)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    material.name === m.name
                      ? "border-blue-500 bg-blue-600/20 text-white"
                      : "border-gray-700 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Menge</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMenge(Math.max(1, menge - 1))}
                className="w-10 h-10 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-700"
              >
                −
              </button>
              <span className="text-white text-xl font-bold w-8 text-center">{menge}</span>
              <button
                onClick={() => setMenge(Math.min(99, menge + 1))}
                className="w-10 h-10 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-700"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Schritt 3: Preisübersicht & Checkout */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">
          3. Bestellung abschließen
        </h2>
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-gray-400">
            <span>Basis (Druck + Versand)</span>
            <span>{basisPreis.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Material ({material.name})</span>
            <span>{materialPreis.toFixed(2)} €</span>
          </div>
          {menge > 1 && (
            <div className="flex justify-between text-gray-400">
              <span>Menge × {menge}</span>
              <span></span>
            </div>
          )}
          <div className="border-t border-gray-700 pt-2 flex justify-between text-white font-bold text-lg">
            <span>Gesamt</span>
            <span>{gesamtPreis.toFixed(2)} €</span>
          </div>
        </div>

        <div className="space-y-3">
          {/* Stripe / Kreditkarte */}
          <button
            onClick={handleStripe}
            disabled={!dateiUrl || ladeVorgang !== null}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              dateiUrl && !ladeVorgang
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            {ladeVorgang === "stripe" ? "Wird verarbeitet..." : (
              <>
                <span>💳</span>
                <span>{!dateiUrl ? "Zuerst Datei hochladen" : `Kreditkarte — ${gesamtPreis.toFixed(2)} €`}</span>
              </>
            )}
          </button>

          {/* PayPal */}
          <button
            onClick={handlePayPal}
            disabled={!dateiUrl || ladeVorgang !== null}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              dateiUrl && !ladeVorgang
                ? "bg-[#FFC439] hover:bg-[#f0b429] text-[#003087]"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            {ladeVorgang === "paypal" ? "Wird verarbeitet..." : (
              <>
                <span className="font-black text-[#003087]">Pay</span>
                <span className="font-black text-[#009cde]">Pal</span>
                {dateiUrl && <span className="text-[#003087]">— {gesamtPreis.toFixed(2)} €</span>}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
