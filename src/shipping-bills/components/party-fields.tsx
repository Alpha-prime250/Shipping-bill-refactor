import { useEffect } from 'react'
import { useAsyncData } from '@/shared/use-async-data'
import type { Branch, PartyRole } from '../domain/types'
import { usePartyDialogs } from '../hooks/party-dialogs-context'
import { partyApi } from '../services'
import { AsyncSelect } from './async-select'
import type { BillFormContext, PartyBranchField, PartyOwnerField } from './field-types'

interface PartyFieldsProps {
  formCtx: BillFormContext
  role: PartyRole
  ownerField: PartyOwnerField
  branchField: PartyBranchField
  label: string
  required?: boolean
}

const branchLabel = (branch: Branch) => `${branch.branchName} · ${branch.city}`

/** A party picker (exporter, consignee, buyer...) with its dependent branch picker. */
export function PartyFields({ formCtx, role, ownerField, branchField, label, required = true }: PartyFieldsProps) {
  const dialogs = usePartyDialogs()
  const { watch, getValues, setValue } = formCtx.hooks
  const ownerId = watch(ownerField) ?? ''
  const target = { role, ownerField, branchField }

  // Resolved so we know the branches on offer; reloads when a party or branch is added elsewhere on the page.
  const { data: owner } = useAsyncData(() => partyApi.getParty(role, ownerId), [role, ownerId], {
    enabled: Boolean(ownerId),
    tags: ['parties']
  })

  // A branch from a previously selected party must not survive a party change.
  useEffect(() => {
    const selectedBranch = getValues(branchField)
    if (
      selectedBranch &&
      owner &&
      owner.branches.length > 0 &&
      !owner.branches.some((branch) => String(branch.id) === selectedBranch)
    ) {
      setValue(branchField, '', { shouldValidate: true })
    }
  }, [branchField, getValues, setValue, owner])

  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{label}</span>
          <button
            type="button"
            className="text-primary-700 text-xs font-medium hover:underline"
            onClick={() => dialogs.addParty(target)}>
            + Add new
          </button>
        </div>
        <AsyncSelect
          name={ownerField}
          placeholder={`Search & select ${role === 'exporter' ? 'exporter' : 'business'}...`}
          rules={{ required }}
          fetchOptions={async (query) => {
            const parties = await partyApi.searchParties(role, query)
            return parties.map((party) => ({
              value: String(party.id),
              label: party.name,
              sublabel: role === 'exporter' && party.iec ? `IEC: ${party.iec}` : undefined
            }))
          }}
          getInitialLabel={async (id) => (await partyApi.getParty(role, id))?.name ?? ''}
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Branch / address</span>
          {owner && (
            <button
              type="button"
              className="text-primary-700 text-xs font-medium hover:underline"
              onClick={() => dialogs.addBranch(owner.id, target)}>
              + Add branch
            </button>
          )}
        </div>
        <AsyncSelect
          name={branchField}
          placeholder={
            owner ? 'Search & select branch...' : `Choose ${role === 'exporter' ? 'exporter' : 'business'} first`
          }
          disabled={!owner}
          rules={{ required: required || !!ownerId }}
          deps={[ownerId, owner]}
          fetchOptions={async (query) => {
            if (!ownerId) return []
            const branches = await partyApi.searchBranches(role, ownerId, query)
            return branches.map((branch) => ({
              value: String(branch.id),
              label: branchLabel(branch),
              sublabel: branch.address1
            }))
          }}
          getInitialLabel={async (id) => {
            const branch = owner?.branches.find((b) => String(b.id) === id)
            return branch ? branchLabel(branch) : ''
          }}
        />
      </div>
    </div>
  )
}
