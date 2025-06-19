// components/ErrorMessage.tsx
import { Button } from "@/components/ui/button"

interface ErrorMessageProps {
  message: string
  onRetry: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
        <div className="text-red-600 dark:text-red-400 text-lg font-medium mb-4">
          Error Loading Data
        </div>
        <p className="text-red-700 dark:text-red-300 mb-6">
          {message}
        </p>
        <Button
          onClick={onRetry}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Try Again
        </Button>
      </div>
    </div>
  )
}
