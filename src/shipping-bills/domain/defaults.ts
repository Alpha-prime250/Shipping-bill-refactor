import type { BillInvoiceForm, BillItemForm, ShippingBillFormValues, SupportingDocForm } from './types'

/** Today as `YYYY-MM-DD`, the format `<input type="date">` expects. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function emptyItem(): BillItemForm {
  return {
    ritcCode: '',
    goodsDescription1: '',
    quantity: '',
    unitOfMeasurement: 'PCS',
    unitPrice: '',
    lineTotal: '',
    tradeAgreementsCode: 'NCPTI'
  }
}

export function emptyInvoice(invoiceDate: string = todayIso()): BillInvoiceForm {
  return {
    invoiceNumber: '',
    invoiceDate,
    currency: 'USD',
    contractType: 'FOB',
    buyerSameAsConsignee: true,
    buyerId: '',
    buyerBranchId: '',
    items: [emptyItem()]
  }
}

export function emptyDocument(): SupportingDocForm {
  return {
    documentTypeCode: '',
    documentReferenceNumber: '',
    documentIssueDate: todayIso()
  }
}

export function emptyBill(): ShippingBillFormValues {
  return {
    jobDate: todayIso(),
    exporterId: '',
    exporterBranchId: '',
    consigneeId: '',
    consigneeBranchId: '',
    loadingPort: '',
    finalDestinationPort: '',
    natureOfCargo: 'P',
    measurementUnit: 'KG',
    invoices: [emptyInvoice()],
    containers: [],
    packingRanges: [],
    documents: [],
    licenses: []
  }
}
