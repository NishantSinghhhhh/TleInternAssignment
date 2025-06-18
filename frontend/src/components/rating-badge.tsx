interface RatingBadgeProps {
    rating: number
    isMax?: boolean
  }
  
  export function RatingBadge({ rating, isMax = false }: RatingBadgeProps) {
    const getRatingColor = (rating: number): string => {
      if (rating >= 3000) return "text-red-600 font-bold"
      if (rating >= 2400) return "text-red-500 font-semibold"
      if (rating >= 2100) return "text-orange-500 font-semibold"
      if (rating >= 1900) return "text-purple-500 font-semibold"
      if (rating >= 1600) return "text-blue-500 font-semibold"
      if (rating >= 1400) return "text-cyan-500 font-medium"
      if (rating >= 1200) return "text-green-500 font-medium"
      if (rating >= 800) return "text-green-400 font-medium"
      return "text-gray-500"
    }
  
    return <span className={`${getRatingColor(rating)} ${isMax ? "text-sm" : ""}`}>{rating || "Unrated"}</span>
  }
  