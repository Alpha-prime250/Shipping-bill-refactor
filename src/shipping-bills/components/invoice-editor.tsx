import { useFieldArray } from 'core/form'
import { Button } from 'ui/basic/button'
import { Card, CardContent, CardHeader } from 'ui/basic/card'
import { Checkbox } from 'ui/inputs/checkbox'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { invoiceTotal } from '../domain/calculations'
import { emptyInvoice, emptyItem } from '../domain/defaults'
import type { ShippingBillFormValues } from '../domain/types'
import { useFormOptions } from '../hooks/form-options-context'
import { InvoiceCharges } from './charge-fields'
import type { BillFormContext } from './field-types'
import { dateType } from './field-types'
import { SectionHeading } from './form-layout'
import { ItemEditor } from './item-editor'
import { PartyFields } from './party-fields'

interface InvoiceEditorProps {
  formCtx: BillFormContext
  index: number
  canRemove: boolean
  onRemove: () => void
}

export function InvoiceEditor({ formCtx, index, canRemove, onRemove }: InvoiceEditorProps) {
  const { register, control, watch } = formCtx.hooks
  const options = useFormOptions()
  const invoice = watch(`invoices.${index}`) ?? emptyInvoice()
  const {
    fields: items,
    append: addItem,
    remove: removeItem
  } = useFieldArray({ control, name: `invoices.${index}.items` })

  return (
    <Card className="mb-4">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <h3 className="font-semibold">Invoice {index + 1}</h3>
        {canRemove && (
          <Button size="sm" variant="ghost" onClick={onRemove}>
            Remove invoice
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Invoice number" {...register(`invoices.${index}.invoiceNumber`)} />
          <Input label="Invoice date" type={dateType} {...register(`invoices.${index}.invoiceDate`)} />
          <div className="flex gap-2">
            <div className="w-[100px] shrink-0">
              <Select<ShippingBillFormValues>
                label="Currency"
                name={`invoices.${index}.currency`}
                options={options.currencies}
                rules={{ required: true }}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Total"
                type="number"
                min={0}
                {...register(`invoices.${index}.invoiceTotal`)}
                placeholder="0.00"
              />
            </div>
          </div>
          <Select<ShippingBillFormValues>
            label="Contract"
            name={`invoices.${index}.contractType`}
            options={options.contractTypes}
            rules={{ required: true }}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox {...register(`invoices.${index}.buyerSameAsConsignee`)} />
          Buyer & consignee are same
        </label>
        {!invoice.buyerSameAsConsignee && (
          <PartyFields
            formCtx={formCtx}
            role="buyer"
            ownerField={`invoices.${index}.buyerId`}
            branchField={`invoices.${index}.buyerBranchId`}
            label="Buyer"
          />
        )}

        <div className="space-y-4">
          <InvoiceCharges formCtx={formCtx} invoiceIndex={index} invoiceCurrency={invoice.currency} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select<ShippingBillFormValues>
              label="Price includes"
              name={`invoices.${index}.freightInsuranceIncluded`}
              options={options.priceInclusionTypes}
              placeholder="Select if applicable"
            />
            <Input label="Contract / order number" {...register(`invoices.${index}.contractNumber`)} />
            <Select<ShippingBillFormValues>
              label="Payment type"
              name={`invoices.${index}.natureOfPayment`}
              options={options.paymentTypes}
              placeholder="Select if applicable"
            />
            <Input label="Payment period (days)" type="number" {...register(`invoices.${index}.periodOfPayment`)} />
          </div>
          <PartyFields
            formCtx={formCtx}
            role="thirdParty"
            ownerField={`invoices.${index}.thirdPartyId`}
            branchField={`invoices.${index}.thirdPartyBranchId`}
            label="Third party (optional)"
            required={false}
          />
        </div>

        <div className="border-t border-gray-200 pt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <SectionHeading title="Goods" />
            <Button size="sm" variant="outline" onClick={() => addItem(emptyItem())}>
              + Add item
            </Button>
          </div>
          <div className="space-y-4">
            {items.map((field, itemIndex) => (
              <ItemEditor
                key={field.id}
                formCtx={formCtx}
                invoiceIndex={index}
                itemIndex={itemIndex}
                currency={invoice.currency}
                canRemove={items.length > 1}
                onRemove={() => removeItem(itemIndex)}
              />
            ))}
          </div>
        </div>

        <div className="text-right text-sm font-semibold">
          Invoice total: {invoice.currency}{' '}
          {invoiceTotal(invoice).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
      </CardContent>
    </Card>
  )
}
