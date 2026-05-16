"use client"
import { useEffect, useState } from "react"

interface Review {
  id: string
  name: string
  rating: number
  comment: string
  createdAt: string
}

interface ReviewsProps {
  productId: string
  productName: string
}

export default function Reviews({ productId, productName }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)

  useEffect(() => {
    fetch(`/api/reviews?productId=${productId}`)
      .then(r => r.json())
      .then(d => setReviews(d.reviews ?? []))
  }, [productId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, name, rating, comment }),
      })
      const data = await res.json()
      if (data.review) {
        setReviews(prev => [data.review, ...prev])
        setName("")
        setRating(5)
        setComment("")
        setShowForm(false)
      }
    } catch {
      alert("Fehler beim Senden der Bewertung")
    } finally {
      setLoading(false)
    }
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex">
            {[1, 2, 3, 4, 5].map(s => (
              <span key={s} className={`text-lg ${s <= Math.round(avgRating) ? "text-yellow-400" : "text-gray-600"}`}>★</span>
            ))}
          </div>
          <span className="text-gray-400 text-sm">{reviews.length > 0 ? `${avgRating.toFixed(1)} (${reviews.length})` : "Noch keine Bewertungen"}</span>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="text-blue-400 hover:text-blue-300 text-sm font-bold transition"
        >
          {showForm ? "Abbrechen" : "Bewerten"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-4 space-y-3">
          <input
            type="text"
            placeholder="Dein Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full bg-gray-800 text-white p-2 rounded-lg border border-gray-700 text-sm"
          />
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                type="button"
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(s)}
                className={`text-2xl transition-transform hover:scale-110 ${s <= (hoverRating || rating) ? "text-yellow-400" : "text-gray-600"}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            placeholder="Deine Meinung..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            required
            rows={3}
            className="w-full bg-gray-800 text-white p-2 rounded-lg border border-gray-700 text-sm resize-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold text-sm transition"
          >
            {loading ? "Wird gesendet..." : "Bewertung abschicken"}
          </button>
        </form>
      )}

      {reviews.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {reviews.map(r => (
            <div key={r.id} className="bg-gray-900/30 border border-gray-800 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm">{r.name}</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} className={`text-sm ${s <= r.rating ? "text-yellow-400" : "text-gray-600"}`}>★</span>
                  ))}
                </div>
              </div>
              <p className="text-gray-400 text-sm">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
