import { ApiError } from '../types'

/** Knobs for exercising loading and error states. In dev they are reachable as `window.__mockApi`. */
export const mockNetwork = {
  latencyMs: 250,
  /** Set to true to make the next request fail once with a 503. */
  failNext: false
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Runs `compute` after the simulated latency and returns a deep copy of its result, so callers can never
 * mutate the mock database through a returned object (a real HTTP response would be a fresh copy too).
 * `compute` may throw an ApiError to simulate a rejected request.
 */
export async function respond<T>(compute: () => T, latencyMs: number = mockNetwork.latencyMs): Promise<T> {
  await sleep(latencyMs)
  if (mockNetwork.failNext) {
    mockNetwork.failNext = false
    throw new ApiError('Simulated network failure. Please try again.', 503)
  }
  return structuredClone(compute())
}
