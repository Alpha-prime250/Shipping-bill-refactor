import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { invoiceTotal, isFilled, isIndianPort, lineTotal, portCountry, schemeClaimsIncentive } from './calculations'
import { emptyInvoice, emptyItem } from './defaults'

const item = (fields: Partial<ReturnType<typeof emptyItem>>) => ({ ...emptyItem(), ...fields })

describe('lineTotal', () => {
  it('multiplies quantity by unit price', () => {
    assert.equal(lineTotal(item({ quantity: '4', unitPrice: '2.5' })), 10)
  })
  it('prefers a manually entered total', () => {
    assert.equal(lineTotal(item({ quantity: '4', unitPrice: '2.5', lineTotal: '99' })), 99)
  })
  it('ignores a blank manual total', () => {
    assert.equal(lineTotal(item({ quantity: '2', unitPrice: '3', lineTotal: '  ' })), 6)
  })
})

describe('invoiceTotal', () => {
  it('sums the lines and treats unparseable lines as zero', () => {
    const invoice = emptyInvoice()
    invoice.items = [
      item({ quantity: '2', unitPrice: '5' }),
      item({ quantity: '', unitPrice: '' }),
      item({ lineTotal: '1.5' })
    ]
    assert.equal(invoiceTotal(invoice), 11.5)
  })
})

describe('ports', () => {
  it('derives the country from the UN/LOCODE prefix', () => {
    assert.equal(portCountry('INMUN1'), 'IN')
    assert.equal(portCountry('USLAX'), 'US')
    assert.equal(portCountry(''), '')
    assert.equal(portCountry(undefined), '')
  })
  it('recognises Indian ports', () => {
    assert.equal(isIndianPort('INNSA1'), true)
    assert.equal(isIndianPort('DEHAM'), false)
  })
})

it('isFilled ignores whitespace and nullish values', () => {
  assert.equal(isFilled(' '), false)
  assert.equal(isFilled(undefined), false)
  assert.equal(isFilled(0), true)
})

it('schemeClaimsIncentive is true for drawback, RoDTEP and RoSCTL schemes only', () => {
  assert.equal(schemeClaimsIncentive(undefined), false)
  assert.equal(schemeClaimsIncentive({ drawback: false, RODTEP: false, ROSCTL: false }), false)
  assert.equal(schemeClaimsIncentive({ drawback: false, RODTEP: true, ROSCTL: false }), true)
})
