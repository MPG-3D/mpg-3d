"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { useSession } from "next-auth/react"
import dynamic from "next/dynamic"

const Reviews = dynamic(() => import("../../components/Reviews"), { ssr: false })

const PRODUCTS = [
  { image: "/logo.png", title: "Controller Stand", price: 19, category: "Gaming", desc: "Passend für PS5 & Xbox, stabiler Standfuß", fullDesc: "Hochwertiger Controller-Stand für PS5 und Xbox Controller. Stabiler Standfuß mit rutschfesten Pads. Perfekt für dein Gaming-Setup.", specs: ["Kompatibel mit PS5 & Xbox", "Rutschfeste Pads", "Robustes PLA Material", "Einfache Montage"] },
  { image: "/logo.png", title: "Headset Holder", price: 22, category: "Gaming", desc: "Wandmontierter Headset-Halter aus PETG", fullDesc: "Wandmontierbarer Headset-Halter aus hochwertigem PETG. Hält dein Gaming-Headset sicher und ordentlich.", specs: ["Wandmontage", "PETG Material", "Belastbar bis 2kg", "Einfache Installation"] },
  { image: "/logo.png", title: "Joy-Con Rail", price: 14, category: "Gaming", desc: "Ersatz-Schiene für Nintendo Switch", fullDesc: "Ersatz-Schiene für Nintendo Switch Joy-Con. Perfekt als Reparaturteil oder Upgrade.", specs: ["Original Maße", "PLA+ Premium", "Einfacher Austausch", "Stabile Verbindung"] },
  { image: "/logo.png", title: "PS5 Lüftergitter", price: 18, category: "Gaming", desc: "Schutzgitter für PS5 Lüftungsschlitze", fullDesc: "Schutzgitter für PS5 Lüftungsschlitze. Verhindert Staubansammlung und verbessert die Luftzirkulation.", specs: ["Präzise Passform", "Staubabweisend", "Einfache Montage", "Beeinträchtigt nicht die Kühlung"] },
  { image: "/logo.png", title: "Xbox Akku Cover", price: 15, category: "Gaming", desc: "Ersatz-Akkudeckel für Xbox Controller", fullDesc: "Ersatz-Akkudeckel für Xbox Controller. Passend für verschiedene Xbox Modelle.", specs: ["Passend für Xbox Series X/S", "Robustes Material", "Einfacher Austausch", "Sichere Haltung"] },
  { image: "/logo.png", title: "Tastatur Füße", price: 12, category: "Setup", desc: "Rutschfeste Erhöhungsfüße für Tastaturen", fullDesc: "Rutschfeste Erhöhungsfüße für mechanische Tastaturen. Verbessert die Ergonomie beim Tippen.", specs: ["Rutschfeste Unterseite", "Ergonomisches Design", "Universal passend", "Set von 4 Stück"] },
  { image: "/logo.png", title: "Maus Bungee", price: 16, category: "Setup", desc: "Kabelführung für Gaming-Mäuse", fullDesc: "Kabelführung für Gaming-Mäuse. Verhindert Kabelsalat und ermöglicht freie Mausbewegungen.", specs: ["Gewichteter Fuß", "Flexibler Arm", "Universal kompatibel", "Stabiler Stand"] },
  { image: "/logo.png", title: "Kabel Clips", price: 10, category: "Setup", desc: "Ordnung auf dem Schreibtisch", fullDesc: "Kabel-Clips für ordentliche Kabelführung am Schreibtisch. Selbstklebend und wiederverwendbar.", specs: ["Selbstklebend", "Wiederverwendbar", "Set von 10 Stück", "Universal passend"] },
  { image: "/logo.png", title: "Monitor Halter", price: 24, category: "Setup", desc: "Stabile Tischhalterung für Monitore", fullDesc: "Stabile Tischhalterung für Monitore bis 27 Zoll. Freut deinen Schreibtisch und verbessert die Sicht.", specs: ["Bis 27 Zoll", "Verstellbarer Winkel", "Robustes Material", "Einfache Montage"] },
  { image: "/logo.png", title: "RGB Halterung", price: 19, category: "Setup", desc: "LED-Streifen Halterung für Monitor-Rückseite", fullDesc: "LED-Streifen Halterung für Monitor-Rückseite. Perfekt für Ambient Lighting.", specs: ["Universal passend", "Kabelmanagement", "Einfache Installation", "RGB kompatibel"] },
  { image: "/logo.png", title: "Schrank Clip", price: 10, category: "Haushalt", desc: "Clip zum Nachrüsten von Schranktüren", fullDesc: "Clip zum Nachrüsten von Schranktüren. Verhindert das Zuklappen und verbessert die Sicherheit.", specs: ["Universal passend", "Einfache Installation", "Robustes Material", "Kindersicher"] },
  { image: "/logo.png", title: "Kühlschrank Griff", price: 15, category: "Haushalt", desc: "Ersatzgriff für Kühlschranktüren", fullDesc: "Ersatzgriff für Kühlschranktüren. Passend für die meisten Standard-Kühlschränke.", specs: ["Universal passend", "Robustes Material", "Einfache Montage", "Rutschfest"] },
  { image: "/logo.png", title: "Staubsauger Adapter", price: 18, category: "Haushalt", desc: "Adapter für verschiedene Sauger-Aufsätze", fullDesc: "Adapter für verschiedene Staubsauger-Aufsätze. Erweitert die Funktionalität deines Staubsaugers.", specs: ["Universal kompatibel", "Robustes Material", "Einfacher Wechsel", "Dicht"] },
  { image: "/logo.png", title: "Waschmaschinen Knopf", price: 14, category: "Haushalt", desc: "Ersatz-Drehknopf für Waschmaschinen", fullDesc: "Ersatz-Drehknopf für Waschmaschinen. Passend für die meisten Modelle.", specs: ["Universal passend", "Einfache Installation", "Robustes Material", "Griffig"] },
  { image: "/logo.png", title: "Fenster Clip", price: 9, category: "Haushalt", desc: "Halteclip für Fensterrahmen", fullDesc: "Halteclip für Fensterrahmen. Ideal für Gardinen oder Dekoration.", specs: ["Universal passend", "Einfache Installation", "Robustes Material", "Belastbar"] },
  { image: "/logo.png", title: "Duschhalter", price: 16, category: "Haushalt", desc: "Wandhalterung für Duschkopf oder Seife", fullDesc: "Wandhalterung für Duschkopf oder Seife. Wasserdicht und robust.", specs: ["Wasserdicht", "Selbstklebend", "Belastbar", "Einfache Installation"] },
  { image: "/logo.png", title: "Türstopper", price: 12, category: "Haushalt", desc: "Runder Türstopper, bodenständig", fullDesc: "Runder Türstopper, bodenständig. Schützt deine Wände und Türen.", specs: ["Rutschfest", "Robustes Material", "Leises Schließen", "Universal passend"] },
  { image: "/logo.png", title: "Haken System", price: 14, category: "Haushalt", desc: "Modulare Wandhaken für Küche & Flur", fullDesc: "Modulares Wandhaken-System für Küche und Flur. Erweiterbar und vielseitig.", specs: ["Modular", "Erweiterbar", "Selbstklebend", "Belastbar"] },
  { image: "/logo.png", title: "Möbel Verbinder", price: 13, category: "Haushalt", desc: "Verbindungsstück für Möbelplatten", fullDesc: "Verbindungsstück für Möbelplatten. Stabile Verbindung für DIY-Projekte.", specs: ["Robust", "Einfache Montage", "Universal passend", "Belastbar"] },
  { image: "/logo.png", title: "Schubladen Rolle", price: 11, category: "Haushalt", desc: "Ersatzrolle für Schubladensysteme", fullDesc: "Ersatzrolle für Schubladensysteme. Leichtgängig und robust.", specs: ["Leichtgängig", "Robustes Material", "Universal passend", "Einfacher Austausch"] },
  { image: "/logo.png", title: "Getränkehalter Clip", price: 16, category: "Auto", desc: "Clip-Getränkehalter für Armlehne", fullDesc: "Clip-Getränkehalter für Armlehne. Hält Getränke sicher während der Fahrt.", specs: ["Universal passend", "Rutschfest", "Einfache Installation", "Belastbar"] },
  { image: "/logo.png", title: "Lüftungsgitter Clip", price: 9, category: "Auto", desc: "Befestigungsclip für Kfz-Lüftungsgitter", fullDesc: "Befestigungsclip für Kfz-Lüftungsgitter. Ideal für Halterungen.", specs: ["Universal passend", "Rutschfest", "Einfache Installation", "Belastbar"] },
  { image: "/logo.png", title: "Handyhalter Adapter", price: 15, category: "Auto", desc: "Universeller Handy-Adapter fürs Auto", fullDesc: "Universeller Handy-Adapter fürs Auto. Kompatibel mit den meisten Handys.", specs: ["Universal kompatibel", "Rutschfest", "Einfache Installation", "Belastbar"] },
  { image: "/logo.png", title: "Schlüssel Gehäuse", price: 14, category: "Auto", desc: "Ersatz-Schlüsselgehäuse für Kfz", fullDesc: "Ersatz-Schlüsselgehäuse für Kfz. Passend für die meisten Autoschlüssel.", specs: ["Universal passend", "Robustes Material", "Einfache Installation", "Wasserdicht"] },
  { image: "/logo.png", title: "Armlehnen Clip", price: 12, category: "Auto", desc: "Clip für Armlehnen-Verkleidungen", fullDesc: "Clip für Armlehnen-Verkleidungen. Reparatur oder Upgrade.", specs: ["Universal passend", "Robustes Material", "Einfache Installation", "Belastbar"] },
  { image: "/logo.png", title: "Kabelhalter Auto", price: 10, category: "Auto", desc: "Kabelclip für Fahrzeuginnenraum", fullDesc: "Kabelclip für Fahrzeuginnenraum. Ordentliche Kabelführung.", specs: ["Selbstklebend", "Universal passend", "Robustes Material", "Einfache Installation"] },
  { image: "/logo.png", title: "Kofferraum Haken", price: 14, category: "Auto", desc: "Einkaufstaschen-Haken für Kofferraum", fullDesc: "Einkaufstaschen-Haken für Kofferraum. Maximiert den Stauraum.", specs: ["Belastbar", "Einfache Installation", "Robustes Material", "Universal passend"] },
  { image: "/logo.png", title: "Innenraum Abdeckung", price: 18, category: "Auto", desc: "Ersatz-Abdeckung für Kfz-Innenraum", fullDesc: "Ersatz-Abdeckung für Kfz-Innenraum. Schützt und verschönert.", specs: ["Universal passend", "Robustes Material", "Einfache Installation", "Langlebig"] },
  { image: "/logo.png", title: "Spiegel Clip", price: 9, category: "Auto", desc: "Befestigungsclip für Außenspiegel", fullDesc: "Befestigungsclip für Außenspiegel. Reparatur oder Upgrade.", specs: ["Universal passend", "Robustes Material", "Wetterfest", "Einfache Installation"] },
  { image: "/logo.png", title: "Sonnenblenden Halter", price: 11, category: "Auto", desc: "Halter für Sonnenschutz-Zubehör", fullDesc: "Halter für Sonnenschutz-Zubehör. Erweitert die Funktionalität.", specs: ["Universal passend", "Einfache Installation", "Robustes Material", "Belastbar"] },
  { image: "/logo.png", title: "GPU Halter", price: 24, category: "PC", desc: "Anti-Sag Stütze für schwere Grafikkarten", fullDesc: "Anti-Sag Stütze für schwere Grafikkarten. Verhindert Durchbiegen.", specs: ["Verstellbar", "Robustes Material", "Universal passend", "Rutschfest"] },
  { image: "/logo.png", title: "SSD Halter", price: 18, category: "PC", desc: "Halterung für 2,5 Zoll SSDs", fullDesc: "Halterung für 2,5 Zoll SSDs. Ordentliche Installation im Gehäuse.", specs: ["Für 2,5 Zoll SSDs", "Robustes Material", "Einfache Montage", "Vibrationsschutz"] },
  { image: "/logo.png", title: "Lüfter Spacer", price: 16, category: "PC", desc: "Abstandshalter für 120mm Gehäuselüfter", fullDesc: "Abstandshalter für 120mm Gehäuselüfter. Verbessert die Luftzirkulation.", specs: ["Für 120mm Lüfter", "Robustes Material", "Einfache Installation", "Verbesserte Kühlung"] },
  { image: "/logo.png", title: "Kabelkamm", price: 15, category: "PC", desc: "Kabelführung für ordentliches PC-Inneres", fullDesc: "Kabelkamm für ordentliches PC-Inneres. Perfektes Cable Management.", specs: ["Universal passend", "Robustes Material", "Einfache Installation", "Erweiterbar"] },
  { image: "/logo.png", title: "Raspberry Pi Case", price: 22, category: "PC", desc: "Gehäuse für Raspberry Pi 4/5", fullDesc: "Gehäuse für Raspberry Pi 4/5. Schutz und Kühlung.", specs: ["Für Pi 4/5", "Belüftet", "Zugang zu Ports", "Robustes Material"] },
  { image: "/logo.png", title: "Mini PC Halter", price: 25, category: "PC", desc: "VESA-Wandhalterung für Mini-PCs", fullDesc: "VESA-Wandhalterung für Mini-PCs. Platzsparend und sicher.", specs: ["VESA kompatibel", "Belastbar", "Einfache Installation", "Robustes Material"] },
  { image: "/logo.png", title: "USB Halter", price: 12, category: "PC", desc: "Halterung für USB-Hubs am Monitor", fullDesc: "Halterung für USB-Hubs am Monitor. Ordentliche Arbeitsfläche.", specs: ["Universal passend", "Selbstklebend", "Robustes Material", "Einfache Installation"] },
  { image: "/logo.png", title: "Monitor Clip", price: 10, category: "PC", desc: "Kabelclip für Monitor-Rückseite", fullDesc: "Kabelclip für Monitor-Rückseite. Verstecktes Cable Management.", specs: ["Universal passend", "Selbstklebend", "Robustes Material", "Einfache Installation"] },
  { image: "/logo.png", title: "Netzteil Halter", price: 22, category: "PC", desc: "Modular PSU Kabelhalter", fullDesc: "Modularer PSU Kabelhalter. Ordentliche Kabelverwaltung.", specs: ["Modular", "Erweiterbar", "Robustes Material", "Einfache Installation"] },
  { image: "/logo.png", title: "Router Wandhalter", price: 20, category: "PC", desc: "Wandhalterung für WLAN-Router", fullDesc: "Wandhalterung für WLAN-Router. Platzsparend und sicher.", specs: ["Universal passend", "Belastbar", "Einfache Installation", "Robustes Material"] },
]

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [darkMode, setDarkMode] = useState(true)
  const [cart, setCart] = useState<{ title: string; price: number; menge: number }[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)

  const product = PRODUCTS.find(p => p.title.toLowerCase().replace(/\s+/g, "-") === params.id)

  useEffect(() => {
    const savedCart = localStorage.getItem("mpg3d-cart")
    if (savedCart) setCart(JSON.parse(savedCart))
    const savedWishlist = localStorage.getItem("mpg3d-wishlist")
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist))
  }, [])

  if (!product) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-4">Produkt nicht gefunden</h1>
          <button onClick={() => router.push("/")} className="text-blue-400 hover:text-blue-300">Zurück zum Shop</button>
        </div>
      </main>
    )
  }

  const bg = darkMode ? "bg-black text-white" : "bg-white text-black"
  const card = darkMode ? "bg-gradient-to-b from-blue-950/40 to-black border border-blue-500/10" : "bg-gradient-to-b from-blue-100 to-white border border-blue-200"

  const addToCart = () => {
    setCart(prev => {
      const existing = prev.find(i => i.title === product.title)
      const next = existing
        ? prev.map(i => i.title === product.title ? { ...i, menge: i.menge + quantity } : i)
        : [...prev, { ...product, menge: quantity }]
      localStorage.setItem("mpg3d-cart", JSON.stringify(next))
      return next
    })
    alert(`${quantity}x ${product.title} zum Warenkorb hinzugefügt!`)
  }

  const toggleWishlist = () => {
    setWishlist(prev => {
      const next = prev.includes(product.title) ? prev.filter(t => t !== product.title) : [...prev, product.title]
      localStorage.setItem("mpg3d-wishlist", JSON.stringify(next))
      return next
    })
  }

  const images = [
    "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&q=80",
    "https://images.unsplash.com/photo-1593640408182-31c228f06c69?w=800&q=80",
    "https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=800&q=80",
  ]

  return (
    <main className={`min-h-screen ${bg} transition-colors duration-300`}>
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_50%)]" />

      {/* NAVBAR */}
      <header className={`fixed top-0 left-0 w-full z-50 border-b ${darkMode ? "bg-black/80 border-blue-500/10" : "bg-white/80 border-blue-200"} backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="text-blue-400 hover:text-blue-300">← Zurück</button>
            <h1 className="text-2xl font-black">MPG-3D</h1>
          </div>
          <nav className="flex items-center gap-4">
            <button onClick={() => setDarkMode(!darkMode)} className="px-3 py-1 rounded-lg border border-blue-500/30 text-sm font-bold hover:bg-blue-600/20 transition">
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button onClick={() => router.push("/shop")} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition">
              Shop
            </button>
          </nav>
        </div>
      </header>

      <div className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Bilder */}
            <div>
              <div className="relative aspect-square rounded-3xl overflow-hidden mb-4">
                <Image
                  src={images[selectedImage]}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition ${selectedImage === i ? "border-blue-500" : "border-transparent"}`}
                  >
                    <Image src={img} alt={`${product.title} ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Produktinfo */}
            <div>
              <div className="mb-4">
                <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-sm font-bold">
                  {product.category}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black mb-4">{product.title}</h1>
              <p className={`text-2xl font-black text-blue-400 mb-6`}>{product.price}€</p>
              <p className={`text-lg mb-8 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{product.fullDesc}</p>

              {/* Spezifikationen */}
              <div className={`${card} rounded-2xl p-6 mb-8`}>
                <h3 className="text-xl font-black mb-4">Spezifikationen</h3>
                <ul className="space-y-2">
                  {product.specs.map((spec, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-blue-400">✓</span>
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Menge */}
              <div className="mb-8">
                <label className="block mb-2 font-bold">Menge</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 rounded-xl bg-gray-800 hover:bg-gray-700 font-black text-xl"
                  >
                    -
                  </button>
                  <span className="text-2xl font-black w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 rounded-xl bg-gray-800 hover:bg-gray-700 font-black text-xl"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 mb-8">
                <button
                  onClick={addToCart}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 transition py-4 rounded-2xl font-black text-lg"
                >
                  In Warenkorb
                </button>
                <button
                  onClick={toggleWishlist}
                  className="w-16 h-16 rounded-2xl bg-gray-800 hover:bg-gray-700 text-2xl transition"
                >
                  {wishlist.includes(product.title) ? "❤️" : "🤍"}
                </button>
              </div>

              {/* Lieferinfo */}
              <div className={`p-6 rounded-2xl ${darkMode ? "bg-green-900/20 border border-green-500/20" : "bg-green-100 border border-green-200"}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🚚</span>
                  <span className="font-black">Kostenloser Versand</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Lieferzeit: 3-5 Werktage</p>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="mt-20">
            <h2 className="text-4xl font-black mb-10">Kundenbewertungen</h2>
            <Reviews productId={product.title.toLowerCase().replace(/\s+/g, "-")} productName={product.title} />
          </div>
        </div>
      </div>
    </main>
  )
}
