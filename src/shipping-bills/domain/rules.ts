import { isFilled, isIndianPort } from './calculations'
import type { ShippingBillFormValues } from './types'

/**
 * Cross-field business rules that a per-field schema cannot express.
 * Pure and framework-free so they are cheap to unit test; the form maps each issue onto its field.
 *
 * Domain assumptions (kept deliberately small, see README):
 *  - Port of loading is an Indian port and differs from the final destination.
 *  - Net weight cannot exceed gross weight.
 *  - An invoice cannot be dated after the job (shipping bill) date.
 *  - CF / CI / CIF contracts include freight and/or insurance, so those must be declared.
 *  - A packing range runs upwards (from <= to).
 *  - IGST "against payment" needs the taxable value and the IGST amount.
 */
export interface BillIssue {
  /** react-hook-form field path, e.g. `invoices.0.invoiceDate`. */
  path: string
  message: string
}

const CONTRACT_REQUIREMENTS: Record<string, readonly ('freight' | 'insurance')[]> = {
  CF: ['freight'],
  CI: ['insurance'],
  CIF: ['freight', 'insurance']
}

export function validateBillRules(values: ShippingBillFormValues): BillIssue[] {
  const issues: BillIssue[] = []
  const add = (path: string, message: string) => issues.push({ path, message })

  if (
    isFilled(values.grossWeight) &&
    isFilled(values.netWeight) &&
    Number(values.netWeight) > Number(values.grossWeight)
  ) {
    add('netWeight', 'Net weight cannot exceed gross weight')
  }

  if (values.loadingPort && !isIndianPort(values.loadingPort)) {
    add('loadingPort', 'Port of loading must be an Indian port')
  }
  if (values.loadingPort && values.loadingPort === values.finalDestinationPort) {
    add('finalDestinationPort', 'Destination must differ from the port of loading')
  }

  values.invoices.forEach((invoice, invoiceIndex) => {
    const base = `invoices.${invoiceIndex}`

    if (values.jobDate && invoice.invoiceDate && invoice.invoiceDate > values.jobDate) {
      add(`${base}.invoiceDate`, 'Invoice date cannot be after the job date')
    }

    for (const charge of CONTRACT_REQUIREMENTS[invoice.contractType] ?? []) {
      const rate = invoice[`${charge}Rate`]
      const amount = invoice[`${charge}Amount`]
      if (!isFilled(rate) && !isFilled(amount)) {
        add(
          `${base}.${charge}Amount`,
          `${charge === 'freight' ? 'Freight' : 'Insurance'} is required for ${invoice.contractType} contracts`
        )
      }
    }

    invoice.items.forEach((item, itemIndex) => {
      if (item.igstPaymentStatus !== 'P') return
      const itemBase = `${base}.items.${itemIndex}`
      if (!isFilled(item.taxableValue)) add(`${itemBase}.taxableValue`, 'Required when IGST is paid')
      if (!isFilled(item.igstAmount)) add(`${itemBase}.igstAmount`, 'Required when IGST is paid')
    })
  })

  values.packingRanges.forEach((range, index) => {
    if (
      isFilled(range.packingNumberFrom) &&
      isFilled(range.packingNumberTo) &&
      Number(range.packingNumberFrom) > Number(range.packingNumberTo)
    ) {
      add(`packingRanges.${index}.packingNumberTo`, 'Must not be lower than "from"')
    }
  })

  return issues
}
