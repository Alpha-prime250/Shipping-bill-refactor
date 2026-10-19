import type { useForm } from 'core/form'
import type { ShippingBillFormValues } from '../domain/types'

/** The form controller every section receives. */
export type BillFormContext = ReturnType<typeof useForm<ShippingBillFormValues>>

// `Input`'s `type` prop is typed without "date"; the cast keeps native date pickers.
export const dateType = 'date' as 'text'

/** Form fields that hold a party id, and the matching branch id field. Template paths keep `register`/`setValue` typed. */
export type PartyOwnerField =
  | 'exporterId'
  | 'consigneeId'
  | `invoices.${number}.buyerId`
  | `invoices.${number}.thirdPartyId`
  | `invoices.${number}.items.${number}.itemThirdPartyId`

export type PartyBranchField =
  | 'exporterBranchId'
  | 'consigneeBranchId'
  | `invoices.${number}.buyerBranchId`
  | `invoices.${number}.thirdPartyBranchId`
  | `invoices.${number}.items.${number}.itemThirdPartyBranchId`
