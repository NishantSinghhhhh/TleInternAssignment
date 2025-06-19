// components/RatingBadge.tsx

interface RatingBadgeProps {
  rating: number
  isMax?: boolean
}

export function RatingBadge({ rating, isMax = false }: RatingBadgeProps) {
  const getRatingColor = (rating: number): string => {
    if (rating >= 3000) return "text-red-600 dark:text-red-400 font-bold"
    if (rating >= 2400) return "text-red-500 dark:text-red-400 font-semibold"
    if (rating >= 2100) return "text-orange-500 dark:text-orange-300 font-semibold"
    if (rating >= 1900) return "text-purple-500 dark:text-purple-400 font-semibold"
    if (rating >= 1600) return "text-blue-500 dark:text-blue-400 font-semibold"
    if (rating >= 1400) return "text-cyan-500 dark:text-cyan-400 font-medium"
    if (rating >= 1200) return "text-green-500 dark:text-green-400 font-medium"
    if (rating >= 800)  return "text-green-400 dark:text-green-300 font-medium"
    return "text-muted-foreground"
  }

  return (
    <span className={`${getRatingColor(rating)} ${isMax ? "text-sm" : ""}`}>
      {rating || "Unrated"}
    </span>
  )
}
