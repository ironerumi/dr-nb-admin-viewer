# DataRobot Notebook Admin Viewer

A modern web-based admin tool for viewing and managing DataRobot Notebooks and Codespaces across all use cases. Built with Bun and optimized for deployment on DataRobot's Custom Application platform.

![Tech Stack](https://img.shields.io/badge/Bun-000000?style=flat&logo=bun&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

## 🌟 Features

- 📊 **Comprehensive Data Table** - View all notebooks and codespaces with 10 detailed columns
- 🔍 **Advanced Filtering** - Quick filters for codespaces, inactive items, and running sessions
- 📈 **Flexible Sorting** - Sort by any column (UC name, creator, dates, etc.)
- 📄 **Pagination** - Browse through 100 items per page
- 📥 **CSV Export** - Copy or download the current table view as CSV with link columns
- 🎨 **Modern UI** - Built with shadcn/ui components and Tailwind CSS
- ⚡ **High Performance** - Powered by Bun with 5-minute data caching
- 🔐 **Enterprise Ready** - Full API token permissions support

## 📸 Screenshots

<!-- Add screenshots to docs/screenshots/ folder and update links below -->

### Main Dashboard
![Main Dashboard](docs/screenshots/main-dashboard.png)
*Comprehensive view of all notebooks and codespaces with filtering and sorting*

### Data Export Features
![Export Options](docs/screenshots/export-features.png)
*CSV export with direct links to use cases and notebooks*

### Filtering Interface
![Filter Controls](docs/screenshots/filter-controls.png)
*Quick filters for codespaces, inactive items, and running sessions*

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) v1.3.1 or later
- DataRobot API token **with full permissions** (see configuration section below)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dr-nb-admin-viewer
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Build the application**
   ```bash
   bun run build
   ```

### Configuration

#### Environment Variables

Set up the following environment variables by creating a `.env` file in the project root:

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

### Running the Application

#### Option 1: DataRobot Custom Application (Production)
```bash
python quickstart.py <stack_name>
```

