import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { emptyBill } from '../domain/defaults'
import { epochDaysToIso, fromApiListRow, isoToEpochDays, toApiPayload } from './api-mappers'

describe('dates', () => {
  it('round-trips ISO dates through epoch days', () => {
    assert.equal(isoToEpochDays('1970-01-02'), 1)
    assert.equal(epochDaysToIso(20714), '2026-09-18')
    assert.equal(isoToEpochDays(epochDaysToIso(20714)), 20714)
  })
  it('returns undefined for missing or invalid dates', () => {
    assert.equal(isoToEpochDays(undefined), undefined)
    assert.equal(isoToEpochDays('not a date'), undefined)
  })
})

describe('toApiPayload', () => {
  const bill = () => {
    const values = {
      ...emptyBill(),
      jobDate: '2026-09-18',
      exporterId: '1000',
      consigneeId: '2002',
      consigneeBranchId: '2003'
    }
    values.invoices[0] = {
      ...values.invoices[0],
      invoiceNumber: 'INV-1',
      currency: 'EUR',
      freightAmount: '12.5',
      items: [{ ...values.invoices[0].items[0], quantity: '3', unitPrice: '2' }]
    }
    return values
  }

  it('parses numbers and dates, and numbers lines from 1', () => {
    const payload = toApiPayload(bill())
    assert.equal(payload.exporterId, 1000)
    assert.equal(payload.jobDate, 20714)
    assert.equal(payload.invoices[0].serialNumber, 1)
    assert.equal(payload.invoices[0].items[0].quantity, 3)
    assert.equal(payload.invoices[0].items[0].itemSerialNumber, 1)
  })

  it('uses the consignee as buyer when they are the same', () => {
    const payload = toApiPayload(bill())
    assert.equal(payload.invoices[0].buyerId, 2002)
    assert.equal(payload.invoices[0].buyerAddressId, 2003)
  })

  it('maps currencies to numeric codes and defaults charge currencies to the invoice currency', () => {
    const invoice = toApiPayload(bill()).invoices[0]
    assert.equal(invoice.currency, 978)
    assert.equal(invoice.freightCurrency, 978)
    assert.equal(invoice.freightAmount, 12.5)
    assert.equal(invoice.insuranceAmount, 0)
  })

  it('omits letter-coded options that have no numeric code instead of sending NaN', () => {
    assert.equal(toApiPayload(bill()).invoices[0].contractType, undefined)
  })

  it('reports the real container count and defaults the discharge port to the destination', () => {
    const values = {
      ...bill(),
      finalDestinationPort: 'USLAX',
      containers: [{ containerNumber: 'A' }, { containerNumber: 'B' }]
    }
    const payload = toApiPayload(values)
    assert.equal(payload.numberOfContainers, 2)
    assert.equal(payload.dischargePort, 'USLAX')
  })
})

describe('fromApiListRow', () => {
  it('builds a bill summary with a placeholder invoice dated to the job', () => {
    const bill = fromApiListRow({
      id: 1000,
      jobNumber: 150011,
      jobDate: 20728,
      exporterName: 'Amit Exports',
      consigneeName: 'H&M',
      loadingPort: 'INMUN1',
      dischargePort: 'KRBUS',
      destinationPort: 'KRBUS',
      updated: 1790967817
    })
    assert.equal(bill.values.jobDate, '2026-10-02')
    assert.equal(bill.values.finalDestinationPort, 'KRBUS')
    assert.equal(bill.values.invoices[0].invoiceDate, '2026-10-02')
    assert.equal(bill.updated, '2026-10-02T19:03:37.000Z')
  })
})
