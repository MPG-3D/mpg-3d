"use client"

import { useState } from "react"
import Image from "next/image"
import Upload from "./components/Upload"

import {
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs"

export default function Home() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [material, setMaterial] = useState("PLA")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const [cartCount, setCartCount] = useState(0)
  const [mobileMenu, setMobileMenu] = useState(false)

  const sendRequest = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          material,
          description,
        }),
      })

      if (!response.ok) {
        throw new Error("Fehler beim Senden")
      }

      alert("Anfrage erfolgreich gesendet!")

      setName("")
      setEmail("")
      setPhone("")
      setDescription("")
      setMaterial("PLA")
    } catch (err) {
      console.error(err)
      alert("Fehler beim Senden")
    } finally {
      setLoading(false)
    }
  }

  const products = [
    {
      image: "/logo.png",
      title: "Gaming Zubehör",
      price: "19€",
      category: "Gaming",
    },
    {
      image: "/logo.png",
      title: "Custom Figuren",
      price: "29€",
      category: "Figuren",
    },
    {
      image: "/logo.png",
      title: "RGB Setup",
      price: "39€",
      category: "RGB",
    },
  ]

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">

      {/* BACKGROUND */}

      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_50%)]" />

      {/* NAVBAR */}

      <header className="fixed top-0 left-0 w-full z-50 border-b border-blue-500/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">

          {/* LOGO */}

          <div className="flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="MPG-3D"
              width={65}
              height={65}
              priority
              className="drop-shadow-[0_0_30px_rgba(37,99,235,0.7)]"
            />

            <div>
              <h1 className="text-3xl font-black tracking-tight">
                MPG-3D
              </h1>

              <p className="text-blue-400 text-sm">
                Premium 3D Druck
              </p>
            </div>
          </div>

          {/* DESKTOP NAV */}

          <nav className="hidden md:flex items-center gap-8 text-gray-300">

            <a href="#services" className="hover:text-blue-400 transition">
              Services
            </a>

            <a href="#upload" className="hover:text-blue-400 transition">
              Upload
            </a>

            <a href="#shop" className="hover:text-blue-400 transition">
              Shop
            </a>

            <a href="#kontakt" className="hover:text-blue-400 transition">
              Kontakt
            </a>

            {/* AUTH */}

            <div className="flex items-center gap-4">

              <SignInButton mode="modal">
                <button className="bg-white text-black px-5 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
                  Login
                </button>
              </SignInButton>

              <SignUpButton mode="modal">
                <button className="bg-blue-600 px-5 py-3 rounded-xl font-bold hover:bg-blue-500 transition">
                  Registrieren
                </button>
              </SignUpButton>

              <UserButton />

            </div>

            {/* CART */}

            <button className="relative bg-blue-600 hover:bg-blue-500 transition px-5 py-3 rounded-xl">
              🛒

              <span className="absolute -top-2 -right-2 bg-white text-black text-xs font-black rounded-full w-6 h-6 flex items-center justify-center">
                {cartCount}
              </span>
            </button>

          </nav>

          {/* MOBILE BUTTON */}

          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden text-2xl"
          >
            {mobileMenu ? "✕" : "☰"}
          </button>

        </div>

        {/* MOBILE MENU */}

        {mobileMenu && (
          <div className="md:hidden bg-black border-t border-blue-500/10 px-6 py-8 flex flex-col gap-6 text-lg">

            <a href="#services">Services</a>
            <a href="#upload">Upload</a>
            <a href="#shop">Shop</a>
            <a href="#kontakt">Kontakt</a>

          </div>
        )}
      </header>

      {/* HERO */}

      <section className="relative pt-56 pb-40 px-6 border-b border-blue-500/10 overflow-hidden">

        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[1000px] h-[1000px] bg-blue-600/10 blur-[200px] rounded-full" />

        <div className="relative max-w-6xl mx-auto text-center">

          <div className="flex justify-center mb-12">
            <Image
              src="/logo.png"
              alt="MPG-3D"
              width={180}
              height={180}
              priority
              className="drop-shadow-[0_0_60px_rgba(37,99,235,0.8)]"
            />
          </div>

          <h1 className="text-7xl md:text-9xl font-black tracking-tight leading-none">
            MPG-3D
          </h1>

          <p className="text-gray-300 text-2xl md:text-3xl max-w-5xl mx-auto mt-10 leading-relaxed">
            Professioneller 3D-Druck Service aus Deutschland.
          </p>

        </div>

      </section>

      {/* SERVICES */}

      <section
        id="services"
        className="py-32 px-6 border-t border-blue-500/10"
      >

        <div className="max-w-7xl mx-auto">

          <h2 className="text-6xl font-black text-center mb-24">
            MPG-3D Services
          </h2>

          <div className="grid md:grid-cols-3 gap-10">

            <div className="bg-gradient-to-b from-blue-950/40 to-black border border-blue-500/10 rounded-3xl p-10">
              <div className="text-6xl mb-8">🎮</div>

              <h3 className="text-3xl font-black mb-6">
                Gaming Zubehör
              </h3>

              <p className="text-gray-400 text-lg leading-relaxed">
                Individuelle Controller Ständer,
                RGB Zubehör und Gaming Dekorationen.
              </p>
            </div>

            <div className="bg-gradient-to-b from-blue-950/40 to-black border border-blue-500/10 rounded-3xl p-10">
              <div className="text-6xl mb-8">🧸</div>

              <h3 className="text-3xl font-black mb-6">
                Figuren & Modelle
              </h3>

              <p className="text-gray-400 text-lg leading-relaxed">
                Sammlermodelle und individuelle Designs.
              </p>
            </div>

            <div className="bg-gradient-to-b from-blue-950/40 to-black border border-blue-500/10 rounded-3xl p-10">
              <div className="text-6xl mb-8">🛠️</div>

              <h3 className="text-3xl font-black mb-6">
                Design Service
              </h3>

              <p className="text-gray-400 text-lg leading-relaxed">
                Keine STL-Datei? MPG-3D erstellt dein Modell.
              </p>
            </div>

          </div>

        </div>

      </section>

      {/* SHOP */}

      <section
        id="shop"
        className="border-t border-blue-500/10 py-32 px-6"
      >

        <div className="max-w-7xl mx-auto">

          <h2 className="text-6xl font-black text-center mb-24">
            Shop
          </h2>

          <div className="grid md:grid-cols-3 gap-10">

            {products.map((product, index) => (

              <div
                key={index}
                className="bg-gradient-to-b from-blue-950/40 to-black border border-blue-500/10 rounded-3xl overflow-hidden"
              >

                <div className="relative h-80">

                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />

                </div>

                <div className="p-8">

                  <div className="text-blue-400 mb-3">
                    {product.category}
                  </div>

                  <h3 className="text-3xl font-black">
                    {product.title}
                  </h3>

                  <div className="text-2xl font-black mt-4">
                    {product.price}
                  </div>

                  <button
                    onClick={() => setCartCount(cartCount + 1)}
                    className="mt-8 w-full bg-blue-600 hover:bg-blue-500 transition py-4 rounded-2xl font-black"
                  >
                    In Warenkorb
                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* UPLOAD */}

      <section
        id="upload"
        className="border-t border-blue-500/10 py-32 px-6"
      >

        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-16">

            <h2 className="text-6xl font-black">
              Auftrag erstellen
            </h2>

          </div>

          <div className="bg-gradient-to-b from-blue-950/30 to-black border border-blue-500/10 rounded-[40px] p-10 md:p-16">

            <div className="grid md:grid-cols-2 gap-8">

              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-black border border-blue-500/10 p-5 rounded-2xl"
              />

              <input
                type="email"
                placeholder="E-Mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black border border-blue-500/10 p-5 rounded-2xl"
              />

            </div>

            <input
              type="text"
              placeholder="Telefonnummer"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-black border border-blue-500/10 p-5 rounded-2xl w-full mt-8"
            />

            <select
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="bg-black border border-blue-500/10 p-5 rounded-2xl w-full mt-8"
            >
              <option value="PLA">PLA</option>
              <option value="PETG">PETG</option>
              <option value="ABS">ABS</option>
              <option value="Resin">Resin</option>
            </select>

            <textarea
              placeholder="Beschreibe dein Wunschprodukt..."
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-black border border-blue-500/10 p-5 rounded-2xl w-full mt-8"
            />

            <div className="mt-12">
              <Upload />
            </div>

            <button
              onClick={sendRequest}
              disabled={loading}
              className="mt-12 w-full bg-blue-600 hover:bg-blue-500 transition py-6 rounded-2xl font-black text-xl"
            >
              {loading ? "Sende Anfrage..." : "Auftrag absenden"}
            </button>

          </div>

        </div>

      </section>

      {/* FOOTER */}

      <footer
        id="kontakt"
        className="border-t border-blue-500/10 py-20 px-6"
      >

        <div className="max-w-7xl mx-auto text-center">

          <h3 className="text-4xl font-black mb-4">
            MPG-3D
          </h3>

          <p className="text-gray-400 text-lg">
            Premium 3D Druck Service aus Deutschland
          </p>

          <div className="mt-10 text-gray-500">
            © 2026 MPG-3D — Alle Rechte vorbehalten
          </div>

        </div>

      </footer>

    </main>
  )
}