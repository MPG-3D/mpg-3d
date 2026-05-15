"use client"
import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await signIn("credentials", { email, password, redirect: false })
    if (res?.error) setError("Falsche Email oder Passwort")
    else router.push("/")
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6">Login</h1>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700" required />
          <input type="password" placeholder="Passwort" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700" required />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold">
            Einloggen
          </button>
        </form>
        <p className="text-gray-400 mt-4 text-center">
          Noch kein Konto? <a href="/register" className="text-blue-400 hover:underline">Registrieren</a>
        </p>
      </div>
    </div>
  )
}
