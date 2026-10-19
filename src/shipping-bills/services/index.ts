import { mockLookupApi } from './mock/mock-lookup-api'
import { mockNetwork } from './mock/network'
import { mockPartyApi } from './mock/mock-party-api'
import { mockShippingBillApi } from './mock/mock-shipping-bill-api'
import type { LookupApi, PartyApi, ShippingBillApi } from './types'

/**
 * Composition root for data access. The UI imports these three objects and nothing from `./mock`.
 * To go live, replace each assignment with an HTTP implementation of the same interface
 * (send `toApiPayload(values)` from ./api-mappers for saves); no component changes are needed.
 */
export const lookupApi: LookupApi = mockLookupApi
export const partyApi: PartyApi = mockPartyApi
export const shippingBillApi: ShippingBillApi = mockShippingBillApi

if (import.meta.env.DEV) {
  // Dev-only handle for exercising error/slow states, e.g. `__mockApi.failNext = true` in the console.
  ;(window as Window & { __mockApi?: typeof mockNetwork }).__mockApi = mockNetwork
}

export { ApiError } from './types'
export type { FlatFile, FormOptions, SchemeOption } from './types'
