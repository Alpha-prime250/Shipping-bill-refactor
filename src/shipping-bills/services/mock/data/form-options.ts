import type { FormOptions, SchemeOption } from '../../types'
import {
  accessoryStatuses,
  cargoOptions,
  containerSealTypes,
  containerSizes,
  contractTypes,
  countries,
  currencies,
  exporterClasses,
  exporterTypes,
  foreignPorts,
  igstPaymentStatuses,
  licenseGoodsSources,
  nfeiCategories,
  paymentTypes,
  priceInclusionTypes,
  sealTypes,
  weightUnits
} from './code-lists'
import schemeCodes from './scheme-codes'
import { quantityCodes } from './quantity-code'
import { stateOptions } from './states'
import { Trades } from './trade-agrements'

export const formOptions: FormOptions = {
  currencies,
  countries,
  contractTypes,
  priceInclusionTypes,
  paymentTypes,
  cargoOptions,
  weightUnits,
  sealTypes,
  quantityCodes,
  schemeCodes: schemeCodes as SchemeOption[],
  tradeAgreements: Trades,
  states: stateOptions,
  dischargePorts: foreignPorts.map((port) => ({ value: port.code, label: `${port.name} · ${port.code}` })),
  nfeiCategories,
  igstPaymentStatuses,
  accessoryStatuses,
  containerSizes,
  containerSealTypes,
  licenseGoodsSources,
  exporterClasses,
  exporterTypes
}
