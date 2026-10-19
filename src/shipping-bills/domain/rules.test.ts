import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { emptyBill } from './defaults'
import { validateBillRules } from './rules'
import type { ShippingBillFormValues } from './types'

const validBill = (): ShippingBillFormValues => {
  const bill = { ...emptyBill(), loadingPort: 'INMUN1', finalDestinationPort: 'USLAX', jobDate: '2026-09-18' }
  bill.invoices[0].invoiceDate = bill.jobDate // emptyBill dates the invoice today, which would be after this job date
  return bill
}

const paths = (values: ShippingBillFormValues) => validateBillRules(values).map((issue) => issue.path)

describe('validateBillRules', () => {
  it('accepts a consistent bill', () => {
    assert.deepEqual(validateBillRules(validBill()), [])
  })

  it('rejects net weight above gross weight', () => {
    assert.deepEqual(paths({ ...validBill(), grossWeight: '10', netWeight: '12' }), ['netWeight'])
    assert.deepEqual(paths({ ...validBill(), grossWeight: '10', netWeight: '10' }), [])
  })

  it('requires an Indian loading port that differs from the destination', () => {
    assert.deepEqual(paths({ ...validBill(), loadingPort: 'DEHAM' }), ['loadingPort'])
    assert.deepEqual(paths({ ...validBill(), loadingPort: 'INMUN1', finalDestinationPort: 'INMUN1' }), [
      'finalDestinationPort'
    ])
  })

  it('rejects an invoice dated after the job', () => {
    const bill = validBill()
    bill.invoices[0].invoiceDate = '2026-09-19'
    assert.deepEqual(paths(bill), ['invoices.0.invoiceDate'])
  })

  it('requires freight for CF, insurance for CI and both for CIF', () => {
    const withContract = (contractType: string) => {
      const bill = validBill()
      bill.invoices[0] = { ...bill.invoices[0], contractType }
      return bill
    }
    assert.deepEqual(paths(withContract('FOB')), [])
    assert.deepEqual(paths(withContract('CF')), ['invoices.0.freightAmount'])
    assert.deepEqual(paths(withContract('CI')), ['invoices.0.insuranceAmount'])
    assert.deepEqual(paths(withContract('CIF')), ['invoices.0.freightAmount', 'invoices.0.insuranceAmount'])

    const withRate = withContract('CF')
    withRate.invoices[0].freightRate = '2'
    assert.deepEqual(paths(withRate), [])
  })

  it('requires taxable value and IGST amount when IGST is paid', () => {
    const bill = validBill()
    bill.invoices[0].items[0].igstPaymentStatus = 'P'
    assert.deepEqual(paths(bill), ['invoices.0.items.0.taxableValue', 'invoices.0.items.0.igstAmount'])
  })

  it('rejects a packing range that runs backwards', () => {
    const bill = validBill()
    bill.packingRanges = [{ packingNumberFrom: '10', packingNumberTo: '3' }]
    assert.deepEqual(paths(bill), ['packingRanges.0.packingNumberTo'])
  })
})
