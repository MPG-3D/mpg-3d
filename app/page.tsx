"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import Upload from "./components/Upload"
import { useSession, signOut } from "next-auth/react"
import dynamic from "next/dynamic"

const Reviews = dynamic(() => import("./components/Reviews"), { ssr: false })

const MATERIALIEN = [
  { name: "PLA Standard", preis: 15 },
  { name: "PLA+ Premium", preis: 20 },
  { name: "PETG", preis: 22 },
  { name: "ABS", preis: 25 },
  { name: "TPU Flexibel", preis: 30 },
  { name: "Resin", preis: 35 },
]

const RABATTCODES: Record<string, number> = {
  "MPG10": 10,
  "SOMMER20": 20,
  "VIP50": 50,
}

export default function Home() {
  const router = useRouter()
  const { data: session } = useSession()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [material, setMaterial] = useState("PLA")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [rabattCode, setRabattCode] = useState("")
  const [rabattProzent, setRabattProzent] = useState(0)
  const [rabattFehler, setRabattFehler] = useState("")
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [paypalLoading, setPaypalLoading] = useState(false)
  const [sprache, setSprache] = useState<"de" | "en">("de")

  const [cart, setCart] = useState<{ title: string; price: number; menge: number }[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])

  const toggleWishlist = (title: string) => {
    setWishlist(prev => {
      const next = prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
      localStorage.setItem("mpg3d-wishlist", JSON.stringify(next))
      return next
    })
  }

  const cartCount = cart.reduce((sum, item) => sum + item.menge, 0)
  const cartRaw = cart.reduce((sum, item) => sum + item.price * item.menge, 0)
  const cartTotal = cartRaw * (1 - rabattProzent / 100)

  const addToCart = (product: { title: string; price: number }) => {
    setCart(prev => {
      const existing = prev.find(i => i.title === product.title)
      const next = existing
        ? prev.map(i => i.title === product.title ? { ...i, menge: i.menge + 1 } : i)
        : [...prev, { ...product, menge: 1 }]
      localStorage.setItem("mpg3d-cart", JSON.stringify(next))
      return next
    })
  }

  const removeFromCart = (title: string) => {
    setCart(prev => {
      const next = prev.filter(i => i.title !== title)
      localStorage.setItem("mpg3d-cart", JSON.stringify(next))
      return next
    })
  }

  const pruefeRabatt = () => {
    const code = rabattCode.toUpperCase()
    if (RABATTCODES[code]) {
      setRabattProzent(RABATTCODES[code])
      setRabattFehler("")
    } else {
      setRabattFehler(sprache === "de" ? "Ungültiger Code" : "Invalid code")
      setRabattProzent(0)
    }
  }

  const sendRequest = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, material, description }),
      })
      if (!response.ok) throw new Error("Fehler beim Senden")
      alert(sprache === "de" ? "Anfrage erfolgreich gesendet!" : "Request sent successfully!")
      setName(""); setEmail(""); setPhone(""); setDescription(""); setMaterial("PLA")
    } catch (error) {
      console.error(error)
      alert(sprache === "de" ? "Fehler beim Senden" : "Error sending request")
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return
    setCheckoutLoading(true)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: cartTotal, orderId: Date.now() }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (error) {
      alert(sprache === "de" ? "Fehler beim Bezahlen." : "Payment error.")
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handlePayPalCheckout = async () => {
    if (cart.length === 0) return
    setPaypalLoading(true)
    try {
      const res = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: cartTotal, orderId: Date.now() }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (error) {
      alert(sprache === "de" ? "Fehler beim PayPal-Bezahlen." : "PayPal payment error.")
    } finally {
      setPaypalLoading(false)
    }
  }

  const products = [
    { image: "/logo.png", title: "Controller Stand", price: 19, category: "Gaming", desc: sprache === "de" ? "Passend für PS5 & Xbox, stabiler Standfuß" : "Fits PS5 & Xbox, stable base stand" },
    { image: "/logo.png", title: "Headset Holder", price: 22, category: "Gaming", desc: sprache === "de" ? "Wandmontierter Headset-Halter aus PETG" : "Wall-mounted headset holder in PETG" },
    { image: "/logo.png", title: "Joy-Con Rail", price: 14, category: "Gaming", desc: sprache === "de" ? "Ersatz-Schiene für Nintendo Switch" : "Replacement rail for Nintendo Switch" },
    { image: "/logo.png", title: "PS5 Lüftergitter", price: 18, category: "Gaming", desc: sprache === "de" ? "Schutzgitter für PS5 Lüftungsschlitze" : "Protective grille for PS5 vents" },
    { image: "/logo.png", title: "Xbox Akku Cover", price: 15, category: "Gaming", desc: sprache === "de" ? "Ersatz-Akkudeckel für Xbox Controller" : "Replacement battery cover for Xbox controller" },
    { image: "/logo.png", title: "Tastatur Füße", price: 12, category: "Setup", desc: sprache === "de" ? "Rutschfeste Erhöhungsfüße für Tastaturen" : "Non-slip elevation feet for keyboards" },
    { image: "/logo.png", title: "Maus Bungee", price: 16, category: "Setup", desc: sprache === "de" ? "Kabelführung für Gaming-Mäuse" : "Cable management for gaming mice" },
    { image: "/logo.png", title: "Kabel Clips", price: 10, category: "Setup", desc: sprache === "de" ? "Ordnung auf dem Schreibtisch" : "Cable organization for your desk" },
    { image: "/logo.png", title: "Monitor Halter", price: 24, category: "Setup", desc: sprache === "de" ? "Stabile Tischhalterung für Monitore" : "Stable desk mount for monitors" },
    { image: "/logo.png", title: "RGB Halterung", price: 19, category: "Setup", desc: sprache === "de" ? "LED-Streifen Halterung für Monitor-Rückseite" : "LED strip holder for monitor back" },
    { image: "/logo.png", title: "Schrank Clip", price: 10, category: "Haushalt", desc: sprache === "de" ? "Clip zum Nachrüsten von Schranktüren" : "Retrofit clip for cabinet doors" },
    { image: "/logo.png", title: "Kühlschrank Griff", price: 15, category: "Haushalt", desc: sprache === "de" ? "Ersatzgriff für Kühlschranktüren" : "Replacement handle for fridge doors" },
    { image: "/logo.png", title: "Staubsauger Adapter", price: 18, category: "Haushalt", desc: sprache === "de" ? "Adapter für verschiedene Sauger-Aufsätze" : "Adapter for various vacuum attachments" },
    { image: "/logo.png", title: "Waschmaschinen Knopf", price: 14, category: "Haushalt", desc: sprache === "de" ? "Ersatz-Drehknopf für Waschmaschinen" : "Replacement rotary knob for washing machines" },
    { image: "/logo.png", title: "Fenster Clip", price: 9, category: "Haushalt", desc: sprache === "de" ? "Halteclip für Fensterrahmen" : "Mounting clip for window frames" },
    { image: "/logo.png", title: "Duschhalter", price: 16, category: "Haushalt", desc: sprache === "de" ? "Wandhalterung für Duschkopf oder Seife" : "Wall mount for shower head or soap" },
    { image: "/logo.png", title: "Türstopper", price: 12, category: "Haushalt", desc: sprache === "de" ? "Runder Türstopper, bodenständig" : "Round door stopper, floor-standing" },
    { image: "/logo.png", title: "Haken System", price: 14, category: "Haushalt", desc: sprache === "de" ? "Modulare Wandhaken für Küche & Flur" : "Modular wall hooks for kitchen & hallway" },
    { image: "/logo.png", title: "Möbel Verbinder", price: 13, category: "Haushalt", desc: sprache === "de" ? "Verbindungsstück für Möbelplatten" : "Connector piece for furniture boards" },
    { image: "/logo.png", title: "Schubladen Rolle", price: 11, category: "Haushalt", desc: sprache === "de" ? "Ersatzrolle für Schubladensysteme" : "Replacement roller for drawer systems" },
    { image: "/logo.png", title: "Getränkehalter Clip", price: 16, category: "Auto", desc: sprache === "de" ? "Clip-Getränkehalter für Armlehne" : "Clip-on cup holder for armrest" },
    { image: "/logo.png", title: "Lüftungsgitter Clip", price: 9, category: "Auto", desc: sprache === "de" ? "Befestigungsclip für Kfz-Lüftungsgitter" : "Mounting clip for car AC vents" },
    { image: "/logo.png", title: "Handyhalter Adapter", price: 15, category: "Auto", desc: sprache === "de" ? "Universeller Handy-Adapter fürs Auto" : "Universal phone adapter for car mount" },
    { image: "/logo.png", title: "Schlüssel Gehäuse", price: 14, category: "Auto", desc: sprache === "de" ? "Ersatz-Schlüsselgehäuse für Kfz" : "Replacement key housing for vehicles" },
    { image: "/logo.png", title: "Armlehnen Clip", price: 12, category: "Auto", desc: sprache === "de" ? "Clip für Armlehnen-Verkleidungen" : "Clip for armrest panels" },
    { image: "/logo.png", title: "Kabelhalter Auto", price: 10, category: "Auto", desc: sprache === "de" ? "Kabelclip für Fahrzeuginnenraum" : "Cable clip for vehicle interior" },
    { image: "/logo.png", title: "Kofferraum Haken", price: 14, category: "Auto", desc: sprache === "de" ? "Einkaufstaschen-Haken für Kofferraum" : "Shopping bag hook for car trunk" },
    { image: "/logo.png", title: "Innenraum Abdeckung", price: 18, category: "Auto", desc: sprache === "de" ? "Ersatz-Abdeckung für Kfz-Innenraum" : "Replacement cover for car interior" },
    { image: "/logo.png", title: "Spiegel Clip", price: 9, category: "Auto", desc: sprache === "de" ? "Befestigungsclip für Außenspiegel" : "Fixing clip for exterior mirrors" },
    { image: "/logo.png", title: "Sonnenblenden Halter", price: 11, category: "Auto", desc: sprache === "de" ? "Halter für Sonnenschutz-Zubehör" : "Holder for sun visor accessories" },
    { image: "/logo.png", title: "GPU Halter", price: 24, category: "PC", desc: sprache === "de" ? "Anti-Sag Stütze für schwere Grafikkarten" : "Anti-sag support for heavy GPUs" },
    { image: "/logo.png", title: "SSD Halter", price: 18, category: "PC", desc: sprache === "de" ? "Halterung für 2,5 Zoll SSDs" : "Bracket for 2.5 inch SSDs" },
    { image: "/logo.png", title: "Lüfter Spacer", price: 16, category: "PC", desc: sprache === "de" ? "Abstandshalter für 120mm Gehäuselüfter" : "Spacer for 120mm case fans" },
    { image: "/logo.png", title: "Kabelkamm", price: 15, category: "PC", desc: sprache === "de" ? "Kabelführung für ordentliches PC-Inneres" : "Cable comb for clean PC build" },
    { image: "/logo.png", title: "Raspberry Pi Case", price: 22, category: "PC", desc: sprache === "de" ? "Gehäuse für Raspberry Pi 4/5" : "Case for Raspberry Pi 4/5" },
    { image: "/logo.png", title: "Mini PC Halter", price: 25, category: "PC", desc: sprache === "de" ? "VESA-Wandhalterung für Mini-PCs" : "VESA wall mount for mini PCs" },
    { image: "/logo.png", title: "USB Halter", price: 12, category: "PC", desc: sprache === "de" ? "Halterung für USB-Hubs am Monitor" : "USB hub holder for monitor" },
    { image: "/logo.png", title: "Monitor Clip", price: 10, category: "PC", desc: sprache === "de" ? "Kabelclip für Monitor-Rückseite" : "Cable clip for monitor back" },
    { image: "/logo.png", title: "Netzteil Halter", price: 22, category: "PC", desc: sprache === "de" ? "Modular PSU Kabelhalter" : "Modular PSU cable holder" },
    { image: "/logo.png", title: "Router Wandhalter", price: 20, category: "PC", desc: sprache === "de" ? "Wandhalterung für WLAN-Router" : "Wall mount for WiFi router" },
  ]

  const bg = darkMode ? "bg-black text-white" : "bg-white text-black"
  const card = darkMode ? "bg-gradient-to-b from-blue-950/40 to-black border border-blue-500/10" : "bg-gradient-to-b from-blue-100 to-white border border-blue-200"
  const input = darkMode ? "bg-black border border-blue-500/10 text-white" : "bg-gray-100 border border-blue-200 text-black"
  const header = darkMode ? "bg-black/80 border-blue-500/10" : "bg-white/80 border-blue-200"

  return (
    <main className={`min-h-screen ${bg} overflow-hidden transition-colors duration-300`}>

      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_50%)]" />

      {/* NAVBAR */}
      <header className={`fixed top-0 left-0 w-full z-50 border-b ${header} backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="MPG-3D" width={65} height={65} priority className="drop-shadow-[0_0_30px_rgba(37,99,235,0.7)]" />
            <div>
              <h1 className="text-3xl font-black tracking-tight">MPG-3D</h1>
              <p className="text-blue-400 text-sm">Premium 3D Druck</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#services" className="hover:text-blue-400 transition">Services</a>
            <a href="#upload" className="hover:text-blue-400 transition">Upload</a>
            <a href="#shop" className="hover:text-blue-400 transition">Shop</a>
            <a href="#kontakt" className="hover:text-blue-400 transition">Kontakt</a>

            {/* Sprache */}
            <button onClick={() => setSprache(s => s === "de" ? "en" : "de")} className="px-3 py-1 rounded-lg border border-blue-500/30 text-sm font-bold hover:bg-blue-600/20 transition">
              {sprache === "de" ? "🇬🇧 EN" : "🇩🇪 DE"}
            </button>

            {/* Dark Mode */}
            <button onClick={() => setDarkMode(d => !d)} className="px-3 py-1 rounded-lg border border-blue-500/30 text-sm font-bold hover:bg-blue-600/20 transition">
              {darkMode ? "☀️" : "🌙"}
            </button>

            {/* Warenkorb */}
            <a
              href={cartCount > 0 ? "/checkout" : "#shop"}
              className={`relative transition px-5 py-3 rounded-xl ${cartCount > 0 ? "bg-blue-600 hover:bg-blue-500" : "bg-gray-800 hover:bg-gray-700"}`}
            >
              🛒
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-black text-xs font-black rounded-full w-6 h-6 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </a>

            {/* Login / Logout */}
            {session ? (
              <div className="flex items-center gap-3">
                <a href="/dashboard" className="px-3 py-1 rounded-lg border border-blue-500/30 text-sm font-bold hover:bg-blue-600/20 transition">
                  Mein Konto
                </a>
                {(session.user as any)?.role === "ADMIN" && (
                  <a href="/admin" className="px-3 py-1 rounded-lg border border-blue-500/30 text-sm font-bold hover:bg-blue-600/20 transition">
                    Admin
                  </a>
                )}
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-600/40 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <a href="/login" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition">
                Login
              </a>
            )}
          </nav>

          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-2xl">
            {mobileMenu ? "✕" : "☰"}
          </button>
        </div>

        {mobileMenu && (
          <div className={`md:hidden border-t ${darkMode ? "bg-black border-blue-500/10" : "bg-white border-blue-200"} px-6 py-8 flex flex-col gap-6 text-lg`}>
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
            <Image src="/logo.png" alt="MPG-3D" width={180} height={180} priority className="drop-shadow-[0_0_60px_rgba(37,99,235,0.8)]" />
          </div>
          <h1 className="text-7xl md:text-9xl font-black tracking-tight leading-none">MPG-3D</h1>
          <p className={`text-2xl md:text-3xl max-w-5xl mx-auto mt-10 leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            {sprache === "de" ? "Professioneller 3D-Druck Service aus Deutschland." : "Professional 3D printing service from Germany."}
          </p>
          <div className="flex justify-center gap-6 mt-12">
            <a href="#shop" className="bg-blue-600 hover:bg-blue-500 transition px-8 py-4 rounded-2xl font-black text-lg">
              {sprache === "de" ? "Jetzt bestellen" : "Order now"}
            </a>
            <a href="#upload" className={`border border-blue-500/30 hover:bg-blue-600/20 transition px-8 py-4 rounded-2xl font-black text-lg`}>
              {sprache === "de" ? "Datei hochladen" : "Upload file"}
            </a>
          </div>
        </div>
      </section>


      {/* MATERIALKOSTEN-RECHNER */}
      <section className="py-32 px-6 border-t border-blue-500/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-black text-center mb-16">
            {sprache === "de" ? "💰 Preisrechner" : "💰 Price Calculator"}
          </h2>
          <div className={`${card} rounded-3xl p-10`}>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className={`block mb-3 font-bold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {sprache === "de" ? "Material" : "Material"}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {MATERIALIEN.map(m => (
                    <button
                      key={m.name}
                      onClick={() => setMaterial(m.name)}
                      className={`p-3 rounded-xl border text-sm font-bold transition ${material === m.name ? "border-blue-500 bg-blue-600/20" : `border-blue-500/20 ${darkMode ? "hover:border-blue-500/50" : "hover:border-blue-400"}`}`}
                    >
                      {m.name}<br />
                      <span className="text-blue-400">{m.preis}€</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <div className={`${darkMode ? "bg-black/50" : "bg-gray-100"} rounded-2xl p-8 text-center`}>
                  <p className={`text-lg mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {sprache === "de" ? "Geschätzter Preis" : "Estimated price"}
                  </p>
                  <p className="text-5xl font-black text-blue-400">
                    {MATERIALIEN.find(m => m.name === material)?.preis ?? 15}€
                  </p>
                  <p className={`text-sm mt-2 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                    {sprache === "de" ? "inkl. Druck & Versand" : "incl. print & shipping"}
                  </p>
                </div>
                <a href="#upload" className="mt-6 bg-blue-600 hover:bg-blue-500 transition py-4 rounded-2xl font-black text-center">
                  {sprache === "de" ? "Jetzt bestellen →" : "Order now →"}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-32 px-6 border-t border-blue-500/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-6xl font-black text-center mb-24">
            {sprache === "de" ? "MPG-3D Services" : "MPG-3D Services"}
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { emoji: "🎮", title: sprache === "de" ? "Gaming Zubehör" : "Gaming Accessories", desc: sprache === "de" ? "Controller Ständer, RGB Zubehör und Gaming Dekorationen." : "Controller stands, RGB accessories and gaming decorations." },
              { emoji: "🧸", title: sprache === "de" ? "Figuren & Modelle" : "Figures & Models", desc: sprache === "de" ? "Sammlermodelle und individuelle Designs." : "Collector models and custom designs." },
              { emoji: "🛠️", title: sprache === "de" ? "Design Service" : "Design Service", desc: sprache === "de" ? "Keine STL-Datei? MPG-3D erstellt dein Modell." : "No STL file? MPG-3D creates your model." },
              { emoji: "⚡", title: sprache === "de" ? "Express Druck" : "Express Print", desc: sprache === "de" ? "24h Lieferung für dringende Bestellungen." : "24h delivery for urgent orders." },
              { emoji: "📦", title: sprache === "de" ? "Bulk Bestellungen" : "Bulk Orders", desc: sprache === "de" ? "Günstige Preise ab 10 Stück." : "Better prices from 10 pieces." },
              { emoji: "🏢", title: sprache === "de" ? "Firmenkunden" : "Business Clients", desc: sprache === "de" ? "API & White-Label Lösungen für Unternehmen." : "API & white-label solutions for businesses." },
            ].map((s, i) => (
              <div key={i} className={`${card} rounded-3xl p-10`}>
                <div className="text-6xl mb-8">{s.emoji}</div>
                <h3 className="text-3xl font-black mb-6">{s.title}</h3>
                <p className={`text-lg leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SHOP */}
      <section id="shop" className="border-t border-blue-500/10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-6xl font-black text-center mb-24">Shop</h2>

          {/* Controller Stand Featured */}
          <div className="mb-20">
            <h3 className="text-4xl font-black mb-10 text-blue-400">🎮 Controller Stand</h3>
            <div className="grid md:grid-cols-3 gap-10">
              {products.filter(p => p.title.includes("Controller Stand")).map((product, index) => (
                <div key={index} className={`${card} rounded-3xl overflow-hidden`}>
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400&q=80"
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-full">
                      {product.category}
                    </div>
                    <button
                      onClick={() => toggleWishlist(product.title)}
                      className="absolute top-4 left-4 text-2xl transition hover:scale-110"
                      title={wishlist.includes(product.title) ? "Von Wunschliste entfernen" : "Zur Wunschliste"}
                    >
                      {wishlist.includes(product.title) ? "❤️" : "🤍"}
                    </button>
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-black">{product.title}</h3>
                    <p className={`text-sm mt-2 mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{product.desc}</p>
                    <div className="text-2xl font-black text-blue-400 mt-2">{product.price}€</div>
                    <button
                      onClick={() => addToCart(product)}
                      className="mt-6 w-full bg-blue-600 hover:bg-blue-500 transition py-4 rounded-2xl font-black"
                    >
                      {sprache === "de" ? "In Warenkorb" : "Add to cart"}
                    </button>
                    <button
                      onClick={() => router.push(`/product/${product.title.toLowerCase().replace(/\s+/g, "-")}`)}
                      className="mt-3 w-full border border-blue-500/30 hover:bg-blue-600/20 transition py-3 rounded-2xl font-bold text-sm"
                    >
                      {sprache === "de" ? "📋 Produktinfo" : "📋 Product Info"}
                    </button>
                    <Reviews productId={product.title.toLowerCase().replace(/\s+/g, "-")} productName={product.title} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gaming */}
          <div className="mb-20">
            <h3 className="text-4xl font-black mb-10">🎮 Gaming</h3>
            <div className="grid md:grid-cols-3 gap-10">
              {products.filter(p => p.category === "Gaming" && !p.title.includes("Controller Stand")).map((product, index) => (
                <div key={index} className={`${card} rounded-3xl overflow-hidden`}>
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400&q=80"
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-full">
                      {product.category}
                    </div>
                    <button
                      onClick={() => toggleWishlist(product.title)}
                      className="absolute top-4 left-4 text-2xl transition hover:scale-110"
                      title={wishlist.includes(product.title) ? "Von Wunschliste entfernen" : "Zur Wunschliste"}
                    >
                      {wishlist.includes(product.title) ? "❤️" : "🤍"}
                    </button>
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-black">{product.title}</h3>
                    <p className={`text-sm mt-2 mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{product.desc}</p>
                    <div className="text-2xl font-black text-blue-400 mt-2">{product.price}€</div>
                    <button
                      onClick={() => addToCart(product)}
                      className="mt-6 w-full bg-blue-600 hover:bg-blue-500 transition py-4 rounded-2xl font-black"
                    >
                      {sprache === "de" ? "In Warenkorb" : "Add to cart"}
                    </button>
                    <button
                      onClick={() => router.push(`/product/${product.title.toLowerCase().replace(/\s+/g, "-")}`)}
                      className="mt-3 w-full border border-blue-500/30 hover:bg-blue-600/20 transition py-3 rounded-2xl font-bold text-sm"
                    >
                      {sprache === "de" ? "📋 Produktinfo" : "📋 Product Info"}
                    </button>
                    <Reviews productId={product.title.toLowerCase().replace(/\s+/g, "-")} productName={product.title} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Haushalt */}
          <div className="mb-20">
            <h3 className="text-4xl font-black mb-10">🏠 Haushalt</h3>
            <div className="grid md:grid-cols-3 gap-10">
              {products.filter(p => p.category === "Haushalt").map((product, index) => (
                <div key={index} className={`${card} rounded-3xl overflow-hidden`}>
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=400&q=80"
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-full">
                      {product.category}
                    </div>
                    <button
                      onClick={() => toggleWishlist(product.title)}
                      className="absolute top-4 left-4 text-2xl transition hover:scale-110"
                      title={wishlist.includes(product.title) ? "Von Wunschliste entfernen" : "Zur Wunschliste"}
                    >
                      {wishlist.includes(product.title) ? "❤️" : "🤍"}
                    </button>
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-black">{product.title}</h3>
                    <p className={`text-sm mt-2 mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{product.desc}</p>
                    <div className="text-2xl font-black text-blue-400 mt-2">{product.price}€</div>
                    <button
                      onClick={() => addToCart(product)}
                      className="mt-6 w-full bg-blue-600 hover:bg-blue-500 transition py-4 rounded-2xl font-black"
                    >
                      {sprache === "de" ? "In Warenkorb" : "Add to cart"}
                    </button>
                    <button
                      onClick={() => router.push(`/product/${product.title.toLowerCase().replace(/\s+/g, "-")}`)}
                      className="mt-3 w-full border border-blue-500/30 hover:bg-blue-600/20 transition py-3 rounded-2xl font-bold text-sm"
                    >
                      {sprache === "de" ? "📋 Produktinfo" : "📋 Product Info"}
                    </button>
                    <Reviews productId={product.title.toLowerCase().replace(/\s+/g, "-")} productName={product.title} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Auto */}
          <div className="mb-20">
            <h3 className="text-4xl font-black mb-10">🚗 Auto</h3>
            <div className="grid md:grid-cols-3 gap-10">
              {products.filter(p => p.category === "Auto").map((product, index) => (
                <div key={index} className={`${card} rounded-3xl overflow-hidden`}>
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&q=80"
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-full">
                      {product.category}
                    </div>
                    <button
                      onClick={() => toggleWishlist(product.title)}
                      className="absolute top-4 left-4 text-2xl transition hover:scale-110"
                      title={wishlist.includes(product.title) ? "Von Wunschliste entfernen" : "Zur Wunschliste"}
                    >
                      {wishlist.includes(product.title) ? "❤️" : "🤍"}
                    </button>
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-black">{product.title}</h3>
                    <p className={`text-sm mt-2 mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{product.desc}</p>
                    <div className="text-2xl font-black text-blue-400 mt-2">{product.price}€</div>
                    <button
                      onClick={() => addToCart(product)}
                      className="mt-6 w-full bg-blue-600 hover:bg-blue-500 transition py-4 rounded-2xl font-black"
                    >
                      {sprache === "de" ? "In Warenkorb" : "Add to cart"}
                    </button>
                    <button
                      onClick={() => router.push(`/product/${product.title.toLowerCase().replace(/\s+/g, "-")}`)}
                      className="mt-3 w-full border border-blue-500/30 hover:bg-blue-600/20 transition py-3 rounded-2xl font-bold text-sm"
                    >
                      {sprache === "de" ? "📋 Produktinfo" : "📋 Product Info"}
                    </button>
                    <Reviews productId={product.title.toLowerCase().replace(/\s+/g, "-")} productName={product.title} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Setup & PC */}
          <div className="mb-20">
            <h3 className="text-4xl font-black mb-10">⚙️ Setup & PC</h3>
            <div className="grid md:grid-cols-3 gap-10">
              {products.filter(p => p.category === "Setup" || p.category === "PC").map((product, index) => (
                <div key={index} className={`${card} rounded-3xl overflow-hidden`}>
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={product.category === "Setup" ? "https://images.unsplash.com/photo-1593640408182-31c228f06c69?w=400&q=80" : "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&q=80"}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-full">
                      {product.category}
                    </div>
                    <button
                      onClick={() => toggleWishlist(product.title)}
                      className="absolute top-4 left-4 text-2xl transition hover:scale-110"
                      title={wishlist.includes(product.title) ? "Von Wunschliste entfernen" : "Zur Wunschliste"}
                    >
                      {wishlist.includes(product.title) ? "❤️" : "🤍"}
                    </button>
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-black">{product.title}</h3>
                    <p className={`text-sm mt-2 mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{product.desc}</p>
                    <div className="text-2xl font-black text-blue-400 mt-2">{product.price}€</div>
                    <button
                      onClick={() => addToCart(product)}
                      className="mt-6 w-full bg-blue-600 hover:bg-blue-500 transition py-4 rounded-2xl font-black"
                    >
                      {sprache === "de" ? "In Warenkorb" : "Add to cart"}
                    </button>
                    <button
                      onClick={() => router.push(`/product/${product.title.toLowerCase().replace(/\s+/g, "-")}`)}
                      className="mt-3 w-full border border-blue-500/30 hover:bg-blue-600/20 transition py-3 rounded-2xl font-bold text-sm"
                    >
                      {sprache === "de" ? "📋 Produktinfo" : "📋 Product Info"}
                    </button>
                    <Reviews productId={product.title.toLowerCase().replace(/\s+/g, "-")} productName={product.title} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WARENKORB */}
          {cart.length > 0 && (
            <div className={`mt-16 ${card} rounded-3xl p-8`}>
              <h3 className="text-3xl font-black mb-6">🛒 {sprache === "de" ? "Warenkorb" : "Cart"}</h3>
              {cart.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-blue-500/10">
                  <div>
                    <p className="font-bold">{item.title}</p>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {item.menge}x × {item.price}€
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-black">{item.price * item.menge}€</p>
                    <button onClick={() => removeFromCart(item.title)} className="text-red-400 hover:text-red-300 text-xl">✕</button>
                  </div>
                </div>
              ))}

              {/* Rabattcode */}
              <div className="mt-6 flex gap-3">
                <input
                  type="text"
                  placeholder={sprache === "de" ? "Rabattcode" : "Discount code"}
                  value={rabattCode}
                  onChange={(e) => setRabattCode(e.target.value)}
                  className={`${input} p-3 rounded-xl flex-1`}
                />
                <button onClick={pruefeRabatt} className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold transition">
                  {sprache === "de" ? "Einlösen" : "Apply"}
                </button>
              </div>
              {rabattFehler && <p className="text-red-400 text-sm mt-2">{rabattFehler}</p>}
              {rabattProzent > 0 && <p className="text-green-400 text-sm mt-2">✓ {rabattProzent}% {sprache === "de" ? "Rabatt aktiviert!" : "discount activated!"}</p>}

              <div className="mt-6 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    {rabattProzent > 0 && (
                      <p className={`line-through ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{cartRaw.toFixed(2)}€</p>
                    )}
                    <p className="text-3xl font-black">{cartTotal.toFixed(2)}€</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 transition px-8 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2"
                  >
                    {checkoutLoading === true ? "⏳..." : `💳 ${sprache === "de" ? "Kreditkarte" : "Credit card"} — ${cartTotal.toFixed(2)}€`}
                  </button>
                  <button
                    onClick={handlePayPalCheckout}
                    disabled={paypalLoading}
                    className="flex-1 bg-[#FFC439] hover:bg-[#f0b429] transition px-8 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-1"
                  >
                    {paypalLoading ? "⏳..." : (
                      <>
                        <span className="font-black text-[#003087]">Pay</span>
                        <span className="font-black text-[#009cde]">Pal</span>
                        <span className="text-[#003087] ml-1">— {cartTotal.toFixed(2)}€</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* WUNSCHLISTE */}
      {wishlist.length > 0 && (
        <section className="border-t border-blue-500/10 py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-black mb-10">❤️ {sprache === "de" ? "Meine Wunschliste" : "My Wishlist"}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {products.filter(p => wishlist.includes(p.title)).map((product, index) => (
                <div key={index} className={`${card} rounded-2xl p-6 flex items-center gap-4`}>
                  <div className="flex-1">
                    <p className="font-black text-lg">{product.title}</p>
                    <p className="text-blue-400 font-bold">{product.price}€</p>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="bg-blue-600 hover:bg-blue-500 transition px-4 py-2 rounded-xl font-bold text-sm"
                  >
                    {sprache === "de" ? "Kaufen" : "Buy"}
                  </button>
                  <button
                    onClick={() => toggleWishlist(product.title)}
                    className="text-red-400 hover:text-red-300 text-xl transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* UPLOAD */}
      <section id="upload" className="border-t border-blue-500/10 py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-6xl font-black">
              {sprache === "de" ? "Auftrag erstellen" : "Create order"}
            </h2>
          </div>
          <div className={`${card} rounded-[40px] p-10 md:p-16`}>
            <div className="grid md:grid-cols-2 gap-8">
              <input type="text" placeholder={sprache === "de" ? "Name" : "Name"} value={name} onChange={(e) => setName(e.target.value)} className={`${input} p-5 rounded-2xl`} />
              <input type="email" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} className={`${input} p-5 rounded-2xl`} />
            </div>
            <input type="text" placeholder={sprache === "de" ? "Telefon" : "Phone"} value={phone} onChange={(e) => setPhone(e.target.value)} className={`${input} p-5 rounded-2xl w-full mt-8`} />
            <select value={material} onChange={(e) => setMaterial(e.target.value)} className={`${input} p-5 rounded-2xl w-full mt-8`}>
              {MATERIALIEN.map(m => <option key={m.name}>{m.name}</option>)}
            </select>
            <textarea
              placeholder={sprache === "de" ? "Beschreibe dein Wunschprodukt..." : "Describe your product..."}
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${input} p-5 rounded-2xl w-full mt-8`}
            />
            <div className="mt-12">
              <Upload />
            </div>
            <button onClick={sendRequest} disabled={loading} className="mt-12 w-full bg-blue-600 hover:bg-blue-500 transition py-6 rounded-2xl font-black text-xl">
              {loading ? (sprache === "de" ? "Sende Anfrage..." : "Sending...") : (sprache === "de" ? "Auftrag absenden" : "Submit order")}
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="kontakt" className="border-t border-blue-500/10 py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-4xl font-black mb-4">MPG-3D</h3>
          <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            {sprache === "de" ? "Premium 3D Druck Service aus Deutschland" : "Premium 3D printing service from Germany"}
          </p>
          <div className="flex justify-center gap-6 mt-8">
            <a href="mailto:info@mpg-3d.de" className="text-blue-400 hover:text-blue-300 transition">info@mpg-3d.de</a>
            <span className={darkMode ? "text-gray-600" : "text-gray-400"}>|</span>
            <a href="#" className="text-blue-400 hover:text-blue-300 transition">Instagram</a>
            <span className={darkMode ? "text-gray-600" : "text-gray-400"}>|</span>
            <a href="#" className="text-blue-400 hover:text-blue-300 transition">Discord</a>
          </div>
          <div className={`mt-10 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>© 2026 MPG-3D — Alle Rechte vorbehalten</div>
        </div>
      </footer>

    </main>
  )
}
