# Kezavi

Property management for landlords, tenants, property managers, and caretakers in Uganda —
digital leases, rent invoicing, Mobile Money and cash payments, maintenance tracking, and
reporting in one place.

## What's built

- Phone number + password auth (plus Google OAuth) across Landlord, Tenant, Property Manager,
  Caretaker, Admin, and Super Admin roles, with 2FA support
- Properties, units, and digital leases with e-signing, rent changes, and move-in/move-out
  inspections
- Automatic rent invoicing per billing cycle, with email + SMS reminders for rent due/overdue
  and lease expiry (`lib/rent-cycle.ts`)
- Payments: cash recording (working) and Mobile Money via Flutterwave (integration built,
  currently needs valid API credentials — see `.env.example`)
- Maintenance requests, complaints, tenant documents, reviews/reputation, owner statements,
  and admin/audit tooling
- Public marketing site and property listings at `/`, `/properties`, `/pricing`, etc.

## Getting started

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL` (Postgres — e.g. from
   [Supabase](https://supabase.com) or [Neon](https://neon.tech)) plus whichever optional
   integrations you want working locally (Resend for email, Flutterwave for Mobile Money,
   Africa's Talking for SMS, Supabase Storage for file uploads).
2. Install dependencies and apply migrations:

   ```bash
   npm install
   npx prisma migrate deploy
   npx prisma generate
   ```

   (`prisma migrate dev` requires an interactive terminal; `migrate deploy` applies the
   existing migrations non-interactively and is what CI/most sandboxes should use. To add a
   new migration, edit `prisma/schema.prisma` then run
   `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`
   into a new `prisma/migrations/<timestamp>_<name>/migration.sql` file before deploying.)

3. Start the dev server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000), register as a Landlord, add a property
   and unit, then create a lease for a tenant phone number to see the full flow.

## Testing

```bash
npm test      # vitest — unit + mocked integration tests
npm run lint  # eslint
npx tsc --noEmit
```