This will automatically deploy your application to DataRobot using Pulumi infrastructure as code. See the [Deployment](#-deployment) section below for detailed instructions.

#### Option 2: Local Development
```bash
bun run dev
```

This runs the Tailwind CLI in watch mode and the Bun server simultaneously with hot module replacement (HMR) enabled.

Then open [http://localhost:8080](http://localhost:8080) (or `http://0.0.0.0:8080` for remote access) in your browser.

#### Option 3: Local Production Mode
```bash
bun run start
```

The start script:
1. Builds Tailwind CSS
2. Builds frontend assets with relative paths (using `Bun.build()` with `publicPath: './'`)
3. Starts the server in production mode (serves from `./dist`)

## 🏗️ Architecture

### Tech Stack

- **Runtime:** [Bun](https://bun.sh) - Fast all-in-one JavaScript runtime with built-in bundler
- **Frontend:** React 19 + TypeScript 5
- **Backend:** Bun.serve() with WebSocket support
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui
- **Table Library:** TanStack Table (headless)
- **Icons:** Lucide React
- **Build Tools:** Bun's native bundler + Tailwind CLI

### Available Scripts

- `bun run dev` - Start development server with hot reload
- `bun run build` - Build Tailwind CSS + frontend assets for production
- `bun run start` - Build and start production server
- `bun run tailwind:build` - Compile Tailwind CSS bundle (minified)
- `bun test` - Run tests

### Project Structure

```
dr-nb-admin-viewer/
├── index.ts                 # Bun server + API routes
├── index.html              # HTML entry point
├── src/
│   ├── App.tsx             # Main React component
│   ├── components/         # React components
│   │   ├── NotebooksTable.tsx
│   │   ├── FilterCheckboxes.tsx
│   │   ├── CountDisplay.tsx
│   │   └── ui/             # shadcn/ui components
│   ├── api/                # DataRobot API client
│   ├── styles/             # CSS source + generated bundle
│   └── types/              # TypeScript type definitions
├── infra/                  # Infrastructure scripts
│   ├── custom_application/ # App deployment scripts
│   │   ├── start-app.sh   # Container entrypoint
│   │   └── build-app.sh   # Build script
│   ├── custom_environment/ # Docker environment
│   │   └── Dockerfile     # Bun runtime container
│   └── __main__.py        # Pulumi IaC program
├── docs/                   # Documentation
│   ├── DEPLOYMENT.md      # Deployment guide
│   ├── IMPLEMENTATION.md  # Implementation details
│   └── screenshots/       # Application screenshots
├── dist/                   # Built application (gitignored)
├── reference/             # Design mockups & data samples
└── quickstart.py          # One-command deployment script
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

## 🌐 Deployment

### DataRobot Custom Application

This application is designed to work seamlessly with DataRobot's Custom Application platform:

#### Quick Deployment

Deploy with a single command:

```bash
python quickstart.py <your-stack-name>
```

Example:
```bash
python quickstart.py dr-nb-admin-prod
```

**What happens automatically:**
1. Creates Python virtual environment (`.venv/`)
2. Installs Pulumi dependencies
3. Creates/selects Pulumi stack
4. Builds custom execution environment (Docker image with Bun runtime)
5. Packages application source code
6. Deploys to DataRobot
7. Outputs application URL

#### Prerequisites for Deployment

1. **Python 3.9+**
   ```bash
   python3 --version  # Should be 3.9 or higher
   ```

2. **Pulumi CLI**
   ```bash
   # macOS
   brew install pulumi

   # Verify installation
   pulumi version
   ```

3. **Pulumi Login**
   ```bash
   # Option A: Local state (simpler for solo development)
   pulumi login --local

   # Option B: Pulumi Cloud (recommended for teams)
   pulumi login
   ```

4. **DataRobot Account**
   - Access to DataRobot platform
   - API token **with full permissions** (configured in `.env`)

#### Deployment Architecture

The deployment uses a two-layer approach:

1. **Custom Execution Environment** - Docker container based on `oven/bun:1-debian`
   - Exposed port: 8080 (DataRobot standard)
   - Working directory: `/opt/code`
   - Environment: `NODE_ENV=production`, `PORT=8080`

2. **Custom Application** - Your Bun application with build/start scripts
   - Build script: `infra/custom_application/build-app.sh`
   - Start script: `infra/custom_application/start-app.sh`
   - Environment variables loaded from `.env` file

#### Build Process

During deployment, `build-app.sh` executes:
```bash
bun install       # Install dependencies
bun run build     # Build Tailwind CSS + frontend assets
```

**Why relative paths matter:**
- DataRobot serves apps at `/custom_applications/<ID>/`
- Absolute paths like `/_bun/asset/xyz.css` fail (404)
- Relative paths like `./chunk-xyz.css` work correctly
- Configured via `publicPath: './'` in Bun.build()

#### Runtime Configuration

The `start-app.sh` script handles environment setup:

```bash
# Load .env file (overrides restricted runtime token)
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

# Start server
exec bun index.ts
```

**Critical behavior:**
1. **Loads `.env` file** uploaded via Pulumi containing your full-permission API token
2. **Overrides** DataRobot's restricted `DATAROBOT_API_TOKEN` environment variable
3. **Starts server** in production mode (serves pre-built assets from `./dist`)

**Why .env loading is required:**
- DataRobot runtime provides `DATAROBOT_API_TOKEN` automatically
- This runtime token is restricted and cannot read use cases/notebooks
- Loading `.env` replaces it with your full-permission token
- Without this, API requests fail with 401 Unauthorized

#### Resource Configuration

The application is configured with:
- **CPU_8XL**: 8 CPU cores, large memory allocation
- **Replicas**: 1 instance (scale up if needed)
- **Session Affinity**: Sticky sessions enabled
- **Root Path**: App served at application root

#### Manual Deployment Steps

If you prefer manual control:

1. **Create virtual environment**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # macOS/Linux
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Initialize Pulumi stack**
   ```bash
   cd infra
   pulumi stack select <stack-name> --create
   ```

4. **Deploy**
   ```bash
   pulumi up
   ```

5. **Get application URL**
   ```bash
   pulumi stack output app_url
   ```

#### Updating an Existing Deployment

To update your application:

1. Make code changes
2. Commit changes (optional but recommended)
3. Re-run deployment:
   ```bash
   python quickstart.py <stack-name>
   ```

Pulumi will:
- Detect changes
- Rebuild Docker image (if Dockerfile changed)
- Repackage source code
- Update application

#### Destroy/Cleanup

Remove the deployment:

```bash
python quickstart.py <stack-name> --action destroy
```

Or manually:
```bash
cd infra
pulumi destroy
```

### Manual Deployment

For non-DataRobot deployments:

1. Build the application: `bun run build`
2. Set environment variables (`.env` or shell exports)
3. Start with: `bun run start`
4. Ensure port 8080 is accessible

**Key deployment notes:**
- The application works behind DataRobot's reverse proxy
- Asset paths use relative URLs for proxy compatibility
- API token from `.env` overrides restricted runtime token
- Build step is required before deployment

For detailed deployment instructions, troubleshooting, and CI/CD setup, see [DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## 🔧 Development

### Adding Screenshots

1. Take screenshots of your application
2. Save them in the `docs/screenshots/` folder
3. Update the image links in this README
4. Use descriptive filenames (e.g., `main-dashboard.png`, `export-features.png`)

### Local Testing Before Deployment

Test the build and start scripts locally to ensure everything works:

```bash
# Simulate build phase
./infra/custom_application/build-app.sh

# Simulate start phase
export PORT=8080
export DATAROBOT_API_TOKEN="your_token"
export DATAROBOT_ENDPOINT="https://app.datarobot.com/api/v2"
./infra/custom_application/start-app.sh
```

## 🛠️ Troubleshooting

### Common Issues

1. **"DATAROBOT_API_TOKEN not found"**

   **Cause**: `.env` file missing or incomplete

   **Solution**:
   ```bash
   cp .env.template .env
   # Edit .env and add your actual token with FULL permissions
   ```

2. **"HTTP 401 - UNAUTHORIZED" in deployed application**

   **Cause**: API token lacks required permissions

   **Symptoms**:
   - Application starts successfully
   - UI loads but shows no data
   - Logs show `HTTP 401 - UNAUTHORIZED` errors

   **Solution**:
   1. Verify your token has permissions:
      ```bash
      curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://app.datarobot.com/api/v2/useCases/?limit=1
      ```
   2. If 401/403, get a new token with:
      - Use Case read permissions
      - Notebook read permissions
   3. Update `.env` with new token
   4. Redeploy:
      ```bash
      python quickstart.py <stack-name>
      ```

3. **Assets fail to load (404 errors for CSS/JS)**

   **Cause**: Asset paths not relative

   **Symptoms**:
   - UI shows but no styling
   - Browser DevTools shows 404 errors for `/_bun/asset/xyz.css`

   **Solution**:
   - Ensure `bun run build` was executed during deployment
   - Check `dist/index.html` contains relative paths (`./chunk-*.css`)
   - Verify `build-app.sh` runs `bun run build` (not just `bun run tailwind:build`)

4. **"pulumi: command not found"**

   **Cause**: Pulumi CLI not installed

   **Solution**:
   ```bash
   brew install pulumi  # macOS
   # Or visit https://www.pulumi.com/docs/install/
   ```

5. **"Please login to pulumi"**

   **Cause**: Not logged into Pulumi

   **Solution**:
   ```bash
   pulumi login --local  # For local state
   # Or
   pulumi login  # For Pulumi Cloud
   ```

6. **Application fails to start**

   **Cause**: Various (check logs in DataRobot)

   **Debug steps**:
   1. Check DataRobot application logs
   2. Verify `start-app.sh` is executable
   3. Test locally:
      ```bash
      export PORT=8080
      bun run start
      ```

### Debug Mode

Enable verbose logging:

```bash
# Local development
DEBUG=* bun run dev

# Check environment variables during deployment
# The start-app.sh script shows debug output
```

## 🤝 CI/CD Integration

Store secrets in GitHub Settings:
- `DATAROBOT_API_TOKEN`
- `DATAROBOT_ENDPOINT`
- `PULUMI_ACCESS_TOKEN`

Example workflow stub:
```yaml
# .github/workflows/deploy.yml
name: Deploy to DataRobot

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Deploy
        env:
          DATAROBOT_API_TOKEN: ${{ secrets.DATAROBOT_API_TOKEN }}
          DATAROBOT_ENDPOINT: ${{ secrets.DATAROBOT_ENDPOINT }}
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
        run: python quickstart.py prod
```

## 📝 Documentation

- **Deployment Guide**: [DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Comprehensive deployment instructions
- **Implementation Details**: [IMPLEMENTATION.md](./docs/IMPLEMENTATION.md) - Technical implementation details
- **DataRobot Docs**: https://docs.datarobot.com/
- **Pulumi Docs**: https://www.pulumi.com/docs/
- **Bun Docs**: https://bun.sh/docs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*For support or questions, please contact the development team or refer to the documentation in the `/docs` folder.*
