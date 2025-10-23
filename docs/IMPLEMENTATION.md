# DataRobot Notebook Admin Viewer - Implementation Documentation

## Project Overview

A web-based admin tool for viewing and managing DataRobot Notebooks and Codespaces across all use cases. Built with Bun, React, TypeScript, and shadcn/ui components.

## What We Built

### 1. Backend (Bun Server)

**File: `index.ts`**
- Implemented `Bun.serve()` server with routes configuration
- Created `/api/notebooks` endpoint that:
  - Fetches all use cases from DataRobot API
  - Fetches all notebooks for all use cases
  - Enriches notebook data with use case names
  - Implements 5-minute caching to reduce API calls
  - Returns aggregated data with counts (total, codespace count, notebook count)
- Configured 120-second timeout for long-running API requests

### 2. Frontend (React + TypeScript)

#### Main Components

**`src/App.tsx`**
- Root application component
- Manages data fetching from `/api/notebooks` endpoint
- Handles three filter states: Codespaceのみ, 1ヶ月以上未使用, 使用中
- Implements client-side filtering logic
- Shows loading state with morphing square animation

**`src/components/NotebooksTable.tsx`**
- Data table using TanStack React Table
- 12 columns with Japanese labels:
  - UC名 (Use Case Name)
  - 名前 (Name)
  - タイプ (Type)
  - ステータス (Status)
  - 作成者 (Creator)
  - 作成時間 (Created At)
  - 閲覧者 (Viewer)
  - 閲覧日時 (Last Viewed)
  - 編集者 (Editor)
  - 編集日時 (Updated At)
  - 定期実行 (Has Schedule)
  - 定期実行有効 (Has Enabled Schedule)
- All columns sortable (sorts full dataset, not just current page)
- Pagination at 100 items per page
- Date formatting to YYYY-MM-DD
- Boolean formatting to はい/いいえ

**`src/components/CountDisplay.tsx`**
- Static count display (not affected by filters)
- Shows:
  - Codespace合計: [count of type=codespace]
  - Notebook+Codespace合計: [total count]

**`src/components/FilterCheckboxes.tsx`**
- Three filter checkboxes with Japanese labels:
  1. **Codespaceのみ**: Filters to show only items where `type === "codespace"`
  2. **1ヶ月以上未使用**: Filters items where `lastViewed.at` is more than 30 days old
  3. **使用中**: Filters to show only items where `session.status === "running"`
- Filters are cumulative (AND logic)

**`src/components/ui/loading.tsx`**
- Morphing square loading animation component

### 3. Data Layer

**`src/api/datarobot.ts`**
- Updated TypeScript interfaces to match actual API response:
  - `Notebook` - Full notebook/codespace structure
  - `NotebookUser` - User information (username, firstName, lastName)
  - `NotebookTimestamp` - Timestamp with user info
  - `NotebookSession` - Session status and details
  - `UseCase` - Use case metadata

**`src/types/notebook.ts`**
- Frontend-specific types
- `NotebooksResponse` - API response structure

### 4. Styling

**Tailwind CSS v3 Setup:**
- `tailwind.config.js` - Configuration with shadcn color variables
- `src/styles/globals.css` - Base styles with CSS variables
- `src/styles/output.css` - Compiled Tailwind CSS (generated)
- `postcss.config.js` - PostCSS configuration

**shadcn/ui Components:**
- Button (`src/components/ui/button.tsx`)
- Checkbox (`src/components/ui/checkbox.tsx`)
- Table components (`src/components/ui/table.tsx`)

## Implementation Steps

### Phase 1: Data Export
1. Modified `index.ts` to export notebook and use case data to JSON files
2. Analyzed data structure to understand all available fields
3. Identified missing fields in TypeScript interfaces

### Phase 2: Project Setup
1. Installed React and React DOM with TypeScript types
2. Installed Tailwind CSS v3 and Autoprefixer
3. Installed Radix UI primitives (@radix-ui/react-checkbox, @radix-ui/react-slot)
4. Installed table utilities (@tanstack/react-table)
5. Installed utility libraries (clsx, tailwind-merge, class-variance-authority, lucide-react)

### Phase 3: Configuration
1. Created `tailwind.config.js` with shadcn color scheme
2. Created `postcss.config.js` for CSS processing
3. Created `components.json` for shadcn configuration
4. Updated `tsconfig.json` with path aliases and DOM types
5. Added build scripts to `package.json`

### Phase 4: Component Development
1. Created TypeScript interfaces matching API responses
2. Built UI components (Button, Checkbox, Table, Loading)
3. Implemented CountDisplay component
4. Implemented FilterCheckboxes component
5. Implemented NotebooksTable with sorting and pagination
6. Built main App component with data fetching and filtering logic

### Phase 5: Server Implementation
1. Converted `index.ts` from CLI script to Bun.serve server
2. Implemented routes configuration with HTML bundle serving
3. Created `/api/notebooks` GET endpoint
4. Added data caching with 5-minute TTL
5. Implemented use case name enrichment

### Phase 6: Styling & Testing
1. Compiled Tailwind CSS with all utility classes
2. Updated App.tsx to import compiled CSS
3. Tested all features in Chrome DevTools:
   - Data loading ✅
   - Filter functionality (Codespaceのみ) ✅
   - Sorting (名前 column) ✅
   - Count display (static) ✅
   - Pagination ✅

## Technical Decisions

### Why Bun?
- Built-in TypeScript support
- Native HTML imports for React components
- Fast bundler with HMR (Hot Module Reloading)
- Simple serve configuration with routes
- Project requirement (specified in CLAUDE.md)

