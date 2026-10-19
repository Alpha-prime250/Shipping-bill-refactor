import type { PartyKind, PartyRole } from './types'

/** Exporters and businesses are separate master tables; every role other than exporter is a business. */
export function partyKindOf(role: PartyRole): PartyKind {
  return role === 'exporter' ? 'exporter' : 'business'
}
