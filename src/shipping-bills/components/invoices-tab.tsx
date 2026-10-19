import { useFieldArray } from 'core/form'
import { Button } from 'ui/basic/button'
import { emptyInvoice } from '../domain/defaults'
import type { BillFormContext } from './field-types'
import { InvoiceEditor } from './invoice-editor'

/** "2. Invoices & goods" tab. */
export function InvoicesTab({ formCtx }: { formCtx: BillFormContext }) {
  const { fields, append, remove } = useFieldArray({ control: formCtx.hooks.control, name: 'invoices' })

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Invoices & goods</h2>
          <p className="text-sm text-gray-500">One invoice and one item are ready to fill in.</p>
        </div>
        <Button variant="outline" onClick={() => append(emptyInvoice())}>
          + Add invoice
        </Button>
      </div>
      {fields.map((field, index) => (
        <InvoiceEditor
          key={field.id}
          formCtx={formCtx}
          index={index}
          canRemove={fields.length > 1}
          onRemove={() => remove(index)}
        />
      ))}
    </>
  )
}
