"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PaginationControls({ currentPage, totalPages, onPageChange }: PaginationControlsProps) {
  const getPageNumbers = () => {
    const delta = 2
    const pages = []
    const start = Math.max(1, currentPage - delta)
    const end = Math.min(totalPages, currentPage + delta)

    if (start > 1) {
      pages.push(1)
      if (start > 2) pages.push("...")
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...")
      pages.push(totalPages)
    }

    return pages
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        variant="outline"
        className="border-gray-300"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Previous
      </Button>

      {getPageNumbers().map((pageNum, index) => (
        <Button
          key={index}
          onClick={() => typeof pageNum === "number" && onPageChange(pageNum)}
          disabled={pageNum === "..."}
          variant={pageNum === currentPage ? "default" : "outline"}
          className={
            pageNum === currentPage
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : pageNum === "..."
                ? "cursor-default border-gray-300"
                : "border-gray-300 hover:bg-gray-50"
          }
        >
          {pageNum}
        </Button>
      ))}

      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        variant="outline"
        className="border-gray-300"
      >
        Next
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  )
}
