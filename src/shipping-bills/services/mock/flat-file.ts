import { lineTotal } from '../../domain/calculations'
import type { SavedBill } from '../../domain/types'

const clean = (text = '') => text.replace(/[\^\r\n]+/g, ' ')

/**
 * Renders a bill as an ICEGATE-style `.sb` flat file. In production this is the backend's job;
 * the mock backend does it here so the download flow can be built end to end.
 */
export function generateFlatFileContent(bill: SavedBill): string {
  const v = bill.values
  const port = v.loadingPort || 'INMUN1'
  const lines: string[] = []

  lines.push(`HREC**ZZ*${port}*ZZ*ICEGATE*01*SB*1.0*`)
  lines.push('<TABLE>SHIPPING_BILL')
  lines.push(
    '<F>MESSAGE_TYPE^CHA_ID^JOB_NO^JOB_DATE^EXPORTER_ID^EXPORTER_BRANCH^CONSIGNEE_ID^LOADING_PORT^DEST_PORT^DISCHARGE_PORT^SEAL_TYPE^NATURE_OF_CARGO^GROSS_WEIGHT^NET_WEIGHT^UOM^PACKAGES^MARKS'
  )
  const shippingBillRow = [
    'F',
    1000,
    v.jobNumber || bill.id,
    v.jobDate,
    v.exporterId,
    v.exporterBranchId,
    v.consigneeId,
    v.loadingPort,
    v.finalDestinationPort,
    v.dischargePort || v.finalDestinationPort,
    v.sealType,
    v.natureOfCargo,
    v.grossWeight,
    v.netWeight,
    v.measurementUnit || 'KGS',
    v.totalPackages,
    clean(v.marksAndNumbers)
  ]
  lines.push(`<R>${shippingBillRow.map((field) => field ?? '').join('^')}`)

  if (v.invoices.length > 0) {
    lines.push('<TABLE>INVOICE')
    lines.push('<F>INVOICE_SN^INVOICE_NO^INVOICE_DATE^CURRENCY^CONTRACT_TYPE^BUYER_ID^FREIGHT_AMOUNT^INSURANCE_AMOUNT')
    v.invoices.forEach((inv, index) => {
      const buyerId = inv.buyerSameAsConsignee ? v.consigneeId : inv.buyerId
      lines.push(
        `<R>${index + 1}^${inv.invoiceNumber}^${inv.invoiceDate}^${inv.currency || 'USD'}^${inv.contractType || '1'}^${buyerId || v.consigneeId}^${inv.freightAmount || 0}^${inv.insuranceAmount || 0}`
      )
    })

    lines.push('<TABLE>ITEM')
    lines.push('<F>INVOICE_SN^ITEM_SN^RITC_CODE^DESCRIPTION^QUANTITY^UOM^UNIT_PRICE^LINE_TOTAL^SCHEME_CODE')
    v.invoices.forEach((inv, invoiceIndex) => {
      inv.items.forEach((item, itemIndex) => {
        lines.push(
          `<R>${invoiceIndex + 1}^${itemIndex + 1}^${item.ritcCode}^${clean(item.goodsDescription1)}^${item.quantity}^${item.unitOfMeasurement || 'PCS'}^${item.unitPrice}^${(lineTotal(item) || 0).toFixed(2)}^${item.schemeCode ?? ''}`
        )
      })
    })
  }

  if (v.packingRanges.length > 0) {
    lines.push('<TABLE>PACKING')
    lines.push('<F>FROM_PKG^TO_PKG^PKG_CODE')
    v.packingRanges.forEach((range) => {
      lines.push(`<R>${range.packingNumberFrom}^${range.packingNumberTo}^${range.packingCode || 'CTN'}`)
    })
  }

  lines.push(`TREC**ZZ*${port}*ZZ*ICEGATE*01*SB*1.0*`)
  return lines.join('\r\n')
}
