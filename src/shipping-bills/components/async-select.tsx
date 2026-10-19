import { RrCaretDown } from 'icons/rr/fi-rr-caret-down'
import { useEffect, useRef, useState } from 'react'
import { getFormContext, RegisterOptions, useController } from 'ui/form'
import { InputError } from 'ui/inputs/error'
import { Popover, PopoverContent, PopoverTrigger } from 'ui/interactive/popover'
import { PopoverContext } from 'ui/interactive/popover-context'
import { clsx, getContext } from 'ui/utils'

export interface AsyncOption {
  value: string
  label: string
  sublabel?: string
}

interface AsyncSelectProps {
  name: string
  placeholder?: string
  disabled?: boolean
  className?: string
  rules?: RegisterOptions
  /** Re-resolve the selected label / reload options when these change (e.g. the parent party id). */
  deps?: React.DependencyList
  /** Search the backing service. Called (debounced) on open and on every keystroke. */
  fetchOptions: (query: string) => Promise<AsyncOption[]>
  /** Resolves the label of an already selected value (e.g. when editing a saved bill). */
  getInitialLabel?: (id: string) => Promise<string>
}

const SEARCH_DEBOUNCE_MS = 200

/** Searchable select whose options come from an async service call instead of a static list. */
export function AsyncSelect({
  name,
  placeholder = 'Search...',
  disabled = false,
  className,
  rules,
  deps = [],
  fetchOptions,
  getInitialLabel
}: AsyncSelectProps) {
  const ctx = getFormContext()
  const {
    field: { onChange, value, ref }
  } = useController({
    name,
    control: ctx.hooks.control,
    rules: ctx.schema.shape[name] ?? rules,
    disabled
  })

  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<AsyncOption[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [selectedLabel, setSelectedLabel] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const fetchOptionsRef = useRef(fetchOptions)
  fetchOptionsRef.current = fetchOptions

  const getInitialLabelRef = useRef(getInitialLabel)
  getInitialLabelRef.current = getInitialLabel

  // Resolve the label of the selected value on mount and whenever the value changes.
  useEffect(() => {
    let active = true
    if (value) {
      if (getInitialLabelRef.current) {
        getInitialLabelRef.current(String(value)).then(
          (label) => {
            if (active && label) setSelectedLabel(label)
          },
          () => undefined // keep whatever label we already show; the options list reports load failures
        )
      } else {
        const found = options.find((o) => o.value === String(value))
        if (found) setSelectedLabel(found.label)
      }
    } else {
      setSelectedLabel('')
    }
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, ...deps])

  // Search whenever the query changes or the popover opens.
  useEffect(() => {
    if (!isOpen && !query) return

    let active = true
    setStatus('loading')
    const timer = setTimeout(() => {
      fetchOptionsRef.current(query).then(
        (results) => {
          if (!active) return
          setOptions(results)
          setStatus('idle')
        },
        () => {
          if (!active) return
          setOptions([])
          setStatus('error')
        }
      )
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      active = false
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isOpen, ...deps])

  return (
    <div>
      <input type="hidden" name={name} value={value ?? ''} ref={ref} disabled={disabled} />
      <Popover placement="bottom-start" fallbackPlacements={['top-start']} onOpenCallback={(open) => setIsOpen(open)}>
        <PopoverTrigger
          className={clsx(
            'outline-focus-select group flex w-full cursor-pointer items-center justify-between rounded border border-gray-200 pr-2 hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50',
            className || 'bg-white',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          disabled={disabled}>
          <div className="flex items-center p-2 text-sm">
            <span className={selectedLabel ? 'font-medium text-gray-900' : 'text-gray-400'}>
              {selectedLabel || placeholder}
            </span>
          </div>
          <RrCaretDown className="size-4 text-gray-400 transition-transform group-data-[state=open]:rotate-180" />
        </PopoverTrigger>
        <InputError name={name} />
        <PopoverContent className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search..."
              className="focus:border-primary-500 focus:ring-primary-500 w-full rounded border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:ring-1"
              autoFocus
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {status === 'loading' ? (
              <div className="p-3 text-center text-xs text-gray-500">Searching...</div>
            ) : status === 'error' ? (
              <div className="p-3 text-center text-xs text-red-600">
                Could not load results. Close and reopen to retry.
              </div>
            ) : options.length === 0 ? (
              <div className="p-3 text-center text-xs text-gray-400">No matching results found</div>
            ) : (
              options.map((option) => (
                <OptionItem
                  key={option.value}
                  option={option}
                  isSelected={String(value) === option.value}
                  onSelect={(selected) => {
                    onChange(selected.value)
                    ctx.hooks.setValue(name, selected.value, {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true
                    })
                    setSelectedLabel(selected.label)
                    setQuery('')
                  }}
                />
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

interface OptionItemProps {
  option: AsyncOption
  isSelected: boolean
  onSelect: (option: AsyncOption) => void
}

function OptionItem({ option, isSelected, onSelect }: OptionItemProps) {
  const { setOpen } = getContext(PopoverContext)

  return (
    <div
      onClick={() => {
        onSelect(option)
        setOpen(false)
      }}
      className={clsx(
        'flex cursor-pointer flex-col rounded p-2 text-sm transition-colors',
        isSelected ? 'bg-primary-50 text-primary-900 font-semibold' : 'text-gray-950 hover:bg-gray-100'
      )}>
      <span>{option.label}</span>
      {option.sublabel && <span className="text-xs text-gray-500">{option.sublabel}</span>}
    </div>
  )
}
