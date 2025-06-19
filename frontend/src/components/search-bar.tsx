// components/SearchBar.tsx
"use client"

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
  onAddStudent,
}: SearchBarProps) {
  return (
    <div className="mb-6 bg-background p-4 rounded-lg shadow">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search students by name, handle, country, city, or organization..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
          />
        </div>
        <div className="flex gap-2">
          {isSearchMode && (
            <button
              onClick={onClearSearch}
              className="px-4 py-2 bg-muted/30 text-foreground rounded-lg hover:bg-accent"
            >
              Clear Search
            </button>
          )}
          <button
            onClick={onAddStudent}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Add Student
          </button>
        </div>
      </div>
      {isSearchMode && (
        <div className="mt-2 text-sm text-muted-foreground">
          Searching for: "{searchQuery}" • {totalCount} results found
        </div>
      )}
    </div>
  )
}
