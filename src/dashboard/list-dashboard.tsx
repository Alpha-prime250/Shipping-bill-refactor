import { ErrorState, LoadingState } from '@/shared/async-states'
import { downloadTextFile } from '@/shared/download'
import { routes } from '@/shared/route-paths'
import { useAsyncData } from '@/shared/use-async-data'
import { invoiceTotal } from '@/shipping-bills/domain/calculations'
import type { SavedBill } from '@/shipping-bills/domain/types'
import { shippingBillApi } from '@/shipping-bills/services'
import { navigate } from 'core/routing'
import { toast } from 'core/toast-manager'
import { useState } from 'react'
import { Badge } from 'ui/basic/badge'
import { Button } from 'ui/basic/button'
import { Card, CardContent } from 'ui/basic/card'
import { Table } from 'ui/basic/table'
import { Input } from 'ui/inputs/input'

const matchesSearch = (bill: SavedBill, search: string) =>
  [
    bill.id,
    bill.values.jobNumber,
    bill.values.exporterName,
    bill.values.consigneeName,
    ...bill.values.invoices.map((invoice) => invoice.invoiceNumber)
  ]
    .join(' ')
    .toLowerCase()
    .includes(search.toLowerCase())

const countDistinct = (values: (string | undefined)[]) => new Set(values.filter(Boolean)).size

const formatDate = (iso: string) => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

export default function ListDashboard() {
  const { data: bills, error, isFetching, refetch } = useAsyncData(() => shippingBillApi.list(), [])
  const [search, setSearch] = useState('')
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const handleDownloadFlatFile = async (bill: SavedBill) => {
    setDownloadingId(bill.id)
    try {
      const file = await shippingBillApi.getFlatFile(bill.id)
      downloadTextFile(file.filename, file.content)
      toast.success(`Flat file (.sb) downloaded for #${bill.values.jobNumber || bill.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? `Failed to get flat file: ${err.message}` : 'Failed to get flat file')
    } finally {
      setDownloadingId(null)
    }
  }

  if (error && !bills) return <ErrorState title="Could not load shipping bills" error={error} onRetry={refetch} />
  if (!bills) return <LoadingState label="Loading shipping bills..." />

  // The service returns newest first; filtering keeps that order.
  const filtered = bills.filter((bill) => matchesSearch(bill, search))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-950">Shipping bills</h1>
          <p className="mt-1 text-sm text-gray-500">Create and continue the shipping bill step of each export job.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch} disabled={isFetching}>
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={() => navigate(routes.shippingBillNew)}>+ New shipping bill</Button>
        </div>
      </div>

      {error && <ErrorState title="Could not refresh the list" error={error} onRetry={refetch} />}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Shipping bills" value={bills.length} />
        <StatCard label="Exporters" value={countDistinct(bills.map((b) => b.values.exporterName))} />
        <StatCard label="Businesses / Consignees" value={countDistinct(bills.map((b) => b.values.consigneeName))} />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="w-full max-w-sm">
              <Input
                label="Search bills"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Job, invoice, exporter or consignee"
              />
            </div>
            <span className="text-sm text-gray-500">
              {filtered.length} {filtered.length === 1 ? 'bill' : 'bills'}
            </span>
          </div>
          {filtered.length ? (
            <Table>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Exporter → Consignee</th>
                  <th>Route</th>
                  <th>Invoices</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bill) => {
                  const total = bill.values.invoices.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0)
                  return (
                    <tr key={bill.id}>
                      <td className="font-medium">
                        {bill.values.jobNumber ? `#${bill.values.jobNumber}` : `Bill #${bill.id}`}
                        <span className="block text-xs font-normal text-gray-500">{bill.values.jobDate}</span>
                      </td>
                      <td>
                        {bill.values.exporterName || '—'}
                        <span className="block text-xs text-gray-500">to {bill.values.consigneeName || '—'}</span>
                      </td>
                      <td>
                        {bill.values.loadingPort || '—'} → {bill.values.finalDestinationPort || '—'}
                      </td>
                      <td>
                        {bill.values.invoices.length}
                        <span className="block text-xs text-gray-500">
                          {total.toLocaleString(undefined, { maximumFractionDigits: 2 })} across items
                        </span>
                      </td>
                      <td>
                        <Badge variant="secondary">Draft</Badge>
                      </td>
                      <td>{formatDate(bill.updated)}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={downloadingId === bill.id}
                            onClick={() => handleDownloadFlatFile(bill)}>
                            {downloadingId === bill.id ? 'Downloading...' : 'Flat File'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(routes.toShippingBillEdit(bill.id))}>
                            Open
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
              <p className="font-medium">{search ? 'No matching shipping bills' : 'No shipping bills yet'}</p>
              <p className="mt-1 text-sm text-gray-500">
                {search ? 'Try another job number or party name.' : 'Create a bill to start an export job.'}
              </p>
              {!search && (
                <Button className="mt-4" onClick={() => navigate(routes.shippingBillNew)}>
                  Create shipping bill
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}
