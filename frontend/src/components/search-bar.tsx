// components/search-bar.tsx

interface SearchBarProps {
    searchQuery: string
    isSearchMode: boolean
    totalCount: number
    onSearch: (query: string) => void
    onClearSearch: () => void
    onAddStudent: () => void
  }
  
  export function SearchBar({
    searchQuery,
    isSearchMode,
    totalCount,
    onSearch,
    onClearSearch,
    onAddStudent
  }: SearchBarProps) {
    return (
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search students by name, handle, country, city, or organization..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {isSearchMode && (
              <button
                onClick={onClearSearch}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Clear Search
              </button>
            )}
            <button
              onClick={onAddStudent}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Student
            </button>
          </div>
        </div>
        {isSearchMode && (
          <div className="mt-2 text-sm text-gray-600">
            Searching for: "{searchQuery}" • {totalCount} results found
          </div>
        )}
      </div>
    )
  }