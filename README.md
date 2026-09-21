# RealRent

Digital leases, rent tracking, and receipts for landlords and tenants in Uganda.

## Stage 1 (this build)

- Phone number + password auth for Landlord and Tenant roles
- Landlords: create properties → units → leases (auto-creates the tenant's account if needed)
- Rent invoices generated per lease billing cycle; landlords record cash payments, which generate receipts
- Tenants: view active lease, invoice status, and printable receipts

Mobile Money payments, reviews/reputation, and caretaker monitoring are scoped in the data model
but not yet built (Stage 2) — see the plan history for details.

## Getting started

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to a Postgres connection string
   (e.g. from [Neon](https://neon.tech) or [Supabase](https://supabase.com)).
2. Install dependencies and run migrations:

   ```bash
   npm install
   npx prisma migrate dev
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000), register as a Landlord, add a property and
   unit, then create a lease for a tenant phone number to see the full flow.
