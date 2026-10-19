import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { emptyBill } from '../../domain/defaults'
import { ApiError } from '../types'
import { mockPartyApi } from './mock-party-api'
import { mockShippingBillApi as api } from './mock-shipping-bill-api'
import { mockNetwork } from './network'

const billWithInvoice = (invoiceNumber: string) => {
  const values = { ...emptyBill(), exporterId: '1000', consigneeId: '2002' }
  values.invoices[0] = { ...values.invoices[0], invoiceNumber }
  return values
}

beforeEach(() => {
  mockNetwork.latencyMs = 0
  mockNetwork.failNext = false
})

describe('mock shipping bill api', () => {
  it('lists seeded bills newest first', async () => {
    const bills = await api.list()
    assert.ok(bills.length > 1)
    assert.deepEqual(
      bills.map((b) => b.updated),
      bills
        .map((b) => b.updated)
        .sort()
        .reverse()
    )
  })

  it('resolves undefined for an unknown bill', async () => {
    assert.equal(await api.get(424242), undefined)
  })

  it('creates a bill, resolves party names and stores the request payload', async () => {
    const saved = await api.save(billWithInvoice('T-CREATE-1'))
    assert.equal(saved.values.exporterName, 'Aarav Textiles Pvt Ltd')
    assert.equal(saved.values.consigneeName, 'Northstar Trading Inc')
    assert.ok(saved.payload)
    assert.equal((await api.get(saved.id))?.id, saved.id)
  })

  it('updates in place when an id is given', async () => {
    const saved = await api.save(billWithInvoice('T-UPDATE-1'))
    const again = await api.save({ ...saved.values, jobNumber: '77' }, saved.id)
    assert.equal(again.id, saved.id)
    assert.equal(again.created, saved.created)
    assert.equal((await api.list()).filter((b) => b.id === saved.id).length, 1)
  })

  it('rejects a duplicate invoice number with field errors (422)', async () => {
    await api.save(billWithInvoice('T-DUP-1'))
    await assert.rejects(api.save(billWithInvoice('t-dup-1 ')), (error: unknown) => {
      assert.ok(error instanceof ApiError)
      assert.equal(error.status, 422)
      assert.ok(error.fieldErrors?.['invoices.0.invoiceNumber'])
      return true
    })
  })

  it('fails once when failNext is set, then recovers', async () => {
    mockNetwork.failNext = true
    await assert.rejects(api.list(), (error: unknown) => error instanceof ApiError && error.status === 503)
    assert.ok((await api.list()).length > 0)
  })

  it('produces a flat file for an existing bill and 404s for a missing one', async () => {
    const file = await api.getFlatFile(3000)
    assert.match(file.filename, /\.sb$/)
    assert.match(file.content, /^HREC/)
    assert.match(file.content, /Cotton T-shirts/)
    await assert.rejects(api.getFlatFile(424242), (error: unknown) => error instanceof ApiError && error.status === 404)
  })
})

describe('mock party api', () => {
  it('filters businesses by role and exporters by query', async () => {
    mockNetwork.latencyMs = 0
    const consignees = await mockPartyApi.searchParties('consignee', '')
    assert.ok(consignees.length > 0 && consignees.every((p) => 'isConsignee' in p && p.isConsignee))
    const exporters = await mockPartyApi.searchParties('exporter', 'aarav')
    assert.deepEqual(
      exporters.map((p) => p.id),
      [1000]
    )
  })

  it('adds a branch to an existing party and rejects an unknown owner', async () => {
    const branch = await mockPartyApi.saveBranch('exporter', 1000, {
      branchName: 'Test branch',
      address1: '1 Road',
      city: 'Surat',
      countryCode: 'IN'
    })
    const owner = await mockPartyApi.getParty('exporter', '1000')
    assert.ok(owner?.branches.some((b) => b.id === branch.id))
    await assert.rejects(
      mockPartyApi.saveBranch('exporter', 9, { branchName: 'x', address1: 'x', city: 'x', countryCode: 'IN' })
    )
  })
})
