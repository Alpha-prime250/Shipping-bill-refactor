import { routes } from '@/shared/route-paths'
import { useForm } from 'core/form'
import { Form } from 'core/form/components'
import { navigate } from 'core/routing'
import { toast } from 'core/toast-manager'
import { useEffect, useState } from 'react'
import { Button } from 'ui/basic/button'
import { Tabs, TabsList, TabsTrigger } from 'ui/interactive/tabs'
import { billSchema } from './bill-schema'
import { DetailsTab } from './components/details-tab'
import { PersistentTab } from './components/form-layout'
import { InvoicesTab } from './components/invoices-tab'
import { OthersTab } from './components/others-tab'
import { WorkflowSteps } from './components/workflow-steps'
import { emptyBill } from './domain/defaults'
import { validateBillRules, type BillIssue } from './domain/rules'
import { adjacentTab, tabForErrors, type BillTab } from './domain/tabs'
import type { SavedBill, ShippingBillFormValues } from './domain/types'
import { FormOptionsContext } from './hooks/form-options-context'
import { PartyDialogsContext } from './hooks/party-dialogs-context'
import { usePartyDialogHost } from './hooks/use-party-dialog-host'
import { ApiError, shippingBillApi, type FormOptions } from './services'

interface BillEditorProps {
  /** The bill being edited; omit to start a new one. */
  bill?: SavedBill
  options: FormOptions
}

export function BillEditor({ bill, options }: BillEditorProps) {
  const formCtx = useForm<ShippingBillFormValues>(billSchema, { defaultValues: bill?.values ?? emptyBill() })
  const { setError, getValues, formState } = formCtx.hooks
  const [activeTab, setActiveTab] = useState<BillTab>('details')
  const [draftId, setDraftId] = useState<number | undefined>(bill?.id)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const partyDialogs = usePartyDialogHost(formCtx)

  // After a failed submit, tell the user and jump to the first tab with an error.
  useEffect(() => {
    if (!formState.submitCount || !Object.keys(formState.errors).length) return
    toast.error('Please check the required fields')
    const tab = tabForErrors(formState.errors)
    if (tab) setActiveTab(tab)
  }, [formState.submitCount, formState.errors])

  /** Puts server / business-rule messages on their fields and shows the tab that has them. */
  function showFieldErrors(errors: BillIssue[]) {
    errors.forEach(({ path, message }) => setError(path as Parameters<typeof setError>[0], { type: 'server', message }))
    const tab = tabForErrors(Object.fromEntries(errors.map(({ path }) => [path.split('.')[0], true])))
    if (tab) setActiveTab(tab)
    toast.error(errors.length === 1 ? errors[0].message : 'Please fix the highlighted fields')
  }

  /** Saves, reporting failures to the user. Returns the saved bill, or undefined if it failed. */
  async function save(values: ShippingBillFormValues): Promise<SavedBill | undefined> {
    try {
      const saved = await shippingBillApi.save(values, draftId)
      setDraftId(saved.id)
      return saved
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        showFieldErrors(Object.entries(error.fieldErrors).map(([path, message]) => ({ path, message })))
      } else {
        toast.error(
          error instanceof Error ? `Failed to save shipping bill: ${error.message}` : 'Failed to save shipping bill'
        )
      }
      return undefined
    }
  }

  async function handleSave(values: ShippingBillFormValues) {
    const issues = validateBillRules(values)
    if (issues.length > 0) return showFieldErrors(issues)

    const saved = await save(values)
    if (!saved) return
    toast.success(bill ? 'Shipping bill updated' : 'Shipping bill created')
    navigate(routes.toShippingBillEdit(saved.id))
  }

  /** "Previous" / "Save & Next" keep what has been typed so far, without requiring the bill to be valid yet. */
  async function moveToTab(direction: 1 | -1) {
    setIsSavingDraft(true)
    const saved = await save(getValues())
    setIsSavingDraft(false)
    if (!saved) return
    if (direction === 1) toast.success('Details saved')
    setActiveTab(adjacentTab(activeTab, direction))
  }

  return (
    <FormOptionsContext.Provider value={options}>
      <PartyDialogsContext.Provider value={partyDialogs.actions}>
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <button className="mb-2 text-sm text-gray-500 hover:underline" onClick={() => navigate(routes.dashboard)}>
                ← Shipping bills
              </button>
              <h1 className="text-2xl font-semibold text-gray-950">
                {bill ? `Edit shipping bill #${bill.id}` : 'New shipping bill'}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Enter the everyday details first. Open advanced sections only when needed.
              </p>
            </div>
          </div>
          <WorkflowSteps />
          <Form ctx={formCtx} handleSubmit={handleSave} className="space-y-5">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(String(value) as BillTab)}>
              <TabsList className="flex w-full justify-start overflow-x-auto">
                <TabsTrigger value="details">1. Details</TabsTrigger>
                <TabsTrigger value="invoices">2. Invoices & goods</TabsTrigger>
                <TabsTrigger value="documents">3. Others</TabsTrigger>
              </TabsList>

              <PersistentTab value="details" activeTab={activeTab} className="space-y-4">
                <DetailsTab formCtx={formCtx} />
              </PersistentTab>
              <PersistentTab value="invoices" activeTab={activeTab} className="space-y-4">
                <InvoicesTab formCtx={formCtx} />
              </PersistentTab>
              <PersistentTab value="documents" activeTab={activeTab} className="space-y-4">
                <OthersTab formCtx={formCtx} />
              </PersistentTab>
            </Tabs>
            <div className="flex flex-wrap justify-between gap-2 border-t border-gray-200 pt-4">
              <Button variant="outline" type="button" onClick={() => navigate(routes.dashboard)}>
                Cancel
              </Button>
              <div className="flex gap-2">
                {activeTab !== 'details' && (
                  <Button variant="outline" type="button" disabled={isSavingDraft} onClick={() => moveToTab(-1)}>
                    Previous
                  </Button>
                )}
                {activeTab !== 'documents' ? (
                  <Button type="button" disabled={isSavingDraft} onClick={() => moveToTab(1)}>
                    {isSavingDraft ? 'Saving...' : 'Save & Next'}
                  </Button>
                ) : (
                  <Button type="submit">Save changes</Button>
                )}
              </div>
            </div>
          </Form>
          {partyDialogs.dialogs}
        </div>
      </PartyDialogsContext.Provider>
    </FormOptionsContext.Provider>
  )
}
