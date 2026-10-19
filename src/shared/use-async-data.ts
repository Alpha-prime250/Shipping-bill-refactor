import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'

/**
 * Minimal read-side data hook: loading / error / data / refetch for any Promise-returning service call.
 * The return shape mirrors react-query's `useQuery` so call sites can move to it without changes.
 *
 * `tags` give a cheap invalidation channel: after a mutation call `invalidateAsyncData('parties')` and every
 * mounted hook that listed that tag reloads, keeping its previous data on screen meanwhile.
 */
export interface AsyncData<T> {
  data: T | undefined
  error: Error | undefined
  /** True until the first result (or error) for the current inputs arrives. */
  isLoading: boolean
  /** True during any request, including background refetches that keep the old data on screen. */
  isFetching: boolean
  refetch: () => void
}

interface Options {
  /** When false nothing is fetched and `isLoading` stays false. */
  enabled?: boolean
  tags?: readonly string[]
}

const subscribers = new Map<string, Set<() => void>>()

export function invalidateAsyncData(tag: string): void {
  subscribers.get(tag)?.forEach((reload) => reload())
}

type State<T> = { data?: T; error?: Error; settled: boolean }

export function useAsyncData<T>(fetcher: () => Promise<T>, deps: DependencyList, options: Options = {}): AsyncData<T> {
  const { enabled = true, tags } = options
  const [state, setState] = useState<State<T>>({ settled: false })
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const [isFetching, setIsFetching] = useState(false)
  const requestId = useRef(0)

  const load = useCallback((keepData: boolean) => {
    const id = ++requestId.current
    if (!keepData) setState({ settled: false })
    setIsFetching(true)
    fetcherRef
      .current()
      .then((data) => {
        if (id !== requestId.current) return
        setState({ data, settled: true })
        setIsFetching(false)
      })
      .catch((error: unknown) => {
        if (id !== requestId.current) return
        setIsFetching(false)
        setState((previous) => ({
          data: keepData ? previous.data : undefined,
          error: error instanceof Error ? error : new Error(String(error)),
          settled: true
        }))
      })
  }, [])

  useEffect(() => {
    if (!enabled) {
      requestId.current++ // ignore anything still in flight
      setState({ settled: false })
      setIsFetching(false)
      return
    }
    load(false)
    return () => {
      requestId.current++ // a newer request (or unmount) makes this one stale
    }
    // `deps` is the caller's dependency list, like useEffect's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, load, ...deps])

  const tagKey = tags?.join('|') ?? ''
  useEffect(() => {
    if (!enabled || !tagKey) return
    const reload = () => load(true)
    const keys = tagKey.split('|')
    keys.forEach((key) => subscribers.set(key, (subscribers.get(key) ?? new Set()).add(reload)))
    return () => keys.forEach((key) => subscribers.get(key)?.delete(reload))
  }, [enabled, load, tagKey])

  const refetch = useCallback(() => load(true), [load])

  return { data: state.data, error: state.error, isLoading: enabled && !state.settled, isFetching, refetch }
}
