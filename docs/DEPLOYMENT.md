# DataRobot Deployment Guide

## Overview

This guide explains how to deploy the dr-nb-admin-viewer application to the DataRobot platform using Pulumi Infrastructure as Code (IaC).

## Architecture

The deployment uses a two-layer approach:

1. **Custom Execution Environment** - Docker container with Bun runtime
2. **Custom Application** - Your Bun application code with build/start scripts

**Deployment Tool**: Python Pulumi (infrastructure only)
**Application Runtime**: Bun (application only)

This keeps Python isolated to deployment tooling while maintaining a pure Bun application.

## Prerequisites

### Required Software

1. **Python 3.9+**
   ```bash
   python3 --version  # Should be 3.9 or higher
   ```

2. **Pulumi CLI**
   ```bash
   # macOS
   brew install pulumi

   # Or download from https://www.pulumi.com/docs/install/

   # Verify installation
   pulumi version
   ```

3. **DataRobot Account**
   - Access to DataRobot platform
   - API token with appropriate permissions

### Environment Setup

1. **Copy environment template**
   ```bash
   cp .env.template .env
   ```

2. **Fill in required variables**
   ```bash
   # .env
   DATAROBOT_API_TOKEN=your_actual_token_here
   DATAROBOT_ENDPOINT=https://app.datarobot.com/api/v2

   # Optional: for Pulumi Cloud (or use --local)
   PULUMI_ACCESS_TOKEN=your_pulumi_token_here
   ```

3. **Login to Pulumi**

   Choose one of:

   ```bash
   # Option A: Pulumi Cloud (recommended for teams)
   pulumi login

   # Option B: Local state storage (simpler for solo development)
   pulumi login --local
   ```

## Deployment Workflow

### Quick Start

Deploy with a single command:

```bash
python quickstart.py <your-stack-name>
```

Example:
```bash
python quickstart.py dr-nb-admin-dev
```

**What happens automatically:**
1. Creates Python virtual environment (`.venv/`)
2. Installs Pulumi dependencies
3. Creates/selects Pulumi stack
4. Builds custom execution environment (Docker image)
5. Packages application source code
6. Deploys to DataRobot
7. Outputs application URL

### Manual Deployment Steps

If you prefer manual control:

1. **Create virtual environment**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # macOS/Linux
   # or .venv\Scripts\activate  # Windows
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

### Destroy/Cleanup

Remove the deployment:

```bash
python quickstart.py <stack-name> --action destroy
```

Or manually:
```bash
cd infra
pulumi destroy
```

## Infrastructure Components

### 1. Custom Execution Environment

**File**: `infra/custom_environment/Dockerfile`

Defines the runtime container:
- Base: `oven/bun:1-debian` (Bun runtime on Debian)
- Exposed port: 8080 (DataRobot standard)
- Working directory: `/opt/code`
- Environment: `NODE_ENV=production`, `PORT=8080`

**No system dependencies required** - Just Bun runtime

### 2. Application Build Script

**File**: `infra/custom_application/build-app.sh`

Executed after Docker image is built:
```bash
bun install           # Install dependencies
bun run tailwind:build  # Build CSS
```

### 3. Application Start Script

**File**: `infra/custom_application/start-app.sh`

Container entrypoint:
```bash
exec bun run start    # Runs: bun run tailwind:build && bun index.ts
```

### 4. Pulumi Program

**File**: `infra/__main__.py`

Infrastructure as Code:
- Creates ZIP of Dockerfile
- Creates ExecutionEnvironment resource
- Packages application source (excludes: .venv, node_modules, .git, etc.)
- Creates ApplicationSource with resource configuration
- Creates CustomApplication
- Exports IDs and URLs

### 5. Deployment Runner

**File**: `quickstart.py`

Orchestrates the deployment:
- Validates prerequisites (Pulumi installed, logged in)
- Creates Python virtual environment
- Installs dependencies
- Loads `.env` file
- Runs Pulumi commands
- Handles errors gracefully

## File Exclusions

When packaging your application, these are automatically excluded:

```
.venv/              # Python virtual environment
node_modules/       # Would not exist in Bun, but excluded for safety
.git/               # Git metadata
.github/            # GitHub workflows
.vscode/            # Editor config
.idea/              # Editor config
dist/               # Build artifacts
reference/          # Reference data
uploads/            # User uploads (if any)
coverage/           # Test coverage
.pytest_cache/      # Test cache
__pycache__/        # Python cache
.env                # Secrets (never include)
```

## Environment Variables in DataRobot

DataRobot automatically provides:
- `DATAROBOT_API_TOKEN` - API authentication
- `DATAROBOT_ENDPOINT` - DataRobot API endpoint
- `PORT` - Port to listen on (always 8080)

These are available in your Bun application via `process.env`.

