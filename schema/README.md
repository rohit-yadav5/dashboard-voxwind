# Schema Layout

- `migrations/`: production-ready D1 migrations, applied in order.
- `seeds/`: local or initial seed data. Seeds are idempotent.
- `schemas/d1/planned-schema.sql`: historical planning copy from the foundation phase.

Apply locally:

```bash
npm run db:migrate:local
npm run db:seed:local
```

Apply remotely only after replacing Wrangler resource IDs:

```bash
npm run db:migrate:remote
npm run db:seed:remote
```
