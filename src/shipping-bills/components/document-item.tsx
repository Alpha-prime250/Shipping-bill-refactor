import { useState } from 'react'
import { Button } from 'ui/basic/button'
import { Input } from 'ui/inputs/input'
import { isFilled } from '../domain/calculations'
import type { SupportingDocForm } from '../domain/types'
import { lookupApi } from '../services'
import { AsyncSelect } from './async-select'
import type { BillFormContext } from './field-types'
import { dateType } from './field-types'
import { Advanced } from './form-layout'

// Fields hidden inside the collapsible "Issuing party and ICEGATE details" block.
const CUSTOM_DETAIL_FIELDS: (keyof SupportingDocForm)[] = [
  'placeOfIssue',
  'invoiceSerialNumber',
  'itemSerialNumber',
  'issuingPartyCode',
  'issuingPartyName',
  'issuingPartyAddress1',
  'issuingPartyAddress2',
  'issuingPartyCity',
  'issuingPartyPin',
  'beneficiaryPartyCode',
  'beneficiaryPartyName',
  'beneficiaryPartyAddress1',
  'beneficiaryPartyAddress2',
  'beneficiaryPartyCity',
  'beneficiaryPartyPin',
  'fileType',
  'icegateId'
]

interface PartyBlockProps {
  formCtx: BillFormContext
  index: number
  /** Field name prefix, e.g. `issuingParty`. */
  prefix: 'issuingParty' | 'beneficiaryParty'
  title: string
  /** Label stem for the code and name inputs, e.g. `Issuing party`. */
  partyLabel: string
  /** Label stem for the address, city and postal code inputs, e.g. `Issuing`. */
  addressLabel: string
}

/** Code, name, address and city/pin inputs repeated for the issuing and the beneficiary party. */
function PartyBlock({ formCtx, index, prefix, title, partyLabel, addressLabel }: PartyBlockProps) {
  const { register } = formCtx.hooks
  const name = (suffix: 'Code' | 'Name' | 'Address1' | 'Address2' | 'City' | 'Pin') =>
    `documents.${index}.${prefix}${suffix}` as const
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-900">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input label={`${partyLabel} code`} {...register(name('Code'))} />
        <Input label={`${partyLabel} name`} {...register(name('Name'))} />
        <Input label={`${addressLabel} address line 1`} {...register(name('Address1'))} />
        <Input label={`${addressLabel} address line 2`} {...register(name('Address2'))} />
        <Input label={`${addressLabel} city`} {...register(name('City'))} />
        <Input label={`${addressLabel} postal code`} {...register(name('Pin'))} />
      </div>
    </div>
  )
}

interface DocumentItemProps {
  formCtx: BillFormContext
  index: number
  onRemove: () => void
}

export function DocumentItem({ formCtx, index, onRemove }: DocumentItemProps) {
  const { register, watch } = formCtx.hooks
  const doc = watch(`documents.${index}`)
  const hasCustomValues = CUSTOM_DETAIL_FIELDS.some((field) => isFilled(doc?.[field]))
  const [showCustomDetails, setShowCustomDetails] = useState(hasCustomValues)

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Document {index + 1}</h3>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onRemove}>
          Remove
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <span className="mb-1 block text-sm font-medium text-gray-700">Document type code</span>
          <AsyncSelect
            name={`documents.${index}.documentTypeCode`}
            placeholder="Search document type..."
            fetchOptions={(query) => lookupApi.searchDocumentTypes(query).then((docs) => docs.map(toAsyncOption))}
            getInitialLabel={async (code) => (await lookupApi.getDocumentType(code))?.label ?? code}
          />
        </div>
        <Input label="Image reference number" {...register(`documents.${index}.imageReferenceNumber`)} />
        <Input label="Issue date" type={dateType} {...register(`documents.${index}.documentIssueDate`)} />
      </div>
      <Advanced
        title="Issuing party and ICEGATE details"
        open={showCustomDetails}
        onToggle={(isOpen) => setShowCustomDetails(isOpen)}>
        <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Reference number" {...register(`documents.${index}.documentReferenceNumber`)} />
          <Input label="Expiry date" type={dateType} {...register(`documents.${index}.documentExpiryDate`)} />
          <Input label="Invoice serial number" type="number" {...register(`documents.${index}.invoiceSerialNumber`)} />
          <Input label="Item serial number" type="number" {...register(`documents.${index}.itemSerialNumber`)} />
          <div>
            <span className="mb-1 block text-sm font-medium text-gray-700">File type</span>
            <AsyncSelect
              name={`documents.${index}.fileType`}
              placeholder="Search file type..."
              className="bg-transparent"
              fetchOptions={(query) => lookupApi.searchFileTypes(query).then((types) => types.map(toAsyncOption))}
              getInitialLabel={async (code) => (await lookupApi.getFileType(code))?.label ?? code}
            />
          </div>
          <Input label="Place of issue" {...register(`documents.${index}.placeOfIssue`)} />
        </div>

        <Advanced title="Issuing & Beneficiary">
          <div className="flex flex-col gap-6 pt-2">
            <PartyBlock
              formCtx={formCtx}
              index={index}
              prefix="issuingParty"
              title="Issuing Details"
              partyLabel="Issuing party"
              addressLabel="Issuing"
            />
            <div className="border-t border-gray-100 pt-5">
              <PartyBlock
                formCtx={formCtx}
                index={index}
                prefix="beneficiaryParty"
                title="Beneficiary Details"
                partyLabel="Beneficiary"
                addressLabel="Beneficiary"
              />
            </div>
          </div>
        </Advanced>
      </Advanced>
    </div>
  )
}

const toAsyncOption = (option: { value: string | number; label: string }) => ({
  value: String(option.value),
  label: option.label
})
