# DataRobot Notebook Admin Viewer – Implementation Summary

This document outlines how the notebook viewer is structured, how data flows through the system, and the pieces you need to understand before extending it. Deployment-specific guidance lives in `docs/DEPLOYMENT.md`.

## System Architecture

### Backend (`index.ts`)
- Uses `Bun.serve()` to expose the static bundle and the `/api/notebooks` endpoint.
- Aggregates DataRobot use cases and notebooks, enriching notebooks with their parent use-case names.
- Maintains a 5-minute in-memory cache (`Map`) keyed by a constant to smooth high-latency API calls; cache entries include a timestamp and pre-built response payload.
- Applies a 120-second fetch timeout to guard against stalled upstream requests.

### Frontend (`src/frontend.tsx`, `src/App.tsx`)
- React root renders `<App />`, which fetches `./api/notebooks` on load.
- `App` holds filter state for: codespaces only, inactive (>30 days) notebooks, and running sessions. Filtering happens client-side against the cached payload.
- Loading UI lives in `src/components/ui/loading.tsx`; table, filter checkboxes, and count display are split into dedicated components under `src/components/`.
- Styling comes from Tailwind CSS v4 (`src/styles/globals.css`) compiled into `src/styles/tailwind.css`, which the React entrypoint imports.

### Build & Assets
- `bun run build` executes `scripts/build.ts`, which first runs the Tailwind CLI and then bundles `index.html` via `Bun.build({ publicPath: './' })` to ensure all asset URLs stay relative for DataRobot’s reverse proxy.
- Development workflow (`bun run dev`) uses `scripts/dev.ts` to keep Tailwind in watch mode alongside the Bun dev server with HMR enabled.

## Data Flow
1. Client requests `./api/notebooks`.
2. Server cache hit → respond immediately with cached JSON.
3. Cache miss → server fetches use cases, then notebooks per use case, merges results, stores `{ payload, timestamp }` in cache, and returns the aggregated response.
4. Frontend normalizes the dataset for TanStack Table, derives row links (use-case and notebook URLs), and applies filters/pagination entirely on the client.

## Key Modules
- `src/api/datarobot.ts`: Fetch helpers, response typings, and enrichment utilities shared by backend and tests.
- `src/components/NotebooksTable.tsx`: Table configuration, CSV export (“Copy” + “Download”) and pagination (100 rows per page).
- `src/components/CountDisplay.tsx`: Displays total notebooks/codespaces plus admin-mode badge sourced from `/account/profile`.
- `src/components/FilterCheckboxes.tsx`: Stateless checkbox group wired to `App` filter state.
- `infra/custom_application/*.sh`: Deployment build/start scripts; build installs deps plus `bun run build`, start loads `.env` before launching `bun run start`.

## Configuration Notes
- `.env` must supply `DATAROBOT_API_TOKEN` with use-case and notebook read permissions; `start-app.sh` sources it to override the restricted runtime token provided by DataRobot.
- `DATAROBOT_ENDPOINT` defaults to the production API (`https://app.datarobot.com/api/v2`) but can be reassigned per environment.

## Operational Characteristics
- Cache TTL: 5 minutes; stale data persists until expiry or manual refresh.
- Sorting and filtering are purely client-side, so the full dataset is transferred on every load.
- API errors propagate as non-200 responses; the frontend surfaces a generic failure banner and keeps prior data if available.

## Known Limitations
- No real-time updates or background refresh; users must reload to see changes before cache expiry.
- Sort/filter settings are not stored across sessions.
- Server assumes the DataRobot API shape used during development; schema changes upstream may require updates to `src/api/datarobot.ts`.

## References
- Project overview and setup instructions: [`README.md`](../README.md)
- Deployment and infrastructure automation: [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md)
