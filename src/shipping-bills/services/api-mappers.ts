import { isFilled } from '../domain/calculations'
import { emptyBill, emptyInvoice } from '../domain/defaults'
import type { SavedBill, ShippingBillFormValues } from '../domain/types'

/**
 * Translation between the form's shape (strings, display codes) and the backend contract
 * (numbers, epoch days, numeric currency codes). Every real HTTP implementation of ShippingBillApi
 * should send `toApiPayload(values)`, so the form never needs to know the wire format.
 */

const MS_PER_DAY = 86_400_000

/** `2026-09-18` -> days since 1970-01-01 (the backend's date format). */
export function isoToEpochDays(iso?: string): number | undefined {
  if (!iso) return undefined
  const ms = new Date(iso).getTime()
  return Number.isNaN(ms) ? undefined : Math.floor(ms / MS_PER_DAY)
}

export function epochDaysToIso(days: number): string {
  return new Date(days * MS_PER_DAY).toISOString().slice(0, 10)
}

export function epochSecondsToIso(seconds: number): string {
  return new Date(seconds * 1000).toISOString()
}

/** ISO 4217 numeric codes for the currencies the form offers. */
const CURRENCY_CODES: Record<string, number> = { USD: 840, INR: 356, EUR: 978, AED: 784, GBP: 826, SGD: 702 }
const DEFAULT_CURRENCY_CODE = CURRENCY_CODES.USD

function num(value?: string | number | null): number | undefined {
  if (!isFilled(value)) return undefined
  const parsed = Number(value)
  // Letter-coded form options (e.g. contract type "FOB") have no numeric code defined yet: omit rather than send NaN.
  return Number.isFinite(parsed) ? parsed : undefined
}

const numOrZero = (value?: string | number | null) => num(value) ?? 0

function currencyCode(currency?: string): number {
  return currency ? (CURRENCY_CODES[currency] ?? num(currency) ?? DEFAULT_CURRENCY_CODE) : DEFAULT_CURRENCY_CODE
}

