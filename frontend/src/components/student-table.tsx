// components/student-table.tsx

interface CFUser {
  _id: string
  name: string
  email?: string
  phone?: string
  handle: string
  currentRating: number
  maxRating: number
  rank: string
  maxRank: string
  country?: string
  city?: string
  organization?: string
  avatar: string
  contribution: number
  friendOfCount: number
  firstName?: string
  lastName?: string
}

interface StudentTableProps {
  users: CFUser[]
  isSearchMode: boolean
  actionLoading: boolean
  onEditStudent: (user: CFUser) => void
  onDeleteStudent: (id: string, name: string) => void
}

export function StudentTable({
  users,
  isSearchMode,
  actionLoading,
  onEditStudent,
  onDeleteStudent
}: StudentTableProps) {
  const getRatingColorClass = (rating: number): string => {
    if (rating >= 3000) return 'bg-red-500/10 text-red-800 dark:text-red-300 border border-red-500/20'
    if (rating >= 2400) return 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20'
    if (rating >= 2100) return 'bg-orange-500/10 text-orange-800 dark:text-orange-300 border border-orange-500/20'
    if (rating >= 1900) return 'bg-purple-500/10 text-purple-800 dark:text-purple-300 border border-purple-500/20'
    if (rating >= 1600) return 'bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-500/20'
    if (rating >= 1400) return 'bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 border border-cyan-500/20'
    if (rating >= 1200) return 'bg-green-500/10 text-green-800 dark:text-green-300 border border-green-500/20'
    if (rating >= 800) return 'bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/20'
    return 'bg-muted text-muted-foreground border border-border'
  }

  return (
    <div className="mb-8 bg-background rounded-lg shadow border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Avatar
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Handle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Max Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Country
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-border">
            {users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                  {isSearchMode 
                    ? 'No students found matching your search.' 
                    : 'No students found. Try fetching some data first!'
                  }
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="hover:bg-accent">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={user.avatar || 'https://userpic.codeforces.org/no-avatar.jpg'}
                      alt={`${user.handle}'s avatar`}
                      className="h-10 w-10 rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = 'https://userpic.codeforces.org/no-avatar.jpg'
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a
                      href={`https://codeforces.com/profile/${user.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      {user.handle}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.name
                      }
                    </div>
                    {user.email && (
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRatingColorClass(user.currentRating)}`}>
                      {user.currentRating || 'Unrated'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-foreground">
                      {user.maxRating || 'Unrated'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-foreground capitalize">
                      {user.rank || 'Unrated'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-foreground">
                      {user.country || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEditStudent(user)}
                        disabled={actionLoading}
                        className="text-primary hover:text-primary/80 disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteStudent(user._id, user.name)}
                        disabled={actionLoading}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}