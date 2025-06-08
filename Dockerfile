# Use Ubuntu instead of Alpine for better Playwright support
FROM node:18-bullseye AS base

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libgconf-2-4 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrender1 \
    libxtst6 \
    libglib2.0-0 \
    libnss3 \
    libxss1 \
    fonts-liberation \
    libappindicator3-1 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# PRIORITY FIX: Install Playwright browsers with proper error handling
RUN npx playwright install chromium --with-deps
RUN npx playwright install-deps chromium
# Verify Playwright installation and browser availability
RUN npx playwright --version
RUN ls -la /root/.cache/ms-playwright/
# Test browser executable
RUN find /root/.cache/ms-playwright -name "chrome" -type f -executable | head -1

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# PRIORITY FIX: Copy Playwright browsers from deps stage with proper permissions
COPY --from=deps /root/.cache/ms-playwright /home/nextjs/.cache/ms-playwright
RUN chown -R nextjs:nodejs /home/nextjs/.cache
# Ensure Playwright browsers are executable
RUN chmod -R 755 /home/nextjs/.cache/ms-playwright

# CRITICAL: Copy public directory (static assets like images, manifest, etc.)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir -p .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Ensure proper permissions for all static assets
RUN chown -R nextjs:nodejs ./public
RUN chown -R nextjs:nodejs ./.next

# Copy node_modules with Playwright
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy startup script
COPY --chown=nextjs:nodejs scripts/startup.sh ./startup.sh
RUN chmod +x ./startup.sh

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# PRIORITY FIX: Set Playwright environment variables for production
ENV PLAYWRIGHT_BROWSERS_PATH=/home/nextjs/.cache/ms-playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
# Fix: Use proper browser executable path
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/home/nextjs/.cache/ms-playwright/chromium-1169/chrome-linux/chrome

# Use startup script to run the application
# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["./startup.sh", "node", "server.js"]
