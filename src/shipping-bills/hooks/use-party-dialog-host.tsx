import { useMemo, useState } from 'react'
import type { BillFormContext } from '../components/field-types'
import { partyKindOf } from '../domain/parties'
import type { Branch, Business, Exporter } from '../domain/types'
import { BranchDialog, PartyDialog } from '../party-dialogs'
import type { PartyDialogActions, PartyTarget } from './party-dialogs-context'

/**
 * Owns the "add party" and "add branch" dialogs. Pickers ask for them through `actions`
 * (provided via PartyDialogsContext); render `dialogs` once, anywhere under the form.
 * Whatever gets created is written straight back into the form fields the picker passed in.
 */
export function usePartyDialogHost(formCtx: BillFormContext) {
  const { setValue } = formCtx.hooks
  const [partyDialog, setPartyDialog] = useState<PartyTarget | null>(null)
  const [branchDialog, setBranchDialog] = useState<{ ownerId: number; target: PartyTarget } | null>(null)

  const actions = useMemo<PartyDialogActions>(
    () => ({
      addParty: setPartyDialog,
      addBranch: (ownerId, target) => setBranchDialog({ ownerId, target })
    }),
    []
  )

  function handlePartySaved(target: PartyTarget, party: Exporter | Business) {
    const branchId = party.branches[0]?.id
    if (!branchId) return
    setValue(target.ownerField, String(party.id), { shouldValidate: true })
    setValue(target.branchField, String(branchId), { shouldValidate: true })
  }

  const dialogs = (
    <>
      {partyDialog && (
        <PartyDialog
          key={`${partyDialog.role}-${partyDialog.ownerField}`}
          kind={partyKindOf(partyDialog.role)}
          initialRole={partyDialog.role === 'exporter' ? undefined : partyDialog.role}
          onClose={() => setPartyDialog(null)}
          onSaved={(party) => handlePartySaved(partyDialog, party)}
        />
      )}
      {branchDialog && (
        <BranchDialog
          key={`${branchDialog.target.branchField}-${branchDialog.ownerId}`}
          kind={partyKindOf(branchDialog.target.role)}
          ownerId={branchDialog.ownerId}
          onClose={() => setBranchDialog(null)}
          onSaved={(branch: Branch) =>
            setValue(branchDialog.target.branchField, String(branch.id), { shouldValidate: true })
          }
        />
      )}
    </>
  )

  return { actions, dialogs }
}