/** Body for `POST /api/shipping-bills`. */
export function toApiPayload(values: ShippingBillFormValues) {
  return {
    chaId: 1000,
    jobDate: isoToEpochDays(values.jobDate),
    exporterId: num(values.exporterId),
    exporterBranchId: num(values.exporterBranchId),
    consigneeId: num(values.consigneeId),
    consigneeAddressId: num(values.consigneeBranchId),
    originStateCode: num(values.originStateCode),
    loadingPort: values.loadingPort,
    finalDestinationPort: values.finalDestinationPort,
    dischargePort: values.dischargePort || values.finalDestinationPort,
    sealType: num(values.sealType),
    natureOfCargo: num(values.natureOfCargo),
    grossWeight: num(values.grossWeight),
    netWeight: num(values.netWeight),
    measurementUnit: values.measurementUnit === 'KG' ? 'KGS' : values.measurementUnit,
    totalPackages: num(values.totalPackages),
    marksAndNumbers: values.marksAndNumbers,
    loosePackets: num(values.loosePackets),
    numberOfContainers: values.containers.length || num(values.numberOfContainers) || 0,
    invoices: values.invoices.map((invoice, index) => {
      const buyerId = invoice.buyerSameAsConsignee ? values.consigneeId : invoice.buyerId
      const buyerBranchId = invoice.buyerSameAsConsignee ? values.consigneeBranchId : invoice.buyerBranchId
      return {
        serialNumber: index + 1,
        invoiceNumber: invoice.invoiceNumber,
        date: isoToEpochDays(invoice.invoiceDate),
        currency: currencyCode(invoice.currency),
        contractType: num(invoice.contractType),
        buyerId: num(buyerId),
        buyerAddressId: num(buyerBranchId),
        // Each charge falls back to the invoice currency when no currency was picked for it.
        freightCurrency: currencyCode(invoice.freightCurrency || invoice.currency),
        freightAmount: numOrZero(invoice.freightAmount),
        insuranceCurrency: currencyCode(invoice.insuranceCurrency || invoice.currency),
        insuranceAmount: numOrZero(invoice.insuranceAmount),
        commissionCurrency: currencyCode(invoice.commissionCurrency || invoice.currency),
        commissionAmount: numOrZero(invoice.commissionAmount),
        discountCurrency: currencyCode(invoice.discountCurrency || invoice.currency),
        discountAmount: numOrZero(invoice.discountAmount),
        otherDeductionsCurrency: currencyCode(invoice.otherDeductionsCurrency || invoice.currency),
        otherDeductionsAmount: numOrZero(invoice.otherDeductionsAmount),
        freightInsauranceIncluded: num(invoice.freightInsuranceIncluded),
        packingCharges: numOrZero(invoice.packingCharges),
        natureOfPayment: num(invoice.natureOfPayment),
        periodOfPayment: num(invoice.periodOfPayment),
        items: invoice.items.map((item, itemIndex) => ({
          itemSerialNumber: itemIndex + 1,
          schemeCode: item.schemeCode,
          ritcCode: item.ritcCode,
          goodsDescription: item.goodsDescription1,
          unitOfMeasurement: item.unitOfMeasurement,
          quantity: num(item.quantity),
          unitPrice: num(item.unitPrice),
          unitOfRate: item.unitOfRate || item.unitOfMeasurement,
          noOfUnits: num(item.numberOfUnits) || 1,
          presentMarketValue: num(item.presentMarketValue),
          thirdParty: Boolean(item.thirdPartyItem),
          rewardItem: Boolean(item.rewardItem),
          totalPackage: num(item.totalPackage),
          endUseOfItem: item.endUseOfItem,
          igstPaymentStatus: num(item.igstPaymentStatus),
          originDistrictCode: num(item.originDistrictCode),
          tradeAgreementsCode: item.tradeAgreementsCode,
          drawbackSerialNumber: item.drawbackSerialNumber,
          drawbackQuantity: num(item.drawbackQuantity)
        }))
      }
    }),
    packgingList: values.packingRanges.map((range) => ({
      packingNumberFrom: num(range.packingNumberFrom),
      packingNumberTo: num(range.packingNumberTo),
      packingCode: range.packingCode
    })),
    documents: values.documents.map((doc, index) => ({
      invoiceSerialNumber: num(doc.invoiceSerialNumber) || 1,
      itemSerialNumber: num(doc.itemSerialNumber) || 1,
      serialNumber: index + 1,
      imageReferenceNumber: doc.imageReferenceNumber,
      documentTypeCode: doc.documentTypeCode,
      documentIssueDate: isoToEpochDays(doc.documentIssueDate),
      useDefault: true,
      fileType: num(doc.fileType) || 1
    }))
  }
}

/** One row of `GET /api/shipping-bills` (the list endpoint returns summaries, not full bills). */
export interface ApiBillListRow {
  id: number
  jobNumber: number
  /** Epoch days. */
  jobDate: number
  exporterName: string
  consigneeName: string
  loadingPort: string
  dischargePort: string
  destinationPort: string
  /** Epoch seconds. */
  updated: number
}

export function fromApiListRow(row: ApiBillListRow): SavedBill {
  const jobDate = epochDaysToIso(row.jobDate)
  const updated = epochSecondsToIso(row.updated)
  return {
    id: row.id,
    created: updated,
    updated,
    values: {
      ...emptyBill(),
      jobNumber: String(row.jobNumber),
      jobDate,
      exporterName: row.exporterName,
      consigneeName: row.consigneeName,
      loadingPort: row.loadingPort,
      dischargePort: row.dischargePort,
      finalDestinationPort: row.destinationPort,
      // A summary has no invoices; date the placeholder invoice to the job so it passes the date rule.
      invoices: [emptyInvoice(jobDate)]
    }
  }
}
