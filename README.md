# DataRobot Notebook Admin Viewer

A modern web-based admin tool for viewing and managing DataRobot Notebooks and Codespaces across all use cases. Built with Bun and optimized for deployment on DataRobot's Custom Application platform.

![Tech Stack](https://img.shields.io/badge/Bun-000000?style=flat&logo=bun&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

## Features

- Admin/user mode badge sourced from `/account/profile`
- Paginated TanStack table with sortable columns and CSV export
- Client-side filters for codespaces, stale notebooks, and running sessions
- Five-minute backend cache to smooth DataRobot API latency

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) v1.3+
- Python 3.11+
- DataRobot API token with notebook and use-case read access

### Install & Run

```bash
git clone <repository-url>
cd dr-nb-admin-viewer
bun install

# Local development with HMR
bun run dev

# Production build + serve
bun run start
```

Create `.env` in the project root with at least:

```bash
DATAROBOT_API_TOKEN=...
DATAROBOT_ENDPOINT=https://app.datarobot.com/api/v2
```

Deployment automation, Pulumi usage, and troubleshooting live in [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).

## Architecture Overview

- **Runtime**: `Bun.serve()` handles API routing and static asset delivery.
- **Frontend**: React + TypeScript entrypoint (`src/frontend.tsx`) renders the main app and imports bundled Tailwind CSS.
- **Data layer**: `src/api/datarobot.ts` aggregates use-case and notebook data, cached in-memory for five minutes.
- **Build**: `bun run build` pipes Tailwind CLI output into Bun's bundler (`publicPath: './'`) to keep assets proxy-safe.

Key scripts live in `scripts/`, infrastructure in `infra/`, and React components under `src/components/`.

## Documentation

- Implementation reference: [`docs/IMPLEMENTATION.md`](./docs/IMPLEMENTATION.md)
- Deployment guide: [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)
- License: [`LICENSE`](./LICENSE)
