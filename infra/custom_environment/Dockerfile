# Base runtime image for DataRobot custom model
FROM oven/bun:1-debian

# -----------------------------------------------------------------------------
# 1. Prepare working directory
# -----------------------------------------------------------------------------
WORKDIR /opt/code

# -----------------------------------------------------------------------------
# 2. Runtime environment variables
# -----------------------------------------------------------------------------
ENV NODE_ENV=production
# DataRobot maps traffic to port 8080; the server reads this env var
ENV PORT=8080

# -----------------------------------------------------------------------------
# 3. Expose port expected by DataRobot
# -----------------------------------------------------------------------------
EXPOSE 8080
