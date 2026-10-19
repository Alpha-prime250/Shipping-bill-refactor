import type { Branch, Business, Exporter, PartyKind, PartyRole } from '../../domain/types'
import { ApiError, type BusinessInput, type ExporterInput, type NewBranch, type PartyApi } from '../types'
import { db, nextId, persist } from './mock-db'
import { respond } from './network'

const includes = (text: string, query: string) => text.toLowerCase().includes(query.trim().toLowerCase())

function findParty(role: PartyRole, id: string): Exporter | Business | undefined {
  const table: (Exporter | Business)[] = role === 'exporter' ? db.exporters : db.businesses
  return table.find((party) => String(party.id) === id)
}

const businessHasRole = (business: Business, role: PartyRole) =>
  role === 'consignee' ? business.isConsignee : role === 'buyer' ? business.isBuyer : business.isThirdParty

export const mockPartyApi: PartyApi = {
  searchParties: (role, query) =>
    respond(() => {
      if (role === 'exporter') {
        return db.exporters.filter((e) => !e.disabled && (includes(e.name, query) || includes(e.iec, query)))
      }
      return db.businesses.filter((b) => businessHasRole(b, role) && includes(b.name, query))
    }),

  getParty: (role, id) => respond(() => findParty(role, id), 100),

  searchBranches: (role, partyId, query) =>
    respond(() => {
      const party = findParty(role, partyId)
      return (party?.branches ?? []).filter((b) => includes(b.branchName, query) || includes(b.city, query))
    }),

  saveExporter: (input: ExporterInput) =>
    respond(() => {
      const id = input.id ?? nextId()
      const previous = db.exporters.find((record) => record.id === id)
      const { firstBranch, ...fields } = input
      const record: Exporter = {
        ...fields,
        id,
        branches: previous?.branches ?? (firstBranch ? [{ ...firstBranch, id: id + 1 }] : []),
        disabled: input.disabled ?? previous?.disabled
      }
      db.exporters = [...db.exporters.filter((item) => item.id !== id), record]
      persist()
      return record
    }),

  saveBusiness: (input: BusinessInput) =>
    respond(() => {
      const id = input.id ?? nextId()
      const previous = db.businesses.find((record) => record.id === id)
      const { firstBranch, ...fields } = input
      const record: Business = {
        ...fields,
        id,
        branches: previous?.branches ?? (firstBranch ? [{ ...firstBranch, id: id + 1 }] : [])
      }
      db.businesses = [...db.businesses.filter((item) => item.id !== id), record]
      persist()
      return record
    }),

  saveBranch: (kind: PartyKind, ownerId: number, input: NewBranch) =>
    respond(() => {
      const branch: Branch = { ...input, id: input.id ?? nextId() }
      const owner = findParty(kind === 'exporter' ? 'exporter' : 'consignee', String(ownerId))
      if (!owner) throw new ApiError(`Cannot add a branch: ${kind} ${ownerId} does not exist`, 404)
      owner.branches = [...owner.branches.filter((item) => item.id !== branch.id), branch]
      persist()
      return branch
    })
}
