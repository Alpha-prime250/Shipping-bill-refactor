import type { BillInvoiceForm, BillItemForm } from './types'

/** True when a form string holds something other than whitespace. */
export function isFilled(value: string | number | null | undefined): boolean {
  return value != null && String(value).trim() !== ''
}

/** A manually entered line total wins over `quantity x unit price`. */
export function lineTotal(item: BillItemForm): number {
  if (isFilled(item.lineTotal)) return Number(item.lineTotal)
  return Number(item.quantity) * Number(item.unitPrice)
}

/** Sum of the invoice's line totals. NaN-safe: unparseable lines count as zero. */
export function invoiceTotal(invoice: BillInvoiceForm): number {
  return invoice.items.reduce((sum, item) => sum + (lineTotal(item) || 0), 0)
}

/**
 * ISO country prefix of a UN/LOCODE port code ("INMUN1" -> "IN").
 * Assumption: every port code starts with its two-letter country code, which holds for UN/LOCODE.
 */
export function portCountry(code?: string): string {
  return code?.match(/^[A-Z]{2}/)?.[0] ?? ''
}

export function isIndianPort(code?: string): boolean {
  return portCountry(code) === 'IN'
}

/** Whether a scheme asks for drawback / RoDTEP / RoSCTL claim fields on the item. */
export function schemeClaimsIncentive(scheme?: { drawback?: boolean; RODTEP?: boolean; ROSCTL?: boolean }): boolean {
  return Boolean(scheme && (scheme.drawback || scheme.RODTEP || scheme.ROSCTL))
}
