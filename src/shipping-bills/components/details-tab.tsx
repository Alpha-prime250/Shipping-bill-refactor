import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { Card, CardContent, CardHeader } from 'ui/basic/card'
import { portCountry } from '../domain/calculations'
import type { PortOption, ShippingBillFormValues } from '../domain/types'
import { useFormOptions } from '../hooks/form-options-context'
import { useMarksAndNumbers } from '../hooks/use-marks-and-numbers'
import { lookupApi } from '../services'
import { AsyncSelect } from './async-select'
import type { BillFormContext } from './field-types'
import { dateType } from './field-types'
import { Advanced, SectionHeading } from './form-layout'
import { PartyFields } from './party-fields'

const portLabel = (port: PortOption) => `${port.name} · ${port.code}`
const toPortOption = (port: PortOption) => ({
  value: port.code,
  label: portLabel(port),
  sublabel: `Country: ${port.countryCode}`
})
const initialPortLabel = async (code: string) => {
  const port = await lookupApi.getPort(code)
  return port ? portLabel(port) : code
}

function RouteSection({ formCtx }: { formCtx: BillFormContext }) {
  const { watch } = formCtx.hooks
  const loadingPort = watch('loadingPort')
  const finalDestinationPort = watch('finalDestinationPort')

  return (
    <div className="border-t border-gray-200 pt-5">
      <SectionHeading title="Route" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="mb-1 block text-sm font-medium">Port of loading</span>
          <AsyncSelect
            name="loadingPort"
            placeholder="Select Indian port"
            rules={{ required: true }}
            fetchOptions={async (query) => (await lookupApi.searchLoadingPorts(query)).map(toPortOption)}
            getInitialLabel={initialPortLabel}
          />
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium">Final destination port</span>
          <AsyncSelect
            name="finalDestinationPort"
            placeholder="Select destination"
            rules={{ required: true }}
            fetchOptions={async (query) => (await lookupApi.searchDestinationPorts(query)).map(toPortOption)}
            getInitialLabel={initialPortLabel}
          />
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Countries are derived from the port codes when saved: {portCountry(loadingPort) || '—'} →{' '}
        {portCountry(finalDestinationPort) || '—'}.
      </p>
    </div>
  )
}

function RegulatoryExceptions({ formCtx }: { formCtx: BillFormContext }) {
  const { register } = formCtx.hooks
  const options = useFormOptions()
  return (
    <Advanced title="Regulatory and route exceptions">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Select<ShippingBillFormValues>
          label="Discharge port"
          name="dischargePort"
          options={options.dischargePorts}
          placeholder="Defaults to destination"
        />
        <Select<ShippingBillFormValues>
          label="Origin state"
          name="originStateCode"
          options={options.states}
          placeholder="Defaults to Branch State Code"
        />
        <div></div>
        <Select<ShippingBillFormValues>
          label="NFEI category"
          name="nfeiCategory"
          options={options.nfeiCategories}
          placeholder="Not applicable"
        />
        <Input label="RBI waiver number" {...register('rbiWaiverNumber')} />
        <Input label="RBI waiver date" type={dateType} {...register('rbiWaiverDate')} />
      </div>
    </Advanced>
  )
}

function PackageSection({ formCtx }: { formCtx: BillFormContext }) {
  const { register, watch } = formCtx.hooks
  const options = useFormOptions()
  const marks = useMarksAndNumbers(formCtx)
  const hasContainers = (watch('containers') ?? []).length > 0

  const marksPlaceholder = !marks.exporterId
    ? 'Select exporter first'
    : marks.isLoading
      ? 'Loading marks and numbers...'
      : marks.hasError
        ? 'Could not load marks and numbers'
        : marks.options.length === 0
          ? 'No marks and numbers for this exporter'
          : 'Select marks and numbers'

  return (
    <div className="border-t border-gray-200 pt-5">
      <SectionHeading title="Package Detail" />
      <div className="grid gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select<ShippingBillFormValues> label="Nature of cargo" name="natureOfCargo" options={options.cargoOptions} />
        <Input label="Gross weight" type="number" {...register('grossWeight')} />
        <Input label="Net weight" type="number" {...register('netWeight')} />
        <Select<ShippingBillFormValues> label="Weight unit" name="measurementUnit" options={options.weightUnits} />
        <Input label="Total packages" type="number" {...register('totalPackages')} />
        <Select<ShippingBillFormValues>
          label="Marks and numbers"
          name="marksAndNumbers"
          options={marks.options}
          placeholder={marksPlaceholder}
          disabled={!marks.exporterId || marks.isLoading || !marks.options.length}
          wrapClass="sm:col-span-3"
        />
      </div>
      <Advanced title="Additional Details">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select<ShippingBillFormValues>
            label="Seal type"
            name="sealType"
            options={options.sealTypes}
            placeholder="Select if relevant"
          />
          {!hasContainers && <Input label="Number of containers" type="number" {...register('numberOfContainers')} />}
          <Input label="Loose packets" type="number" {...register('loosePackets')} />
          <Input label="MAWB number" {...register('mawbNumber')} />
          <Input label="HAWB number" {...register('hawbNumber')} />
        </div>
      </Advanced>
    </div>
  )
}

/** "1. Details" tab: parties, route and package details. */
export function DetailsTab({ formCtx }: { formCtx: BillFormContext }) {
  return (
    <Card>
      <CardHeader title="Shipment basics" description="Parties and route are the core details for this bill." />
      <CardContent className="space-y-5">
        <PartyFields
          formCtx={formCtx}
          role="exporter"
          ownerField="exporterId"
          branchField="exporterBranchId"
          label="Exporter"
        />
        <PartyFields
          formCtx={formCtx}
          role="consignee"
          ownerField="consigneeId"
          branchField="consigneeBranchId"
          label="Consignee"
        />
        <RouteSection formCtx={formCtx} />
        <RegulatoryExceptions formCtx={formCtx} />
        <PackageSection formCtx={formCtx} />
      </CardContent>
    </Card>
  )
}
