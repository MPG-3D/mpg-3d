import { prisma } from "@/prisma/lib/prisma"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const bestellungen = await prisma.request.findMany({
    orderBy: { createdAt: "desc" },
  })

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-5xl font-black mb-10">🛠️ Admin Dashboard</h1>
      <p className="text-gray-400 mb-8">{bestellungen.length} Bestellungen gesamt</p>

      <div className="space-y-4">
        {bestellungen.map((b) => (
          <div key={b.id} className="bg-gray-900 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xl font-black">{b.name}</p>
                <p className="text-blue-400">{b.email}</p>
                <p className="text-gray-400 text-sm">{b.phone}</p>
              </div>
              <div className="text-right">
                <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-sm font-bold">
                  {b.material}
                </span>
                <p className="text-gray-500 text-xs mt-2">
                  {new Date(b.createdAt).toLocaleDateString("de-DE", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              </div>
            </div>
            <p className="text-gray-300 bg-black/50 rounded-xl p-4">{b.description}</p>
          </div>
        ))}

        {bestellungen.length === 0 && (
          <div className="text-center text-gray-500 py-20">
            Noch keine Bestellungen
          </div>
        )}
      </div>
    </main>
  )
}