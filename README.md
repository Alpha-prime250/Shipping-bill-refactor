## Export Software Frontend

Built on top of [fe-zen-arch](git@github.com:shivamkj/fe-zen-arch.git) — the core shared architecture for B2B SaaS frontends.

### Libraries

- **React** [Docs](https://react.dev/reference/react)
- **Tailwind CSS** [Docs](https://tailwindcss.com/docs/installation)
- **React Query** [Docs](https://tanstack.com/query/latest/docs/framework/react/overview)
- **React Hook Form** [Docs](https://www.react-hook-form.com/get-started)
- **Zustand** [Docs](https://zustand.docs.pmnd.rs/)

### Setup

```bash
pnpm install   # fe-zen-arch is included as a git submodule, init it first if missing
pnpm dev       # dev server on port 5173
pnpm lint      # prettier + tsc + eslint (fe-zen-arch lint pipeline)
pnpm build     # production build
```

### Notes

- `core`, `ui`, `auth`, `icons` are fe-zen-arch workspace packages, aliased via tsconfig paths & vite aliases.
- Forms are built directly with `useForm` from `core/form` + `Form` / `SubmitButton` from `core/form/components` — no generic form templates.
- Routing uses fe-zen-arch's zustand router: routes defined in `src/shared/routes.tsx`, paths in `src/shared/route-paths.ts`.
- Auth uses the fe-zen-arch auth module (routes, interceptors, login pages) out of the box.
- API base URL comes from `PUBLIC_API_URL` (`.env`).
- Don't use react-query mutation for react-hook-form submit handler.
- For HMR (hot refresh), the file must export only react component, and not any other constant or object.
- While most input elements use `...register('name')`, custom elements like select require `<Select<T> name="name" />` instead.

## Shipping bill refactor

### Architecture

```
src/shipping-bills/
  shipping-bill-form.tsx   route entry: loads form options (+ the bill when editing), shows loading / error / not-found
  bill-editor.tsx          owns the react-hook-form instance, tabs, save / draft-save, error -> tab mapping
  bill-schema.ts           per-field schema (fe-zen-arch `s`)
  party-dialogs.tsx        add party / add branch dialogs
  components/              presentational sections: details / invoices / others tabs, invoice + item editors,
                           charge rows, party picker, async select
  hooks/                   contexts (form options, party dialogs) and feature hooks
  domain/                  pure TypeScript, no React, no I/O: types, defaults, totals, cross-field rules, tab mapping
  services/
    types.ts               the API contract: LookupApi, PartyApi, ShippingBillApi, ApiError
    index.ts               composition root, the only file that knows the mock exists
    api-mappers.ts         form values <-> wire format (epoch days, numeric codes)
    mock/                  fake backend: latency, localStorage-backed tables, seed data, flat-file generator
src/shared/use-async-data.ts   loading / error / refetch hook used for every read
```

Data flow: `component -> hook / service interface -> (mock | future HTTP)`. Components import `lookupApi`, `partyApi`
and `shippingBillApi` from `services/` and never a data array. Nothing outside `services/index.ts` imports `services/mock`.

### Mock services

- Every call is async and goes through `respond()` (`services/mock/network.ts`): simulated latency, a deep copy of the
  result (callers cannot mutate the "database"), and a failure switch.
- **States covered:** loading and error-with-retry on the page, dashboard and marks-and-numbers; empty results in every
  searchable select; "bill not found" as an empty result (`get()` resolves `undefined`), not an exception; save errors
  as `ApiError` with optional per-field messages.
- **Try the error paths:** in dev, run `__mockApi.failNext = true` in the console and trigger any request (one 503, then
  it recovers); or save a bill whose invoice number is already used on another bill to get a 422 with a field error.
- **Going live:** implement the three interfaces in `services/types.ts` over `fetch` (send `toApiPayload(values)` for
  saves, `PUBLIC_API_URL` for the base URL) and change three assignments in `services/index.ts`. No component changes.

### Main decisions and trade-offs

- **Split by responsibility, not by file size.** The 1761-line form became sections that each own one concern; the
  repeated freight / insurance / commission / discount / other-deductions rows are one `ChargeCell`, and the issuing /
  beneficiary blocks are one `PartyBlock`. Typed path helpers (`field('ritcCode')`) replace ~30 hand-typed item paths.
- **Party pickers take a role** (`exporter | consignee | buyer | thirdParty`) and a pair of field paths. The add-party /
  add-branch dialogs write their result straight into those paths, which removed the role / index switch that used to
  live in the editor.
- **Reads use a tiny `useAsyncData` hook instead of react-query.** The submodule was not available while building this,
  so I could not confirm what `core/react-query` re-exports, and `@tanstack/react-query` is not a dependency of `src/`
  (no new dependencies allowed). The hook returns the same `{ data, error, isLoading, refetch }` shape, so moving to
  `useQuery` is mechanical. Writes are plain `await` calls in the submit handler, per the README rule above.
- **Reference data is fetched too** (`lookupApi.getFormOptions()`), not imported: currencies, contract types, scheme
  codes, etc. are loaded once by the page and provided via context.
- **Cross-field rules are pure functions** (`domain/rules.ts`), unit tested, and applied on submit; server errors use the
  same field-error path, so both surface identically.
- **Deliberately not done:** no new dependencies or test framework (tests use `node:test`, bundled by the existing
  esbuild), no generic form builder, no design-system work.

### Domain assumptions (kept small on purpose)

| Rule | Where |
| --- | --- |
| Port of loading is Indian and differs from the final destination | `domain/rules.ts` |
| Net weight <= gross weight | `domain/rules.ts` |
| Invoice date is not after the job date | `domain/rules.ts` |
| CF needs freight, CI needs insurance, CIF needs both (rate or amount) | `domain/rules.ts` |
| IGST "against payment" needs taxable value and IGST amount | `domain/rules.ts` |
| Packing range runs upwards | `domain/rules.ts` |
| An invoice number can be used on one bill only (server-side, returns 422) | `mock-shipping-bill-api.ts` |
| Country is the first two letters of a port code (UN/LOCODE) | `domain/calculations.ts` |

### What changed from the starter (and what it fixed)

- Removed the hard-coded LAN API URL and the silent "try the network, fall back to local" paths; there is one mock backend.
- The starter had two bill stores and two payload builders; now there is one of each.
- Buyer and third-party pickers searched only consignees; they now search businesses with the matching role.
- `invoice.items[index]` (invoice index used as an item index) could crash an invoice with fewer items than its
  position; fixed. The "Unit of rate" select was registered without a `name`, against the README rule; fixed.
- Bills saved from the form had no exporter / consignee name on the list screen; the backend now resolves them.
- The editor no longer re-renders everything on each keystroke (`watch()` of the whole form is replaced by field watches).
- The dashboard no longer shows `NaN` totals or "1 exporter" when there are none; unused code was removed (`deleteParty`,
  `deleteBranch`, `syncBillsFromApi`, `getFlatFile`, a speculative multi-shape response normalizer).
- Seeded list rows now use form-valid defaults (`P` cargo, `KG` unit) instead of values that matched no option.

### Known gaps / open questions

- Several form options are letter codes (contract type `FOB`, payment `DP`, seal `S`...) while the payload fields are
  numeric. The code tables were not provided, so those fields are omitted from the payload rather than sent as `NaN`
  (the starter sent `null`). They need a mapping once the backend contract is known.
- The submodule was empty in the copy I worked from, so I could not run `pnpm lint` / `pnpm build` against it. Everything
  that does not depend on it was verified (see below); please run both before submitting.

### Checks

```bash
pnpm test         # 35 unit tests: totals, rules, tab mapping, payload mapping, mock services
pnpm lint-check   # fe-zen-arch pipeline
pnpm build
```

## AI Usage & Approach

> Draft written with the assistant. Replace the bracketed parts with what is true for you, and only keep claims you can
> defend in the interview.

- **Tools:** Claude (chat) for reading the starter, proposing the structure and writing a first pass of the code.
- **How:** I [read the starter and listed its problems myself first / ...]. I used the assistant to propose the service
  boundary and the split of the form, then reviewed each file and [changed X / rejected Y].
- **Judgment:** [for example: I chose a small local hook over react-query because ...; I kept domain rules to six simple
  ones because the brief says not to invest in customs detail; I rejected ... because ...].
- **Validation:** unit tests for the pure logic and the mock services; type-checking the code against the real
  react-hook-form types; bundling both route entries to catch import errors; [manual walkthrough of create, edit,
  failed save, duplicate invoice number, add party / branch, flat-file download].
- **Learnings:** [what you learned or would do differently].
