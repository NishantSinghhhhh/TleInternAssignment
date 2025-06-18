// components/student-table.tsx

interface CFUser {
    _id: string
    name: string
    email?: string
    phone?: string
    cfHandle: string
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
      if (rating >= 3000) return 'bg-red-100 text-red-800'
      if (rating >= 2400) return 'bg-red-100 text-red-700'
      if (rating >= 2100) return 'bg-orange-100 text-orange-800'
      if (rating >= 1900) return 'bg-purple-100 text-purple-800'
      if (rating >= 1600) return 'bg-blue-100 text-blue-800'
      if (rating >= 1400) return 'bg-cyan-100 text-cyan-800'
      if (rating >= 1200) return 'bg-green-100 text-green-800'
      if (rating >= 800) return 'bg-green-100 text-green-700'
      return 'bg-gray-100 text-gray-800'
    }
  
    return (
      <div className="mb-8 bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avatar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Handle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    {isSearchMode 
                      ? 'No students found matching your search.' 
                      : 'No students found. Try fetching some data first!'
                    }
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={user.avatar || 'https://userpic.codeforces.org/no-avatar.jpg'}
                        alt={`${user.cfHandle}'s avatar`}
                        className="h-10 w-10 rounded-full"
                        onError={(e) => {
                          e.currentTarget.src = 'https://userpic.codeforces.org/no-avatar.jpg'
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={`https://codeforces.com/profile/${user.cfHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {user.cfHandle}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.name
                        }
                      </div>
                      {user.email && (
                        <div className="text-sm text-gray-500">{user.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRatingColorClass(user.currentRating)}`}>
                        {user.currentRating || 'Unrated'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {user.maxRating || 'Unrated'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">
                        {user.rank || 'Unrated'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {user.country || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onEditStudent(user)}
                          disabled={actionLoading}
                          className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteStudent(user._id, user.name)}
                          disabled={actionLoading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
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