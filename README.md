# dashboard-voxwind

Cloudflare-native admin dashboard foundation for the VoxWind ecosystem.

Target domain: `https://dashboard.voxwind.com`

This project remains isolated from the existing VoxWind apps. It does not modify or integrate with `auth-voxwind`, `api-voxwind`, `voxwind`, `echo-voxwind`, `flow-voxwind`, or `login-voxwind`.

## Current Capabilities

- Vanilla HTML/CSS/JS dashboard SPA.
- Cloudflare Worker API.
- Real D1 persistence for:
  - tools
  - feature flags
  - announcements
  - homepage sections
- KV-backed publish snapshots.
- Public read-only config APIs.
- Config version records and published snapshot metadata.
- Audit logging for admin mutations.
- Environment-aware data model: `development`, `staging`, `production`.
- Soft-delete/archive architecture.
- R2-ready media upload intent route.
- Admin authentication integrated with `auth.voxwind.com`.
- Role and permissions resolution backed by D1.
- Dashboard analytics display fallback demo content.

## Routes

Frontend:

```text
/login
/dashboard
/dashboard/tools
/dashboard/tools/add
/dashboard/users
/dashboard/homepage
/dashboard/announcements
/dashboard/feature-flags
/dashboard/media
/dashboard/seo
/dashboard/settings
/dashboard/analytics
```

Admin APIs:

```text
GET  /api/health
GET  /api/admin/session
GET  /api/admin/tools
POST /api/admin/tools
GET  /api/admin/tools/:id
PATCH /api/admin/tools/:id
POST /api/admin/tools/:id/archive
POST /api/admin/tools/:id/duplicate
POST /api/admin/tools/reorder

GET  /api/admin/feature-flags
POST /api/admin/feature-flags
PATCH /api/admin/feature-flags/:id
POST /api/admin/feature-flags/:id/archive

GET  /api/admin/announcements
POST /api/admin/announcements
PATCH /api/admin/announcements/:id
POST /api/admin/announcements/:id/archive

GET  /api/admin/homepage-sections
POST /api/admin/homepage-sections
PATCH /api/admin/homepage-sections/:id
POST /api/admin/homepage-sections/:id/archive

GET  /api/admin/config/preview
GET  /api/admin/config/versions
POST /api/admin/config/publish

POST /api/admin/media/upload-intent
```

Public config APIs:

```text
GET /api/public/tools
GET /api/public/homepage
GET /api/public/feature-flags
GET /api/public/config
```

All environment-aware APIs accept:

```text
?env=production
?env=staging
?env=development
```

## Local Development

Install dependencies:

```bash
npm install
```

Apply local D1 schema and seed records:

```bash
npm run db:migrate:local
npm run db:seed:local
```

Run the Worker + assets locally:

```bash
npm run dev -- --ip 127.0.0.1 --port 8790
```

Open:

```text
http://127.0.0.1:8790/dashboard
```

Syntax check:

```bash
npm run check
```

## Database Layout

Schema files are split into:

```text
migrations/0001_admin_core.sql
seeds/0001_foundation.sql
schema/README.md
schemas/d1/planned-schema.sql
```

`schemas/d1/planned-schema.sql` is retained as the original planning document. Use `migrations/` for actual D1 application.

## Publish Flow

Saving edits writes draft data to D1 only.

Publishing performs:

```text
D1 draft records
  -> snapshot builder
  -> config_versions row
  -> KV cache writes
  -> published_snapshots row
  -> published version fields on records
  -> audit log
```

KV keys are environment-scoped:

```text
public:production:config
public:production:tools
public:production:homepage
public:production:feature-flags
```

This prevents development/staging records from leaking into production config.

## Cloudflare Bindings

`wrangler.jsonc` prepares:

- `ASSETS`: static dashboard frontend.
- `DB`: D1 database `voxwind-dashboard-db`.
- `CONFIG_CACHE`: KV namespace for published runtime config.
- `RATE_LIMIT`: KV namespace reserved for admin API limits.
- `MEDIA_BUCKET`: R2 bucket reserved for future media assets.

## Remote Deployment

Replace placeholder Cloudflare IDs in `wrangler.jsonc`, then:

```bash
npm run db:migrate:remote
npm run db:seed:remote
npm run deploy
```

## Current Auth Mode

The Worker validates incoming requests using the `vw_session` cookie against `auth.voxwind.com`.
Once authenticated, the user's roles and permissions are dynamically resolved from the local D1 database.
All routing and modifications enforce granular permission checks.

## Next Recommended Work

1. Add frontend editing forms for feature flags, announcements, and homepage sections.
2. Add audit log viewer.
3. Implement rollback endpoint using `config_versions.snapshot_json`.
4. Implement real R2 signed upload URLs and media metadata persistence.
5. Implement frontend route guards and automatic session-aware redirects.
6. Only after the model stabilizes, integrate public config into `voxwind.com`.
