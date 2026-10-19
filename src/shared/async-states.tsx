import { Button } from 'ui/basic/button'

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div role="status" className="p-10 text-center text-sm text-gray-500">
      {label}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  error?: Error
  onRetry?: () => void
}

export function ErrorState({ title = 'Something went wrong', error, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p className="font-medium text-red-800">{title}</p>
      {error && <p className="text-sm text-red-700">{error.message}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
