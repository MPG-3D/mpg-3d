export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center max-w-lg px-6">
        <div className="text-8xl mb-8">🎉</div>
        <h1 className="text-5xl font-black mb-6">Zahlung erfolgreich!</h1>
        <p className="text-gray-400 text-xl mb-10">
          Vielen Dank für deine Bestellung! Wir bearbeiten deinen Auftrag und melden uns bald bei dir.
        </p>
        <a href="/" className="bg-blue-600 hover:bg-blue-500 transition px-10 py-4 rounded-2xl font-black text-xl">
          Zurück zur Startseite
        </a>
      </div>
    </main>
  )
}