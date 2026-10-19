import { Button } from 'ui/basic/button'

interface SectionHeadingProps {
  title: string
  description?: string
}

export function SectionHeading({ title, description }: SectionHeadingProps) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-gray-950">{title}</h2>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
  )
}

interface AdvancedProps {
  title: string
  children: React.ReactNode
  open?: boolean
  onToggle?: (isOpen: boolean) => void
}

/** Collapsible group for rarely used fields. */
export function Advanced({ title, children, open, onToggle }: AdvancedProps) {
  return (
    <details
      className="rounded-lg border border-gray-200 bg-gray-50/50 p-4"
      open={open}
      onToggle={(e) => onToggle?.(e.currentTarget.open)}>
      <summary className="cursor-pointer text-sm font-medium text-gray-700">{title}</summary>
      <div className="mt-4">{children}</div>
    </details>
  )
}

interface PersistentTabProps {
  value: string
  activeTab: string
  children: React.ReactNode
  className?: string
}

// Keep fields registered while another tab is open so RHF validates the entire bill on submit.
export function PersistentTab({ value, activeTab, children, className }: PersistentTabProps) {
  return (
    <div role="tabpanel" hidden={activeTab !== value} className={`mt-3 ${className ?? ''}`}>
      {children}
    </div>
  )
}

/** Shared frame for the repeatable blocks (container, range, licence...). */
export function RepeatableCard({
  title,
  onRemove,
  children
}: {
  title: string
  onRemove: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button size="sm" variant="ghost" onClick={onRemove}>
          Remove
        </Button>
      </div>
      {children}
    </div>
  )
}
