import { createContext, useContext } from 'react'
import type { PartyBranchField, PartyOwnerField } from '../components/field-types'
import type { PartyRole } from '../domain/types'

/** The pair of form fields a party picker writes to. */
export interface PartyTarget {
  role: PartyRole
  ownerField: PartyOwnerField
  branchField: PartyBranchField
}

export interface PartyDialogActions {
  /** Open "add party"; once saved the new party and its first branch are written into `target`'s fields. */
  addParty: (target: PartyTarget) => void
  /** Open "add branch" for an existing party; the new branch is written into `target.branchField`. */
  addBranch: (ownerId: number, target: PartyTarget) => void
}

export const PartyDialogsContext = createContext<PartyDialogActions | null>(null)

export function usePartyDialogs(): PartyDialogActions {
  const actions = useContext(PartyDialogsContext)
  if (!actions) throw new Error('usePartyDialogs must be used inside <PartyDialogsContext.Provider>')
  return actions
}
