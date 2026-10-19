/** Invoice-level charges that can each be entered as a rate (%) or a flat amount, in their own currency. */
export const CHARGES = [
  { key: 'freight', label: 'Freight' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'commission', label: 'Commission' },
  { key: 'discount', label: 'Discount' },
  { key: 'otherDeductions', label: 'Other Deductions' }
] as const

export type Charge = (typeof CHARGES)[number]
