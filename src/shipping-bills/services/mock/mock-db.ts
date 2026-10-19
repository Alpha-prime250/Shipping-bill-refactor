import type { Business, Exporter, SavedBill } from '../../domain/types'
import { seedBills } from './data/seed-bills'
import { seedBusinesses, seedExporters } from './data/seed-parties'

/** The mock backend's tables. Only the mock services touch this module. */
export interface MockData {
  exporters: Exporter[]
  businesses: Business[]
  bills: SavedBill[]
}

// Same key as the original demo store, so data entered before the refactor is still there.
const STORAGE_KEY = 'export-software-shipping-bills-v2'

function seedData(): MockData {
  return structuredClone({ exporters: seedExporters, businesses: seedBusinesses, bills: seedBills })
}

/** Adds seed rows that are missing from `stored` (matched by id), keeping everything the user saved. */
function mergeMissing<T extends { id: number }>(stored: T[], seed: T[]): T[] {
  const known = new Set(stored.map((row) => row.id))
  return [...stored, ...seed.filter((row) => !known.has(row.id))]
}

function load(): MockData {
  const seed = seedData()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const stored = JSON.parse(raw) as Partial<MockData>
      if (Array.isArray(stored.exporters) && Array.isArray(stored.businesses) && Array.isArray(stored.bills)) {
        return {
          exporters: mergeMissing(stored.exporters, seed.exporters),
          businesses: mergeMissing(stored.businesses, seed.businesses),
          bills: mergeMissing(stored.bills, seed.bills).map((bill) => ({
            ...bill,
            values: { ...bill.values, packingRanges: bill.values.packingRanges ?? [] }
          }))
        }
      }
    }
  } catch {
    // Storage unavailable or corrupt: fall back to the seed data.
  }
  return seed
}

export const db: MockData = load()

/** Call after every mutation. The in-memory data keeps working if storage is disabled. */
export function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Ignore: the mock still works for this session.
  }
}

export function nextId(): number {
  const ids = [
    ...db.exporters.flatMap((record) => [record.id, ...record.branches.map((branch) => branch.id)]),
    ...db.businesses.flatMap((record) => [record.id, ...record.branches.map((branch) => branch.id)]),
    ...db.bills.map((bill) => bill.id)
  ]
  return Math.max(3000, ...ids) + 1
}
