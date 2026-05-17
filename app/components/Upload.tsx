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

interface Analysis {
  volume: string
  weight: string
  printHours: string
  supportNeeded: boolean
  price: string
}

export default function Upload() {
  const [dateiUrl, setDateiUrl] = useState<string | null>(null)
  const [dateiName, setDateiName] = useState<string | null>(null)
  const [dateiSize, setDateiSize] = useState<number | null>(null)
  const [material, setMaterial] = useState(MATERIALIEN[0])
  const [menge, setMenge] = useState(1)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [description, setDescription] = useState("")
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [analysing, setAnalysing] = useState(false)
  const [ladeVorgang, setLadeVorgang] = useState<"stripe" | "paypal" | null>(null)

  const berechneterPreis = analysis
    ? (parseFloat(analysis.price) * menge).toFixed(2)
    : ((15 + material.preis * 100) * menge).toFixed(2)

  const analyseAnfordern = async () => {
    if (!dateiSize || !name || !email) {
      alert("Bitte Name, Email und STL-Datei angeben.")
      return
    }
    setAnalysing(true)
    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          material: material.name,
          description: description || "STL Upload Anfrage",
          fileSize: dateiSize,
          fileUrl: dateiUrl,
        }),
      })
      const data = await res.json()
      if (data.analysis) setAnalysis(data.analysis)
      else alert(data.error || "Fehler bei der Analyse")
    } catch {
      alert("Fehler bei der Analyse")
    } finally {
      setAnalysing(false)
    }
  }

  const handleStripe = async () => {
    setLadeVorgang("stripe")
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(berechneterPreis), orderId: Date.now() }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert("Fehler beim Bezahlen.")
    } finally {
      setLadeVorgang(null)
    }
  }

  const handlePayPal = async () => {
    setLadeVorgang("paypal")
    try {
      const res = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(berechneterPreis), orderId: Date.now() }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert("Fehler beim PayPal-Bezahlen.")
    } finally {
      setLadeVorgang(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">

      {/* Schritt 1: Upload */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">1. STL / OBJ Datei hochladen</h2>
        {!dateiUrl ? (
          <UploadButton<OurFileRouter, "modelUploader">
            endpoint="modelUploader"
            onClientUploadComplete={(res) => {
              setDateiUrl(res[0].url)
              setDateiName(res[0].name)
              setDateiSize(res[0].size)
              setAnalysis(null)
            }}
            onUploadError={(error: Error) => alert(error.message)}
            appearance={{
              button: "bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl w-full",
            }}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-green-900/30 border border-green-700 rounded-xl p-4">
              <span className="text-green-400 text-2xl">✓</span>
              <div className="flex-1">
                <p className="text-green-400 font-semibold">Datei hochgeladen!</p>
                <p className="text-gray-400 text-sm">{dateiName} — {dateiSize ? (dateiSize / 1024).toFixed(0) : "?"} KB</p>
              </div>
              <button
                onClick={() => { setDateiUrl(null); setDateiName(null); setDateiSize(null); setAnalysis(null) }}
                className="text-gray-500 hover:text-white text-sm"
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

      {/* Schritt 2: Material & Menge */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">2. Material & Menge</h2>
        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Material</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MATERIALIEN.map((m) => (
                <button
                  key={m.name}
                  onClick={() => { setMaterial(m); setAnalysis(null) }}
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
              <button onClick={() => setMenge(Math.max(1, menge - 1))} className="w-10 h-10 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-700">−</button>
              <span className="text-white text-xl font-bold w-8 text-center">{menge}</span>
              <button onClick={() => setMenge(Math.min(99, menge + 1))} className="w-10 h-10 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-700">+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Schritt 3: Kontaktdaten & Analyse */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">3. Deine Daten & Analyse</h2>
        <div className="space-y-3">
          <input
            type="text" placeholder="Dein Name *" value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700"
          />
          <input
            type="email" placeholder="Email *" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700"
          />
          <input
            type="text" placeholder="Telefon (optional)" value={phone} onChange={e => setPhone(e.target.value)}
            className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700"
          />
          <textarea
            placeholder="Beschreibung / Sonderwünsche" value={description} onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 resize-none"
          />
          <button
            onClick={analyseAnfordern}
            disabled={!dateiUrl || !name || !email || analysing}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              dateiUrl && name && email && !analysing
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            {analysing ? "⏳ Analysiere STL..." : "🔍 STL analysieren & Preis berechnen"}
          </button>
        </div>

        {/* Analyse Ergebnis */}
        {analysis && (
          <div className="mt-6 bg-blue-950/40 border border-blue-500/20 rounded-xl p-5 space-y-3">
            <h3 className="text-blue-400 font-bold text-lg">📊 Analyse Ergebnis</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-black/30 rounded-xl p-3">
                <p className="text-gray-500">Volumen</p>
                <p className="font-bold text-white">{analysis.volume} cm³</p>
              </div>
              <div className="bg-black/30 rounded-xl p-3">
                <p className="text-gray-500">Gewicht</p>
                <p className="font-bold text-white">{analysis.weight} g</p>
              </div>
              <div className="bg-black/30 rounded-xl p-3">
                <p className="text-gray-500">Druckzeit</p>
                <p className="font-bold text-white">{analysis.printHours} h</p>
              </div>
              <div className="bg-black/30 rounded-xl p-3">
                <p className="text-gray-500">Support</p>
                <p className="font-bold text-white">{analysis.supportNeeded ? "Ja ⚠️" : "Nein ✓"}</p>
              </div>
            </div>
            <div className="border-t border-blue-500/20 pt-3 flex justify-between items-center">
              <span className="text-gray-400">Geschätzter Preis {menge > 1 ? `× ${menge}` : ""}</span>
              <span className="text-3xl font-black text-blue-400">{berechneterPreis} €</span>
            </div>
            <p className="text-green-400 text-xs">✓ Preisschätzung per Email gesendet</p>
          </div>
        )}
      </div>

      {/* Schritt 4: Bezahlen */}
      {analysis && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-3">
          <h2 className="text-xl font-bold text-white mb-4">4. Jetzt bezahlen</h2>
          <button
            onClick={handleStripe}
            disabled={ladeVorgang !== null}
            className="w-full py-4 rounded-xl font-bold text-lg bg-blue-600 hover:bg-blue-500 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {ladeVorgang === "stripe" ? "⏳ Wird verarbeitet..." : <>💳 Kreditkarte — {berechneterPreis} €</>}
          </button>
          <button
            onClick={handlePayPal}
            disabled={ladeVorgang !== null}
            className="w-full py-4 rounded-xl font-bold text-lg bg-[#FFC439] hover:bg-[#f0b429] transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {ladeVorgang === "paypal" ? (
              <span className="text-[#003087]">⏳ Wird verarbeitet...</span>
            ) : (
              <>
                <span className="font-black text-[#003087]">Pay</span>
                <span className="font-black text-[#009cde]">Pal</span>
                <span className="text-[#003087]">— {berechneterPreis} €</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