## Resource Configuration

**Configured in** `infra/__main__.py`:

```python
resources=datarobot.ApplicationSourceResourcesArgs(
    resource_label=CustomAppResourceBundles.CPU_8XL.value.id,
    replicas=1,
    session_affinity=True,
    service_web_requests_on_root_path=True,
)
```

**What this means:**
- **CPU_8XL**: 8 CPU cores, large memory allocation
- **replicas=1**: Single instance (scale up if needed)
- **session_affinity**: Sticky sessions (routes user to same instance)
- **service_web_requests_on_root_path**: App served at root path

## Pulumi Outputs

After successful deployment:

```bash
pulumi stack output
```

Returns:
```
app_id                          dr-nb-admin-app-abc123
app_url                         https://app.datarobot.com/custom-applications/xyz789
execution_environment_id        exe-env-abc123
execution_environment_version_id  version-abc123
```

## Common Issues & Troubleshooting

### 1. "DATAROBOT_API_TOKEN not found"

**Cause**: `.env` file missing or incomplete

**Solution**:
```bash
cp .env.template .env
# Edit .env and add your actual token
```

### 2. "pulumi: command not found"

**Cause**: Pulumi CLI not installed

**Solution**:
```bash
brew install pulumi  # macOS
# Or visit https://www.pulumi.com/docs/install/
```

### 3. "Please login to pulumi"

**Cause**: Not logged into Pulumi

**Solution**:
```bash
pulumi login --local  # For local state
# Or
pulumi login  # For Pulumi Cloud
```

### 4. "Python version 3.9 or higher required"

**Cause**: Old Python version

**Solution**:
```bash
# macOS
brew install python@3.11

# Check version
python3 --version
```

### 5. Build fails during Tailwind CSS compilation

**Cause**: Missing dependencies or corrupted node_modules equivalent

**Solution**:
```bash
# Locally test the build
rm -rf node_modules
bun install
bun run tailwind:build
```

### 6. Application fails to start

**Cause**: Various (check logs in DataRobot)

**Debug steps**:
1. Check DataRobot application logs
2. Verify `start-app.sh` is executable
3. Test locally:
   ```bash
   export PORT=8080
   bun run start
   ```

### 7. "Stack already exists"

**Cause**: Trying to create duplicate stack

**Solution**:
```bash
# List stacks
pulumi stack ls

# Select existing stack
pulumi stack select <stack-name>
```

## Local Testing Before Deployment

Test the build and start scripts locally:

```bash
# Simulate build phase
cd /path/to/repo
./infra/custom_application/build-app.sh

# Simulate start phase
export PORT=8080
export DATAROBOT_API_TOKEN="your_token"
export DATAROBOT_ENDPOINT="https://app.datarobot.com/api/v2"
./infra/custom_application/start-app.sh
```

## Cost Considerations

DataRobot custom applications consume:
- **Compute resources** (based on resource_label)
- **Storage** (for Docker images and source packages)
- **Network** (egress charges may apply)

Consult your DataRobot plan for pricing details.

## CI/CD Integration (GitHub Actions)

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

## Updating an Existing Deployment

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

## Rolling Back

To rollback to a previous version:

```bash
cd infra
pulumi stack export --file backup.json  # Backup current state
pulumi refresh  # Sync with actual state
pulumi up --target urn:pulumi:stack::project::resource  # Selective update
```

Or destroy and redeploy from a previous commit:
```bash
git checkout <previous-commit>
python quickstart.py <stack-name>
```

## Security Best Practices

1. **Never commit `.env`** - Already in `.gitignore`
2. **Use Pulumi Cloud secrets** for sensitive config:
   ```bash
   pulumi config set --secret mySecret myValue
   ```
3. **Rotate API tokens regularly**
4. **Use different stacks** for dev/staging/prod
5. **Review Pulumi diffs** before applying:
   ```bash
   pulumi preview  # Shows changes before applying
   ```

## Monitoring & Logs

Access logs in DataRobot:
1. Navigate to Custom Applications
2. Find your application
3. Click "Logs" tab

Monitor performance:
- CPU/Memory usage in DataRobot dashboard
- Application metrics via DataRobot APIs
- Custom logging in your application code

## Support & Resources

- **DataRobot Docs**: https://docs.datarobot.com/
- **Pulumi Docs**: https://www.pulumi.com/docs/
- **Pulumi DataRobot Provider**: https://www.pulumi.com/registry/packages/datarobot/
- **Bun Docs**: https://bun.sh/docs

## Next Steps

1. Complete environment setup (`.env`)
2. Install prerequisites (Python, Pulumi)
3. Run `python quickstart.py <stack-name>`
4. Access your deployed application
5. Set up CI/CD (optional)
6. Configure monitoring (optional)
