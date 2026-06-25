# Deployment Guide

This document describes how to configure, develop, and deploy the `dashboard-voxwind` Cloudflare Worker and frontend assets.

## Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Local Database Emulation
Cloudflare's `wrangler` provides a local SQLite database that mimics D1 during development.

Apply the schema:
```bash
npm run db:migrate:local
```

Insert default structural seeds:
```bash
npm run db:seed:local
```

### 3. Run Development Server
Start the local server bound to a specific IP and port (avoids localhost resolution issues):
```bash
npm run dev -- --ip 127.0.0.1 --port 8790
```

Access the dashboard locally at:
```text
http://127.0.0.1:8790/dashboard
```

## Remote Setup & Deployment

### 1. Cloudflare Bindings Preparation
Ensure `wrangler.jsonc` contains the correct Resource IDs for your Cloudflare account. The essential bindings are:
- **D1 Database**: `DB` (`voxwind-dashboard-db`)
- **KV Namespaces**: `CONFIG_CACHE`, `RATE_LIMIT`
- **R2 Buckets**: `MEDIA_BUCKET`, `AUDIT_ARCHIVE_BUCKET`

### 2. Remote Database Setup
Before deploying for the first time, you must initialize the remote D1 database on Cloudflare's edge:

```bash
npm run db:migrate:remote
npm run db:seed:remote
```

### 3. Deploy
Publish the application (which includes deploying the backend Worker and uploading the `public/` assets directory):

```bash
npm run deploy
```
*(This uses the `production` environment by default. Staging is available if explicitly specified via `--env=staging`)*

### 4. Custom Domains
The Worker routes requests directly to the bound domain. If deploying to `dashboard.voxwind.com`, ensure the zone routing is properly mapped in your Cloudflare dashboard under **Workers Routes** or **Custom Domains**.

## Troubleshooting Notes

- **Foreign Key Constraints**: If `db:migrate:local` or `db:seed:local` fails with constraint errors, ensure you run seeds *before* dependent migrations (such as permissions).
- **Authentication Bypass**: Local development relies on `auth.voxwind.com` to validate the `vw_session` cookie. If API requests return 401 Unauthorized, ensure you have signed in via the main VoxWind authentication portal, and that your `vw_session` cookie is sent cross-origin or configured for local sharing.
- **Empty State Previews**: If tables like Feature Flags or Tools are completely empty, verify your D1 seed records were correctly inserted into your current `wrangler` local state.
