import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { adjacentTab, tabForErrors } from './tabs'

describe('tabForErrors', () => {
  it('maps errors to the tab that holds the field', () => {
    assert.equal(tabForErrors({ exporterId: {} }), 'details')
    assert.equal(tabForErrors({ invoices: [] }), 'invoices')
    assert.equal(tabForErrors({ licenses: [] }), 'documents')
    assert.equal(tabForErrors({ somethingElse: {} }), undefined)
  })
  it('prefers the earliest tab', () => {
    assert.equal(tabForErrors({ invoices: [], netWeight: {}, documents: [] }), 'details')
    assert.equal(tabForErrors({ documents: [], invoices: [] }), 'invoices')
  })
})

it('adjacentTab stays within the first and last tab', () => {
  assert.equal(adjacentTab('details', 1), 'invoices')
  assert.equal(adjacentTab('details', -1), 'details')
  assert.equal(adjacentTab('documents', 1), 'documents')
  assert.equal(adjacentTab('documents', -1), 'invoices')
})
