// components/PaginationInfo.tsx
"use client"

interface PaginationInfoProps {
  currentPage: number
  pageSize: number
  totalCount: number
  onPageSizeChange: (newSize: number) => void
}

export function PaginationInfo({
  currentPage,
  pageSize,
  totalCount,
  onPageSizeChange,
}: PaginationInfoProps) {
  const startItem = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const endItem = Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="text-muted-foreground">
        Showing <span className="font-medium">{startItem}</span> to{" "}
        <span className="font-medium">{endItem}</span> of{" "}
        <span className="font-medium">{totalCount}</span> users
      </div>

      <div className="flex items-center gap-2">
        <label className="text-muted-foreground font-medium">
          Rows per page:
        </label>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  )
}
