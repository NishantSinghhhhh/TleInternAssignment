import { Button } from "@/components/ui/button"

interface ErrorMessageProps {
  message: string
  onRetry: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-600 text-lg font-medium mb-4">Error Loading Data</div>
        <p className="text-red-700 mb-6">{message}</p>
        <Button onClick={onRetry} className="bg-blue-600 hover:bg-blue-700 text-white">
          Try Again
        </Button>
      </div>
    </div>
  )
}
