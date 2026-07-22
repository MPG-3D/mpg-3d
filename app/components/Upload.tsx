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
  surfaceArea: string
  boundingBox: {
    width: string
    height: string
    depth: string
  }
  faceCount: number
  vertexCount: number
  isManifold: boolean
  dimensions: {
    x: string
    y: string
    z: string
  }
  printTime: {
    hours: string
    minutes: string
    layers: number
  }
  supportAnalysis: {
    needsSupport: boolean
    overhangArea: string
    supportVolume: string
    criticalOverhangs: number
  }
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
    if (!dateiUrl || !name || !email) {
      alert("Bitte Name, Email und STL-Datei angeben.")
      return
    }
    setAnalysing(true)
    try {
      // Zuerst echte STL-Analyse durchführen
      const stlRes = await fetch("/api/analyze-stl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: dateiUrl }),
      })
      const stlData = await stlRes.json()
      
      if (!stlData.success) {
        alert(stlData.error || "Fehler bei der STL-Analyse")
        return
      }

      const stlAnalysis = stlData.analysis
      
      // Berechnungen basierend auf echter Geometrie
      const volume = parseFloat(stlAnalysis.volume) // mm³
      const volumeCm3 = volume / 1000 // cm³
      
      // Dichte basierend auf Material
      const densityMap: Record<string, number> = {
        "PLA Standard": 1.24,
        "PLA+ Premium": 1.24,
        PETG: 1.27,
        ABS: 1.04,
        "TPU Flexibel": 1.21,
      }
      const density = densityMap[material.name] ?? 1.24
      const weight = volumeCm3 * density // g
      
      // Echte Druckzeit aus API nutzen
      const printHours = parseFloat(stlAnalysis.printTime.hours) + parseFloat(stlAnalysis.printTime.minutes) / 60
      
      // Echte Support-Analyse aus API nutzen
      const supportNeeded = stlAnalysis.supportAnalysis.needsSupport
      const supportVolume = parseFloat(stlAnalysis.supportAnalysis.supportVolume)
      
      // Preisberechnung
      const materialCost = weight * 0.08
      const printCost = printHours * 2.5
      const supportCost = supportNeeded ? (supportVolume * 0.08 + 4) : 0
      const shipping = 5
      const totalPrice = materialCost + printCost + supportCost + shipping

      const analysis: Analysis = {
        ...stlAnalysis,
        weight: weight.toFixed(2),
        printHours: printHours.toFixed(1),
        supportNeeded,
        price: Math.max(totalPrice, 9.99).toFixed(2),
      }

      setAnalysis(analysis)

      // Anfrage an Server senden
      await fetch("/api/request", {
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
          volume: volumeCm3.toFixed(2),
          weight: weight.toFixed(2),
          printHours: printHours.toFixed(1),
          price: Math.max(totalPrice, 9.99).toFixed(2),
        }),
      })
    } catch (error) {
      console.error("Analyse error:", error)
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
          <div className="mt-6 bg-blue-950/40 border border-blue-500/20 rounded-xl p-5 space-y-4">
            <h3 className="text-blue-400 font-bold text-lg">📊 Echte STL-Analyse</h3>
            
            {/* Hauptmetriken */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-black/30 rounded-xl p-3">
                <p className="text-gray-500">Volumen</p>
                <p className="font-bold text-white">{(parseFloat(analysis.volume) / 1000).toFixed(2)} cm³</p>
              </div>
              <div className="bg-black/30 rounded-xl p-3">
                <p className="text-gray-500">Gewicht</p>
                <p className="font-bold text-white">{analysis.weight} g</p>
              </div>
              <div className="bg-black/30 rounded-xl p-3">
                <p className="text-gray-500">Druckzeit</p>
                <p className="font-bold text-white">{analysis.printTime.hours}h {analysis.printTime.minutes}min</p>
              </div>
              <div className="bg-black/30 rounded-xl p-3">
                <p className="text-gray-500">Support</p>
                <p className="font-bold text-white">{analysis.supportAnalysis.needsSupport ? "Ja ⚠️" : "Nein ✓"}</p>
              </div>
            </div>

            {/* Erweiterte Metriken */}
            <div className="border-t border-blue-500/20 pt-3">
              <p className="text-gray-400 text-xs mb-2 font-semibold">Erweiterte Geometrie-Analyse</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-black/20 rounded-lg p-2">
                  <p className="text-gray-500">Oberfläche</p>
                  <p className="font-bold text-white">{(parseFloat(analysis.surfaceArea) / 100).toFixed(2)} cm²</p>
                </div>
                <div className="bg-black/20 rounded-lg p-2">
                  <p className="text-gray-500">Faces</p>
                  <p className="font-bold text-white">{analysis.faceCount.toLocaleString()}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-2">
                  <p className="text-gray-500">Vertices</p>
                  <p className="font-bold text-white">{analysis.vertexCount.toLocaleString()}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-2">
                  <p className="text-gray-500">Manifold</p>
                  <p className="font-bold text-white">{analysis.isManifold ? "Ja ✓" : "Nein ⚠️"}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-2">
                  <p className="text-gray-500">Layers</p>
                  <p className="font-bold text-white">{analysis.printTime.layers.toLocaleString()}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-2">
                  <p className="text-gray-500">Kritische Overhangs</p>
                  <p className="font-bold text-white">{analysis.supportAnalysis.criticalOverhangs}</p>
                </div>
              </div>
            </div>

            {/* Support Details */}
            {analysis.supportAnalysis.needsSupport && (
              <div className="border-t border-blue-500/20 pt-3">
                <p className="text-gray-400 text-xs mb-2 font-semibold">Support-Analyse</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-black/20 rounded-lg p-2">
                    <p className="text-gray-500">Overhang-Fläche</p>
                    <p className="font-bold text-white">{analysis.supportAnalysis.overhangArea} cm²</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2">
                    <p className="text-gray-500">Support-Volumen</p>
                    <p className="font-bold text-white">{analysis.supportAnalysis.supportVolume} cm³</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bounding Box */}
            <div className="border-t border-blue-500/20 pt-3">
              <p className="text-gray-400 text-xs mb-2 font-semibold">Abmessungen (mm)</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-black/20 rounded-lg p-2 text-center">
                  <p className="text-gray-500">X</p>
                  <p className="font-bold text-white">{analysis.dimensions.x} mm</p>
                </div>
                <div className="bg-black/20 rounded-lg p-2 text-center">
                  <p className="text-gray-500">Y</p>
                  <p className="font-bold text-white">{analysis.dimensions.y} mm</p>
                </div>
                <div className="bg-black/20 rounded-lg p-2 text-center">
                  <p className="text-gray-500">Z</p>
                  <p className="font-bold text-white">{analysis.dimensions.z} mm</p>
                </div>
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
