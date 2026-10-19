import { routes } from '@/shared/route-paths'
import { ErrorState, LoadingState } from '@/shared/async-states'
import { useAsyncData } from '@/shared/use-async-data'
import { navigate, useParams } from 'core/routing'
import { Button } from 'ui/basic/button'
import { BillEditor } from './bill-editor'
import { lookupApi, shippingBillApi } from './services'

/** Route entry for `/shipping-bills/new` and `/shipping-bills/:id`: loads what the editor needs, then renders it. */
export default function ShippingBillPage() {
  const { id } = useParams<{ id?: string }>()
  const options = useAsyncData(() => lookupApi.getFormOptions(), [])
  const bill = useAsyncData(() => shippingBillApi.get(id ?? ''), [id], { enabled: Boolean(id) })

  const error = options.error ?? bill.error
  if (error) {
    return (
      <ErrorState
        title="Could not load the shipping bill form"
        error={error}
        onRetry={() => {
          if (options.error) options.refetch()
          if (bill.error) bill.refetch()
        }}
      />
    )
  }
  if (options.isLoading || bill.isLoading || !options.data) return <LoadingState label="Loading shipping bill..." />

  if (id && !bill.data) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Shipping bill not found</h1>
        <Button onClick={() => navigate(routes.dashboard)}>Back to list</Button>
      </div>
    )
  }

  return <BillEditor key={id ?? 'new'} bill={bill.data} options={options.data} />
}
