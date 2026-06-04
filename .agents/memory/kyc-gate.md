---
name: KYC gate pattern
description: How unverified users are blocked from the inner app and routed to KycPage
---

**Gate location:** `client/src/App.tsx` — if `user && user.kycStatus !== "verified"`, render `<KycPage />` instead of the `<Router>` children. Authenticated users who haven't verified see only KycPage.

**KYC link pool:** `kyc_link_pool` table in the DB. Schema: `id`, `rawLink`, `assignedUserId`, `assignedAt`, `lockedAt`, `createdAt`. The `lockedAt` column was added to prevent two users sharing a link — set when a user clicks "Open verification link".

**Recycling logic:** `assignKycLinkToUser` in `server/storage.ts` uses raw SQL to recycle links where `locked_at IS NULL AND assigned_at > 30 minutes ago`. Links that are locked are never recycled.

**KycPage states:** InstructionsView → LinkReadyView (after POST /api/kyc/start) → PendingView (kycStatus === "pending") → RejectedView (kycStatus === "rejected").

**Why:** Regulatory requirement — no loan access until identity is verified. Gate at App.tsx level is the simplest enforcement point.
