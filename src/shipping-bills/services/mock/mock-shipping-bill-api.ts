import type { SavedBill, ShippingBillFormValues } from '../../domain/types'
import { toApiPayload } from '../api-mappers'
import { ApiError, type ShippingBillApi } from '../types'
import { generateFlatFileContent } from './flat-file'
import { db, nextId, persist } from './mock-db'
import { respond } from './network'

const normalizeInvoiceNumber = (value: string) => value.trim().toLowerCase()

/**
 * Server-side rule (assumption): an invoice number may only be used once. Returns field errors keyed by
 * form path, exactly as a real 422 response body would, so the form's error mapping is exercised.
 */
function findDuplicateInvoiceNumbers(values: ShippingBillFormValues, billId?: number): Record<string, string> {
  const usedElsewhere = new Map<string, number>()
  for (const bill of db.bills) {
    if (bill.id === billId) continue
    for (const invoice of bill.values.invoices) {
      if (invoice.invoiceNumber.trim()) usedElsewhere.set(normalizeInvoiceNumber(invoice.invoiceNumber), bill.id)
    }
  }

  const errors: Record<string, string> = {}
  const seenInThisBill = new Set<string>()
  values.invoices.forEach((invoice, index) => {
    const key = normalizeInvoiceNumber(invoice.invoiceNumber)
    if (!key) return
    const otherBill = usedElsewhere.get(key)
    if (otherBill != null)
      errors[`invoices.${index}.invoiceNumber`] = `Invoice number is already used on bill #${otherBill}`
    else if (seenInThisBill.has(key))
      errors[`invoices.${index}.invoiceNumber`] = 'Invoice number is repeated in this bill'
    seenInThisBill.add(key)
  })
  return errors
}

export const mockShippingBillApi: ShippingBillApi = {
  list: () => respond(() => [...db.bills].sort((a, b) => b.updated.localeCompare(a.updated))),

  get: (id) => respond(() => db.bills.find((bill) => String(bill.id) === String(id)), 300),

  save: (values, id) =>
    respond(() => {
      const fieldErrors = findDuplicateInvoiceNumbers(values, id)
      if (Object.keys(fieldErrors).length > 0) throw new ApiError('Shipping bill was rejected', 422, fieldErrors)

      const now = new Date().toISOString()
      const previous = db.bills.find((bill) => bill.id === id)
      const record: SavedBill = {
        id: id ?? nextId(),
        created: previous?.created ?? now,
        updated: now,
        // The list screen shows party names, so the backend resolves them from the ids it was sent.
        values: {
          ...values,
          exporterName: db.exporters.find((e) => String(e.id) === values.exporterId)?.name ?? values.exporterName,
          consigneeName: db.businesses.find((b) => String(b.id) === values.consigneeId)?.name ?? values.consigneeName
        },
        payload: toApiPayload(values)
      }
      db.bills = [record, ...db.bills.filter((bill) => bill.id !== record.id)]
      persist()
      return record
    }, 600),

  getFlatFile: (id) =>
    respond(() => {
      const bill = db.bills.find((item) => String(item.id) === String(id))
      if (!bill) throw new ApiError(`Shipping bill ${id} not found`, 404)
      return {
        filename: `shipping_bill_${bill.values.jobNumber || bill.id}.sb`,
        content: generateFlatFileContent(bill)
      }
    }, 400)
}
