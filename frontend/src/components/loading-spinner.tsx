export function LoadingSpinner() {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-solid rounded-full animate-spin">
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-solid rounded-full border-t-transparent animate-spin"></div>
          </div>
        </div>
      </div>
    )
  }
  