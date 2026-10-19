export type BillTab = 'details' | 'invoices' | 'documents'

export const BILL_TABS: readonly BillTab[] = ['details', 'invoices', 'documents']

// Top-level form fields that live on the "Details" tab.
const DETAILS_FIELDS = [
  'jobDate',
  'exporterId',
  'exporterBranchId',
  'consigneeId',
  'consigneeBranchId',
  'loadingPort',
  'finalDestinationPort',
  'grossWeight',
  'netWeight'
]

// Top-level array fields that live on the "Others" tab.
const OTHERS_FIELDS = ['containers', 'packingRanges', 'documents', 'licenses']

/** The tab holding the first validation error, so a failed submit can jump the user there. */
export function tabForErrors(errors: Record<string, unknown>): BillTab | undefined {
  if (DETAILS_FIELDS.some((field) => field in errors)) return 'details'
  if ('invoices' in errors) return 'invoices'
  if (OTHERS_FIELDS.some((field) => field in errors)) return 'documents'
  return undefined
}

/** Previous/next tab for the wizard-style footer buttons. */
export function adjacentTab(tab: BillTab, direction: 1 | -1): BillTab {
  const next = BILL_TABS.indexOf(tab) + direction
  return BILL_TABS[Math.min(Math.max(next, 0), BILL_TABS.length - 1)]
}
