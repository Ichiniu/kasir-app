# Multi-Tenant (Multi-Outlet) Refactoring Instructions for kasir-app

## Objective
Transform the current single-tenant POS architecture into a robust multi-tenant system supporting 20+ outlets within a single database. The core mechanism is strict data isolation using `outletId` and backend-level query security. Cross-outlet data leakage must be strictly prevented.

## PREREQUISITES (CRITICAL RULES FOR AI AGENT)
1. DO NOT delete existing features; only modify schemas and queries to support multi-tenancy.
2. NEVER trust or accept `outletId` from the frontend/client-side payload during `CREATE`, `UPDATE`, or `DELETE` operations. ALWAYS use the `outletId` extracted from the secure backend session/JWT of the currently logged-in user.
3. ADD `@@index([outletId])` to every transactional table in the Prisma schema to prevent lag and ensure high performance as the dataset grows.

## PHASE 1: Database Schema Update (`prisma/schema.prisma`)
1. Create a new `Outlet` model:
   - `id` (String/UUID or Int)
   - `nama` (String)
   - `alamat` (String, optional)
   - `createdAt`, `updatedAt`
2. Add a one-to-many relationship (`Outlet` to Models) by adding an `outletId` field to the following models:
   - `User` (Users must be tied to 1 outlet, except SUPERADMIN)
   - `Kategori` (Categories per outlet)
   - `Produk` (Master products per outlet)
   - `Transaksi` (Sales per outlet)
   - `DetailTransaksi`
   - `StokMasuk` (Restocks per outlet)
   - `RiwayatKas` (Cash history per outlet)
   - `AuditLog` (Action tracking per outlet)
3. **Performance:** Add `@@index([outletId])` to `Transaksi`, `Produk`, `StokMasuk`, `RiwayatKas`, and `AuditLog`.
4. Run `npx prisma format` after updating the schema.

## PHASE 2: Auth & Types Update (`src/lib/auth.ts` & `src/types/index.ts`)
1. Update the Session and JWT interfaces to include `outletId` and `role` (e.g., KASIR, SUPERADMIN).
2. Modify the authentication (login) logic so that when a JWT/session is generated, the `outletId` from the `User` table is securely embedded into the session object.

## PHASE 3: Server Actions / API Routes Refactoring (`src/app/(dashboard)/**/actions.ts`)
Every `actions.ts` file interacting with the database MUST be updated with the following logic:
1. Retrieve the user session at the beginning of the function. Throw an *Unauthorized* error if the session is missing.
2. **Read (findMany/findFirst):** Inject a `where: { outletId: session.user.outletId }` filter into *every* query.
   - *Exception:* If `session.user.role === 'SUPERADMIN'`, allow bypassing the `outletId` filter or query by a specific `outletId` parameter.
3. **Create:** Automatically inject `outletId: session.user.outletId` into the `data` payload before insertion.
4. **Update/Delete:** Enforce ownership validation by updating the where clause: `where: { id: inputId, outletId: session.user.outletId }`.

*Target files for query updates:*
- `src/app/(dashboard)/kasir/actions.ts`
- `src/app/(dashboard)/produk/actions.ts`
- `src/app/(dashboard)/kategori/actions.ts`
- `src/app/(dashboard)/stok-masuk/actions.ts`
- `src/app/(dashboard)/buka-kas/actions.ts`
- `src/app/(dashboard)/tutup-kas/actions.ts`
- `src/app/(dashboard)/laporan/actions.ts`

## PHASE 4: Audit Logging Implementation (`src/lib/audit.ts`)
1. Update the audit logging function to require and record both `userId` and `outletId`.
2. Ensure that every crucial action (transaction completed, cash drawer opened/closed, stock updated) records exactly **who** did it (User ID), **what** was done (Action), and **where** (Outlet ID).

## PHASE 5: Frontend Refactoring (Visibility & Forms)
1. UI `/settings/UserFormModal.tsx` & `settings/UserList.tsx`: Add a dropdown input to assign an `Outlet` when creating or editing a User.
2. Dashboard (`/dashboard/page.tsx`): Ensure that all metrics (total sales, cash flow, etc.) fetch data using the newly updated server actions, guaranteeing they only show data relevant to the logged-in user's `outletId`.

## PHASE 6: Seeder Update (`prisma/seed.ts`)
1. Update the seed logic to create at least 2 `Outlet` records by default (e.g., Main Outlet, Branch 1).
2. Create a `Superadmin` account (can see everything) and a `Cashier_Branch_1` account (strictly tied to Branch 1).
3. Seed dummy products, categories, and transactions ensuring they are properly linked to their respective `outletId`.