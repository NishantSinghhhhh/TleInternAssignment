// components/LoadingSpinner.tsx

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="relative">
        {/* Track */}
        <div className="w-16 h-16 border-4 border-primary/20 border-solid rounded-full animate-spin">
          {/* Head */}
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-solid rounded-full border-t-transparent animate-spin" />
        </div>
      </div>
    </div>
  )
}
