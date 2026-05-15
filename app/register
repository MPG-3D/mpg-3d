"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error)
    else router.push("/login")
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6">Registrieren</h1>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700" />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700" required />
          <input type="password" placeholder="Passwort" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700" required />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold">
            Konto erstellen
          </button>
        </form>
        <p className="text-gray-400 mt-4 text-center">
          Bereits registriert? <a href="/login" className="text-blue-400 hover:underline">Einloggen</a>
        </p>
      </div>
    </div>
  )
}
