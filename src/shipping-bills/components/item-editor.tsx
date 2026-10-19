import { Button } from 'ui/basic/button'
import { Checkbox } from 'ui/inputs/checkbox'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { lineTotal, schemeClaimsIncentive } from '../domain/calculations'
import { emptyItem } from '../domain/defaults'
import type { BillItemForm, ShippingBillFormValues } from '../domain/types'
import { useFormOptions } from '../hooks/form-options-context'
import type { BillFormContext } from './field-types'
import { dateType } from './field-types'
import { Advanced } from './form-layout'
import { PartyFields } from './party-fields'

interface ItemEditorProps {
  formCtx: BillFormContext
  invoiceIndex: number
  itemIndex: number
  currency: string
  canRemove: boolean
  onRemove: () => void
}

/** One goods line of an invoice. */
export function ItemEditor({ formCtx, invoiceIndex, itemIndex, currency, canRemove, onRemove }: ItemEditorProps) {
  const { register, watch } = formCtx.hooks
  const options = useFormOptions()
  const item: BillItemForm = watch(`invoices.${invoiceIndex}.items.${itemIndex}`) ?? emptyItem()

  // Typed field path for this item, e.g. field('ritcCode') -> `invoices.0.items.1.ritcCode`.
  const field = <K extends keyof BillItemForm>(key: K) => `invoices.${invoiceIndex}.items.${itemIndex}.${key}` as const

  const selectedScheme = options.schemeCodes.find((scheme) => scheme.value === item.schemeCode)

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold">Item {itemIndex + 1}</h4>
        {canRemove && (
          <Button size="sm" variant="ghost" onClick={onRemove}>
            Remove
          </Button>
        )}
      </div>
      <div className="mb-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Input label="RITC / HS code" {...register(field('ritcCode'))} placeholder="e.g. 61091000" />
        <Select<ShippingBillFormValues>
          label="Scheme code"
          name={field('schemeCode')}
          options={options.schemeCodes}
          placeholder="Select scheme"
        />
        <Input
          label="Goods description"
          {...register(field('goodsDescription1'))}
          wrapClass="lg:col-span-4"
          placeholder="e.g. Cotton T-shirts"
        />
        <Input label="Quantity" type="number" {...register(field('quantity'))} />
        <Select<ShippingBillFormValues>
          label="Unit"
          name={field('unitOfMeasurement')}
          options={options.quantityCodes}
          rules={{ required: true }}
        />
        <Input label={`Unit price (${currency || 'currency'})`} type="number" {...register(field('unitPrice'))} />
        <Input
          label="Item Total"
          type="number"
          placeholder={`${currency} ${lineTotal(item).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          {...register(field('lineTotal'))}
        />
        <Select<ShippingBillFormValues>
          label="IGST payment"
          name={field('igstPaymentStatus')}
          options={options.igstPaymentStatuses}
          placeholder="Select if applicable"
        />
      </div>

      <div className="mb-3 flex flex-wrap items-end gap-4">
        {schemeClaimsIncentive(selectedScheme) && (
          <>
            <div className="w-36">
              <Input label="Drawback Serial no." {...register(field('drawbackSerialNumber'))} />
            </div>
            <div className="w-32">
              <Input label="Drawback Unit" {...register(field('drawbackUnit'))} />
            </div>
            <div className="w-36">
              <Input label="Drawback Quantity" type="number" {...register(field('drawbackQuantity'))} />
            </div>
          </>
        )}
        <label className="flex items-center gap-2 pb-1 text-sm">
          <Checkbox {...register(field('rewardItem'))} />
          Claim reward
        </label>
        <label className="flex items-center gap-2 pb-1 text-sm">
          <Checkbox {...register(field('thirdPartyItem'))} />
          Third-party item
        </label>
      </div>

      {item.thirdPartyItem && (
        <div className="my-4">
          <PartyFields
            formCtx={formCtx}
            role="thirdParty"
            ownerField={field('itemThirdPartyId')}
            branchField={field('itemThirdPartyBranchId')}
            label="Item third party"
            required={false}
          />
        </div>
      )}

      <Advanced title="Item customs, taxes and incentives">
        <div className="mb-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select<ShippingBillFormValues>
            label="Unit of rate"
            name={field('unitOfRate')}
            options={options.quantityCodes}
            placeholder={item.unitOfMeasurement}
          />
          <Input label="Per Unit (Rate)" type="number" placeholder="1" {...register(field('numberOfUnits'))} />
          <Input label="Present market value" type="number" {...register(field('presentMarketValue'))} />
          <Input label="GCess" type="number" {...register(field('cess'))} />
          <Input
            label="Accessories description"
            wrapClass="lg:col-span-3"
            {...register(field('accessoriesDescription'))}
          />
          <Select<ShippingBillFormValues>
            label="Accessory status"
            name={field('accessoryStatus')}
            options={options.accessoryStatuses}
            placeholder="Select if relevant"
          />
          {item.igstPaymentStatus === 'P' && (
            <>
              <Input label="Taxable value" type="number" {...register(field('taxableValue'))} />
              <Input label="IGST amount" type="number" {...register(field('igstAmount'))} />
            </>
          )}
          <Input label="Origin district code" {...register(field('originDistrictCode'))} />
          <Select<ShippingBillFormValues>
            label="Trade agreement code"
            name={field('tradeAgreementsCode')}
            options={options.tradeAgreements}
            placeholder="NCPTI"
          />
          <Input label="End use code" {...register(field('endUseOfItem'))} />
          <Input label="Packages for item" type="number" {...register(field('totalPackage'))} />
        </div>
        <Advanced title="AR4 / excise details">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="AR4 number" {...register(field('ar4Number'))} />
            <Input label="AR4 date" type={dateType} {...register(field('ar4Date'))} />
          </div>
        </Advanced>
      </Advanced>
    </div>
  )
}
