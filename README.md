# DataRobot Notebook Admin Viewer

A web-based admin tool for viewing and managing DataRobot Notebooks and Codespaces across all use cases.

![Tech Stack](https://img.shields.io/badge/Bun-000000?style=flat&logo=bun&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

## Features

- 📊 **Data Table** - View all notebooks and codespaces with 10 detailed columns
- 🔍 **Filtering** - Quick filters for codespaces, inactive items, and running sessions
- 📈 **Sorting** - Sort by any column (UC name, creator, dates, etc.)
- 📄 **Pagination** - Browse through 100 items per page
- 📥 **Export Controls** - Copy or download the current table view as CSV with link columns
- 🎨 **Modern UI** - Built with shadcn/ui components and Tailwind CSS
- ⚡ **Fast** - Powered by Bun with 5-minute data caching

## Prerequisites

- [Bun](https://bun.sh) v1.3.1 or later
- DataRobot API token **with full permissions**

## Setup

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Configure environment:**

   Create a `.env` file in the project root:
   ```bash
   DATAROBOT_API_TOKEN=your_api_token_here
   DATAROBOT_ENDPOINT=https://app.datarobot.com/api/v2
   ```

   > **⚠️ IMPORTANT: API Token Permissions**
   >
   > The API token MUST have permissions to:
   > - Read use cases (`useCases/` endpoint)
   > - Read notebooks (`api-gw/nbx/notebooks/` endpoint)
   >
   > When deploying to DataRobot, the runtime environment provides a restricted token by default. This application loads your full-permission token from the `.env` file (uploaded via Pulumi) to override the restricted token and enable API access.

3. **Build production assets:**
   ```bash
   bun run build
   ```

   This compiles Tailwind CSS and builds the frontend with Bun's bundler using relative asset paths for proxy compatibility.

## Usage

### Development Mode

Start the development server with hot reload:

```bash
bun run dev
```

This runs the Tailwind CLI in watch mode and the Bun server simultaneously.

Then open [http://localhost:8080](http://localhost:8080) (or `http://0.0.0.0:8080` for remote access) in your browser.

### Production Mode

```bash
bun run start
```

The start script:
1. Builds Tailwind CSS
2. Builds frontend assets with relative paths (using `Bun.build()` with `publicPath: './'`)
3. Starts the server in production mode (serves from `./dist`)

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run tailwind:build` | Compile Tailwind CSS bundle once (minified) |
| `bun run build` | Build Tailwind CSS + frontend assets (production) |
| `bun run dev` | Start Tailwind watcher and Bun dev server (HMR enabled) |
| `bun run start` | Build assets then launch production server |
| `bun test` | Run tests |

## Project Structure

```
dr-nb-admin-viewer/
├── index.ts                 # Bun server + API
├── index.html              # Entry point
├── src/
│   ├── App.tsx             # Main React component
│   ├── components/         # React components
│   │   ├── NotebooksTable.tsx
│   │   ├── FilterCheckboxes.tsx
│   │   ├── CountDisplay.tsx
│   │   └── ui/             # shadcn/ui components
│   ├── api/                # DataRobot API client
│   ├── styles/             # CSS source + generated bundle (`tailwind.css`)
│   └── types/              # TypeScript types
└── reference/              # Design mockups & data samples
```

## Generated Files

- `src/styles/tailwind.css` - Produced by Tailwind CLI (gitignored)
- `dist/` - Production build output with bundled assets (gitignored)
  - `dist/index.html` - Main HTML file with relative asset paths
  - `dist/chunk-*.js` - JavaScript bundles
  - `dist/chunk-*.css` - CSS bundles

These files use **relative paths** (`./chunk-*.css`) instead of absolute paths to work correctly behind DataRobot's proxy.

## Features Overview

### Data Table Columns

| Column | Description |
|--------|-------------|
| UC名 | Use Case name |
| 名前 | Notebook/Codespace name |
| タイプ | Type (notebook/codespace) |
| ステータス | Session status (running/stopped) |
| 作成者 | Creator username |
| 作成時間 | Creation date |
| 編集者 | Last editor username |
| 編集日時 | Last updated date |
| 定期実行 | Has schedule (はい/いいえ) |
| 定期実行有効 | Schedule enabled (はい/いいえ) |

### Copy & Download CSV

- Two buttons above the table let you copy the current page or download it as `list.csv`.
- The exported data includes all visible columns plus two additional fields:
  - `UC名_link` – direct URL to the use case when available.
  - `名前_link` – direct URL to the notebook/codespace when available.
- Copied CSV briefly shows a `Copied` state for feedback before reverting to `Copy`.

### Filters

- **Codespaceのみ** - Show only codespaces
- **1ヶ月以上未使用** - Show items not updated in over 30 days
- **使用中** - Show only items with running sessions

Filters can be combined and work cumulatively.

## API Endpoint

The server exposes a REST API endpoint:

**GET** `/api/notebooks`

Returns:
```json
{
  "total": 42,
  "codespaceCount": 35,
  "notebookCount": 7,
  "data": [...]
}
```

Data is cached for 5 minutes to reduce load on DataRobot API.

## Deployment

For deployment to DataRobot platform, see [DEPLOYMENT.md](./docs/DEPLOYMENT.md).

**Key deployment notes:**
- The application works behind DataRobot's reverse proxy
- Asset paths use relative URLs for proxy compatibility
- API token from `.env` overrides restricted runtime token
- Build step is required before deployment

## Documentation

For detailed implementation documentation, see [IMPLEMENTATION.md](./docs/IMPLEMENTATION.md).

## Tech Stack

- **Runtime:** [Bun](https://bun.sh) - Fast all-in-one JavaScript runtime
- **Framework:** [React 19](https://react.dev) - UI library
- **Language:** [TypeScript 5](https://www.typescriptlang.org) - Type safety
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com) - Utility-first CSS with CLI pipeline
- **UI Components:** [shadcn/ui](https://ui.shadcn.com) - Re-usable components
- **Table:** [TanStack Table](https://tanstack.com/table) - Headless table library
- **Icons:** [Lucide React](https://lucide.dev) - Icon library

## License

Private project - All rights reserved
