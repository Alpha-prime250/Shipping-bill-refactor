import { useFieldArray } from 'core/form'
import { Button } from 'ui/basic/button'
import { Card, CardContent, CardHeader } from 'ui/basic/card'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { emptyDocument } from '../domain/defaults'
import type { ShippingBillFormValues } from '../domain/types'
import { useFormOptions } from '../hooks/form-options-context'
import { DocumentItem } from './document-item'
import type { BillFormContext } from './field-types'
import { dateType } from './field-types'
import { Advanced, RepeatableCard, SectionHeading } from './form-layout'

/** Cargo containers and the packing list. */
function CargoSection({ formCtx }: { formCtx: BillFormContext }) {
  const { register, control } = formCtx.hooks
  const options = useFormOptions()
  const containers = useFieldArray({ control, name: 'containers' })
  const packingRanges = useFieldArray({ control, name: 'packingRanges' })

  return (
    <Card>
      <CardHeader title="Cargo & Package Detail" />
      <CardContent className="space-y-5">
        <div className="mb-3 flex items-center justify-between">
          <SectionHeading
            title={`Containers (${containers.fields.length})`}
            description="Add only when the cargo is containerized."
          />
          <Button size="sm" variant="outline" onClick={() => containers.append({ containerNumber: '' })}>
            + Add container
          </Button>
        </div>
        <div className="space-y-3">
          {containers.fields.map((field, index) => (
            <RepeatableCard key={field.id} title={`Container ${index + 1}`} onRemove={() => containers.remove(index)}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Input label="Container number" {...register(`containers.${index}.containerNumber`)} />
                <Select<ShippingBillFormValues>
                  label="Size"
                  name={`containers.${index}.containerSize`}
                  options={options.containerSizes}
                  placeholder="Select size"
                />
                <Input label="Seal number" {...register(`containers.${index}.exciseSealNumber`)} />
                <Input label="Seal date" type={dateType} {...register(`containers.${index}.sealDate`)} />
                <Select<ShippingBillFormValues>
                  label="Seal type"
                  name={`containers.${index}.sealType`}
                  options={options.containerSealTypes}
                  placeholder="Select if needed"
                />
                <Input label="Seal device ID" {...register(`containers.${index}.sealDeviceId`)} />
                <Input label="Movement document type" {...register(`containers.${index}.movementDocumentType`)} />
                <Input label="Movement document number" {...register(`containers.${index}.movementDocumentNumber`)} />
              </div>
            </RepeatableCard>
          ))}
        </div>
        <Advanced title={`Packing list ranges (${packingRanges.fields.length})`}>
          <div className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => packingRanges.append({ packingNumberFrom: '', packingNumberTo: '' })}>
              + Add packing range
            </Button>
            {packingRanges.fields.map((field, index) => (
              <RepeatableCard key={field.id} title={`Range ${index + 1}`} onRemove={() => packingRanges.remove(index)}>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Input label="Package from" type="number" {...register(`packingRanges.${index}.packingNumberFrom`)} />
                  <Input label="Package to" type="number" {...register(`packingRanges.${index}.packingNumberTo`)} />
                  <Input label="Packing code" {...register(`packingRanges.${index}.packingCode`)} />
                </div>
              </RepeatableCard>
            ))}
          </div>
        </Advanced>
      </CardContent>
    </Card>
  )
}

interface OptionalListCardProps {
  title: string
  description: string
  addLabel: string
  count: number
  onAdd: () => void
  children: React.ReactNode
}

/** Card for a list that starts empty: the "add" button sits in the body until the first entry exists. */
function OptionalListCard({ title, description, addLabel, count, onAdd, children }: OptionalListCardProps) {
  const addButton = (
    <Button variant="outline" size="sm" onClick={onAdd}>
      {addLabel}
    </Button>
  )
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-950">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
        {count > 0 && addButton}
      </CardHeader>
      <CardContent className="space-y-4">
        {count === 0 && addButton}
        {children}
      </CardContent>
    </Card>
  )
}

function DocumentsSection({ formCtx }: { formCtx: BillFormContext }) {
  const documents = useFieldArray({ control: formCtx.hooks.control, name: 'documents' })
  return (
    <OptionalListCard
      title="Supporting documents"
      description="Add references when required for this shipment."
      addLabel="+ Add document"
      count={documents.fields.length}
      onAdd={() => documents.append(emptyDocument())}>
      {documents.fields.map((field, index) => (
        <DocumentItem key={field.id} formCtx={formCtx} index={index} onRemove={() => documents.remove(index)} />
      ))}
    </OptionalListCard>
  )
}

function LicensesSection({ formCtx }: { formCtx: BillFormContext }) {
  const { register, control } = formCtx.hooks
  const options = useFormOptions()
  const licenses = useFieldArray({ control, name: 'licenses' })
  return (
    <OptionalListCard
      title="Licences"
      description="Only enter these for schemes that require a licence."
      addLabel="+ Add licence"
      count={licenses.fields.length}
      onAdd={() => licenses.append({ registrationNumber: '' })}>
      {licenses.fields.map((field, index) => (
        <RepeatableCard key={field.id} title={`Licence ${index + 1}`} onRemove={() => licenses.remove(index)}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Registration number" {...register(`licenses.${index}.registrationNumber`)} />
            <Input label="Registration date" type={dateType} {...register(`licenses.${index}.registrationDate`)} />
            <Input label="Invoice serial number" type="number" {...register(`licenses.${index}.invoiceSerialNumber`)} />
            <Input label="Item serial number" type="number" {...register(`licenses.${index}.itemSerialNumber`)} />
            <Input label="Licence serial number" type="number" {...register(`licenses.${index}.licenseSerialNumber`)} />
            <Input label="Item serial, Part E" {...register(`licenses.${index}.itemSerialNumberPartE`)} />
            <Input label="Item serial, Part C" {...register(`licenses.${index}.itemSerialNumberPartC`)} />
            <Input label="Licence quantity" type="number" {...register(`licenses.${index}.licenseQuantity`)} />
            <Input label="Export quantity" type="number" {...register(`licenses.${index}.licenseExportQuantity`)} />
            <Select<ShippingBillFormValues>
              label="Goods source"
              name={`licenses.${index}.indigenousOrImported`}
              options={options.licenseGoodsSources}
              placeholder="Select if needed"
            />
          </div>
        </RepeatableCard>
      ))}
    </OptionalListCard>
  )
}

/** "3. Others" tab: containers, packing list, supporting documents and licences. */
export function OthersTab({ formCtx }: { formCtx: BillFormContext }) {
  return (
    <>
      <CargoSection formCtx={formCtx} />
      <DocumentsSection formCtx={formCtx} />
      <LicensesSection formCtx={formCtx} />
    </>
  )
}
