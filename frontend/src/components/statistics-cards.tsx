interface StatisticsCardsProps {
  users: any[]
  totalCount: number
}

export function StatisticsCards({ users, totalCount }: StatisticsCardsProps) {
  if (users.length === 0) return null

  const avgRating = Math.round(users.reduce((sum, u) => sum + (u.currentRating || 0), 0) / users.length)
  const maxRating = Math.max(...users.map((u) => u.currentRating || 0))
  const uniqueCountries = new Set(users.map((u) => u.country).filter(Boolean)).size

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
        <h3 className="text-blue-800 dark:text-blue-300 font-semibold text-sm uppercase tracking-wide">Page Average Rating</h3>
        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{avgRating}</p>
      </div>

      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
        <h3 className="text-green-800 dark:text-green-300 font-semibold text-sm uppercase tracking-wide">Page Highest Rating</h3>
        <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{maxRating}</p>
      </div>

      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6">
        <h3 className="text-purple-800 dark:text-purple-300 font-semibold text-sm uppercase tracking-wide">Page Countries</h3>
        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{uniqueCountries}</p>
      </div>

      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-6">
        <h3 className="text-orange-800 dark:text-orange-300 font-semibold text-sm uppercase tracking-wide">Total Users</h3>
        <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{totalCount}</p>
      </div>
    </div>
  )
}