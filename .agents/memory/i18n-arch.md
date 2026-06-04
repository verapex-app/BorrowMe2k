---
name: i18n architecture
description: How EN/FR translations are structured and scoped in BorrowMe2K
---

Translations live entirely in `client/src/lib/i18n.tsx` as a single `translations` object with shape `{ en: { landing, auth, kyc }, fr: { landing, auth, kyc } }`.

`LangProvider` + `useLang()` + `LangToggle` are all exported from that file.

**Scope:** i18n is applied ONLY to Landing, Auth, and KYC pages. The authenticated inner app (Dashboard, Loans, MyLoans, History, Profile) stays in English.

**Why:** Keeps the translation surface small and avoids risk to the main app during initial rollout.

**How to apply:** When adding a new public-facing page, add keys under both `en.landing` and `fr.landing` (or a new top-level namespace), wrap the page with `useLang()`, and add `<LangToggle>` to its nav.

**LandingPage pattern:** LOAN_PRODUCTS const keeps English names (used as product slugs/icons). Translated tagline/description/use come from `t.products.items[i]` by index in the `.map()`.

**FAQ:** The static `FAQ` const was removed; the FAQ section now reads from `t.faq.items` so both languages render the same accordion component.