### Why Tailwind CSS v3 (not v4)?
- Better CLI support for standalone CSS compilation
- Mature ecosystem with shadcn/ui compatibility
- Reliable build process

### Why TanStack React Table?
- Powerful sorting and pagination features
- Full TypeScript support
- Flexible API for custom rendering
- Sorts entire dataset (not just current page)

### Why Client-Side Filtering?
- Dataset is small (42 items)
- Faster user experience (no server round-trip)
- Simpler implementation
- Server provides enriched data once

## File Structure

```
dr-nb-admin-viewer/
├── index.ts                          # Bun server + API endpoint
├── index.html                        # HTML entry point
├── package.json                      # Dependencies & scripts
├── tailwind.config.js                # Tailwind configuration
├── postcss.config.js                 # PostCSS configuration
├── components.json                   # shadcn configuration
├── tsconfig.json                     # TypeScript configuration
├── src/
│   ├── App.tsx                       # Main React component
│   ├── frontend.tsx                  # React root renderer
│   ├── types/
│   │   └── notebook.ts               # Frontend types
│   ├── components/
│   │   ├── NotebooksTable.tsx        # Data table component
│   │   ├── FilterCheckboxes.tsx      # Filter controls
│   │   ├── CountDisplay.tsx          # Count display
│   │   └── ui/
│   │       ├── button.tsx            # Button component
│   │       ├── checkbox.tsx          # Checkbox component
│   │       ├── table.tsx             # Table components
│   │       └── loading.tsx           # Loading animation
│   ├── lib/
│   │   └── utils.ts                  # Utility functions (cn)
│   ├── styles/
│   │   ├── globals.css               # Source CSS with @tailwind
│   │   └── output.css                # Compiled CSS (generated)
│   └── api/
│       ├── datarobot.ts              # DataRobot API client
│       └── datarobot.test.ts         # API tests
├── reference/
│   ├── mockup.png                    # Design mockup
│   ├── notebooks-data.json           # Exported notebook data
│   └── usecases-data.json            # Exported use case data
└── IMPLEMENTATION.md                 # This file
```

## Usage

### Development

```bash
# Build CSS (required after style changes)
bun run build:css

# Start development server with hot reload
bun run dev

# Access at http://localhost:3000
```

### Production

```bash
# Build CSS
bun run build:css

# Start server
bun run start
```

### Scripts

- `bun run dev` - Start dev server with hot reload
- `bun run start` - Start production server
- `bun run build:css` - Compile Tailwind CSS
- `bun run watch:css` - Watch mode for CSS compilation
- `bun test` - Run tests

## Features

### ✅ Implemented

1. **Data Table**
   - 12 columns with Japanese labels
   - All columns sortable
   - 100 items per page
   - Date formatting (YYYY-MM-DD)
   - Boolean formatting (はい/いいえ)

2. **Count Display** (Static)
   - Codespace合計: [count]
   - Notebook+Codespace合計: [count]

3. **Filters** (Cumulative)
   - Codespaceのみ
   - 1ヶ月以上未使用
   - 使用中

4. **UI/UX**
   - Modern shadcn design
   - Morphing square loading animation
   - Responsive layout
   - Hover states on table rows
   - Disabled state for pagination buttons

5. **Backend**
   - RESTful API endpoint
   - 5-minute data caching
   - Use case name enrichment
   - Error handling

## Environment Setup

Required environment variable in `.env`:
```
DATAROBOT_API_TOKEN=your_token_here
```

## API Response Structure

```typescript
{
  total: number;              // Total count of all notebooks + codespaces
  codespaceCount: number;     // Count of type === "codespace"
  notebookCount: number;      // Count of type === "notebook"
  data: Notebook[];          // Array of enriched notebooks
}
```

Each notebook includes:
- Basic info: id, name, type, description
- Use case: useCaseId, useCaseName (enriched)
- Timestamps: created, updated, lastViewed (with user info)
- Session: status, startedAt (if exists)
- Scheduling: hasSchedule, hasEnabledSchedule

## Known Limitations

1. **Cache Duration**: 5 minutes - may show stale data
2. **No Real-time Updates**: Requires page refresh to see new data
3. **Client-Side Filtering**: All data loaded upfront
4. **No Sorting Persistence**: Sort state resets on page reload
5. **No Filter Persistence**: Filter state resets on page reload

## Future Enhancements (Not Implemented)

- [ ] Server-side filtering and pagination
- [ ] Real-time data updates via WebSocket
- [ ] Export to CSV/Excel
- [ ] Advanced search functionality
- [ ] User preferences persistence
- [ ] Bulk operations (delete, stop sessions)
- [ ] Session management (start/stop)
- [ ] Audit log viewer

## Troubleshooting

### CSS not applying?
```bash
bun run build:css
```

### Server timeout on first load?
The first request fetches all data from DataRobot API and can take 15-20 seconds. Subsequent requests use cached data (5-minute TTL).

### Port 3000 already in use?
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## Dependencies

### Runtime
- react: ^19.2.0
- react-dom: ^19.2.0
- @tanstack/react-table: ^8.21.3
- @radix-ui/react-checkbox: ^1.3.3
- @radix-ui/react-slot: ^1.2.3
- lucide-react: ^0.546.0
- clsx: ^2.1.1
- tailwind-merge: ^3.3.1
- class-variance-authority: ^0.7.1

### Development
- @types/bun: latest
- @types/react: ^19.2.2
- @types/react-dom: ^19.2.2
- typescript: ^5
- tailwindcss: ^3
- autoprefixer: ^10.4.21
- postcss: ^8.5.6

## License

Private project - All rights reserved
