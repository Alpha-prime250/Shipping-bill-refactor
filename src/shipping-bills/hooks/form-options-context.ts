import { createContext, useContext } from 'react'
import type { FormOptions } from '../services'

export const FormOptionsContext = createContext<FormOptions | null>(null)

/** Reference data for the selects. Only valid under the editor, which renders after the options have loaded. */
export function useFormOptions(): FormOptions {
  const options = useContext(FormOptionsContext)
  if (!options) throw new Error('useFormOptions must be used inside <FormOptionsContext.Provider>')
  return options
}
