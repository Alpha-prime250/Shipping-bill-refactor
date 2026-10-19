import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { isFilled } from '../domain/calculations'
import { CHARGES, type Charge } from '../domain/charges'
import type { ShippingBillFormValues } from '../domain/types'
import { useFormOptions } from '../hooks/form-options-context'
import type { BillFormContext } from './field-types'

const CELL = 'p-2'
const CELL_LAYOUT = 'flex flex-wrap items-center gap-2 lg:flex-nowrap'
const LABEL = 'w-28 shrink-0 font-medium text-gray-900'

interface ChargeCellProps {
  formCtx: BillFormContext
  invoiceIndex: number
  charge: Charge
  /** Shown as the currency placeholder: charges default to the invoice currency. */
  invoiceCurrency: string
}

/** One charge: a rate (%) or an amount (entering one disables the other) plus its currency. */
export function ChargeCell({ formCtx, invoiceIndex, charge, invoiceCurrency }: ChargeCellProps) {
  const { register, watch } = formCtx.hooks
  const { currencies } = useFormOptions()
  const rateField = `invoices.${invoiceIndex}.${charge.key}Rate` as const
  const amountField = `invoices.${invoiceIndex}.${charge.key}Amount` as const
  const currencyField = `invoices.${invoiceIndex}.${charge.key}Currency` as const

  return (
    <div className={CELL}>
      <div className={CELL_LAYOUT}>
        <span className={LABEL}>{charge.label}</span>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            {...register(rateField)}
            className="text-right"
            disabled={isFilled(watch(amountField))}
            placeholder="Rate"
          />
          <span className="text-xs text-gray-500">%</span>
        </div>
        <Input
          type="number"
          {...register(amountField)}
          className="py-1 text-right"
          disabled={isFilled(watch(rateField))}
          placeholder="Amount"
        />
        <Select<ShippingBillFormValues> name={currencyField} options={currencies} placeholder={invoiceCurrency} />
      </div>
    </div>
  )
}

export function PackingChargesCell({ formCtx, invoiceIndex }: { formCtx: BillFormContext; invoiceIndex: number }) {
  return (
    <div className={CELL}>
      <div className={CELL_LAYOUT}>
        <span className={LABEL}>Packing Charges</span>
        <Input
          type="number"
          {...formCtx.hooks.register(`invoices.${invoiceIndex}.packingCharges`)}
          className="py-1 text-right"
          placeholder="Amount"
        />
        <span className="w-14 text-sm text-gray-500">—</span>
      </div>
    </div>
  )
}

const ROW = 'grid grid-cols-1 divide-y divide-gray-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0'

interface InvoiceChargesProps {
  formCtx: BillFormContext
  invoiceIndex: number
  invoiceCurrency: string
}

/** The bordered charges grid on an invoice: five rate/amount charges and the flat packing charge, two per row. */
export function InvoiceCharges({ formCtx, invoiceIndex, invoiceCurrency }: InvoiceChargesProps) {
  const cell = (charge: Charge) => (
    <ChargeCell
      key={charge.key}
      formCtx={formCtx}
      invoiceIndex={invoiceIndex}
      charge={charge}
      invoiceCurrency={invoiceCurrency}
    />
  )
  const [freight, insurance, commission, discount, otherDeductions] = CHARGES

  return (
    <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
      <div className={ROW}>
        {cell(freight)}
        {cell(insurance)}
      </div>
      <div className={ROW}>
        {cell(commission)}
        {cell(discount)}
      </div>
      <div className={ROW}>
        {cell(otherDeductions)}
        <PackingChargesCell formCtx={formCtx} invoiceIndex={invoiceIndex} />
      </div>
    </div>
  )
}
