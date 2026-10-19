import type {
  Branch,
  Business,
  Exporter,
  Option,
  PartyKind,
  PartyRole,
  PortOption,
  SavedBill,
  ShippingBillFormValues
} from '../domain/types'

/** Failure from a service call. `fieldErrors` maps form field paths to messages (HTTP 422 style). */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors?: Record<string, string>

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export interface SchemeOption extends Option {
  drawback: boolean
  RODTEP: boolean
  ROSCTL: boolean
}

/** Static reference data every form select is built from. One request, cached for the page. */
export interface FormOptions {
  currencies: Option[]
  countries: Option[]
  contractTypes: Option[]
  priceInclusionTypes: Option[]
  paymentTypes: Option[]
  cargoOptions: Option[]
  weightUnits: Option[]
  sealTypes: Option[]
  quantityCodes: Option[]
  schemeCodes: SchemeOption[]
  tradeAgreements: Option[]
  states: Option[]
  dischargePorts: Option[]
  nfeiCategories: Option[]
  igstPaymentStatuses: Option[]
  accessoryStatuses: Option[]
  containerSizes: Option[]
  containerSealTypes: Option[]
  licenseGoodsSources: Option[]
  exporterClasses: Option[]
  exporterTypes: Option[]
}

export interface LookupApi {
  getFormOptions(): Promise<FormOptions>
  getMarksAndNumbers(exporterId: string): Promise<Option[]>
  searchLoadingPorts(query: string): Promise<PortOption[]>
  searchDestinationPorts(query: string): Promise<PortOption[]>
  getPort(code: string): Promise<PortOption | undefined>
  searchDocumentTypes(query: string): Promise<Option[]>
  getDocumentType(code: string): Promise<Option | undefined>
  searchFileTypes(query: string): Promise<Option[]>
  getFileType(code: string): Promise<Option | undefined>
}

export type NewBranch = Omit<Branch, 'id'> & { id?: number }
export type ExporterInput = Omit<Exporter, 'id' | 'branches'> & { id?: number; firstBranch?: Omit<Branch, 'id'> }
export type BusinessInput = Omit<Business, 'id' | 'branches'> & { id?: number; firstBranch?: Omit<Branch, 'id'> }

export interface PartyApi {
  /** Search masters usable in `role` (exporters exclude disabled ones; businesses must carry the role flag). */
  searchParties(role: PartyRole, query: string): Promise<(Exporter | Business)[]>
  getParty(role: PartyRole, id: string): Promise<Exporter | Business | undefined>
  searchBranches(role: PartyRole, partyId: string, query: string): Promise<Branch[]>
  saveExporter(input: ExporterInput): Promise<Exporter>
  saveBusiness(input: BusinessInput): Promise<Business>
  saveBranch(kind: PartyKind, ownerId: number, branch: NewBranch): Promise<Branch>
}

export interface FlatFile {
  filename: string
  content: string
}

export interface ShippingBillApi {
  list(): Promise<SavedBill[]>
  /** Resolves `undefined` when the bill does not exist (an empty result, not an error). */
  get(id: string | number): Promise<SavedBill | undefined>
  /** Create (no id) or update. Rejects with `ApiError` carrying `fieldErrors` when the server rejects the data. */
  save(values: ShippingBillFormValues, id?: number): Promise<SavedBill>
  getFlatFile(id: string | number): Promise<FlatFile>
}
