import { useEffect, useRef } from 'react'
import { useAsyncData } from '@/shared/use-async-data'
import type { BillFormContext } from '../components/field-types'
import { lookupApi } from '../services'

/**
 * Marks-and-numbers templates belong to the selected exporter. Loads them for the current exporter and
 * clears a previously chosen value when the exporter changes (but not on first render, so saved bills keep theirs).
 */
export function useMarksAndNumbers(formCtx: BillFormContext) {
  const { watch, setValue } = formCtx.hooks
  const exporterId = watch('exporterId')

  const previousExporterId = useRef(exporterId)
  useEffect(() => {
    if (previousExporterId.current === exporterId) return
    previousExporterId.current = exporterId
    setValue('marksAndNumbers', '', { shouldValidate: true })
  }, [exporterId, setValue])

  const { data, error, isLoading } = useAsyncData(() => lookupApi.getMarksAndNumbers(exporterId), [exporterId], {
    enabled: Boolean(exporterId)
  })

  return { exporterId, options: data ?? [], isLoading, hasError: Boolean(error) }
}
