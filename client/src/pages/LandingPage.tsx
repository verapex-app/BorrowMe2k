import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useLang, LangToggle, translations } from "@/lib/i18n";

const LOAN_PRODUCTS = [
  {
    slug: "quick-cash",
    name: "Quick Cash",
    tagline: "Emergency funds in minutes",
    description:
      "Unexpected expenses don't wait for payday. Quick Cash puts money in your Mobile Money wallet fast — no collateral, minimal paperwork.",
    minAmount: 10_000,
    maxAmount: 150_000,
    rate: 5,
    minTerm: 1,
    maxTerm: 3,
    use: "Medical bills, utility arrears, urgent travel",
    color: "#2d6a4f",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" aria-hidden="true">
        <rect x="6" y="14" width="36" height="24" rx="4" fill="currentColor" opacity=".15"/>
        <rect x="6" y="14" width="36" height="8" rx="4" fill="currentColor" opacity=".4"/>
        <circle cx="24" cy="30" r="5" fill="currentColor"/>
        <path d="M22 30h4M24 28v4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    slug: "salary-advance",
    name: "Salary Advance",
    tagline: "Access your salary before payday",
    description:
      "For salaried workers who need cash before month-end. Repay in one lump-sum when your salary lands, keeping your budget intact.",
    minAmount: 25_000,
    maxAmount: 500_000,
    rate: 3.5,
    minTerm: 1,
    maxTerm: 6,
    use: "Rent advance, home appliances, family expenses",
    color: "#1b4332",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" aria-hidden="true">
        <rect x="8" y="10" width="32" height="28" rx="3" fill="currentColor" opacity=".15"/>
        <path d="M8 18h32" stroke="currentColor" strokeWidth="2" opacity=".4"/>
        <rect x="13" y="23" width="8" height="4" rx="1" fill="currentColor" opacity=".5"/>
        <rect x="27" y="23" width="8" height="4" rx="1" fill="currentColor" opacity=".5"/>
        <rect x="13" y="30" width="8" height="4" rx="1" fill="currentColor" opacity=".3"/>
        <rect x="27" y="30" width="8" height="4" rx="1" fill="currentColor" opacity=".3"/>
        <circle cx="36" cy="36" r="8" fill="#2d6a4f"/>
        <path d="M33 36h6M36 33v6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    slug: "business-boost",
    name: "Business Boost",
    tagline: "Working capital for your enterprise",
    description:
      "Designed for traders, shop owners, and SME operators. Stock up, expand, or bridge a cash-flow gap without disrupting your operations.",
    minAmount: 100_000,
    maxAmount: 2_000_000,
    rate: 4,
    minTerm: 3,
    maxTerm: 18,
    use: "Stock purchase, equipment, market expansion",
    color: "#40916c",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" aria-hidden="true">
        <path d="M10 36V24l14-12 14 12v12" fill="currentColor" opacity=".15"/>
        <path d="M10 36V24l14-12 14 12v12H10z" stroke="currentColor" strokeWidth="2" opacity=".4"/>
        <rect x="18" y="26" width="12" height="10" rx="1" fill="currentColor" opacity=".5"/>
        <path d="M16 20l8-6 8 6" stroke="currentColor" strokeWidth="1.5" opacity=".6"/>
      </svg>
    ),
  },
  {
    slug: "school-fees",
    name: "School Fees",
    tagline: "Never let fees interrupt education",
    description:
      "Cover tuition, levies, and registration fees for primary, secondary or university. Repay comfortably across the school term.",
    minAmount: 50_000,
    maxAmount: 1_000_000,
    rate: 2.5,
    minTerm: 3,
    maxTerm: 12,
    use: "Tuition, exam fees, school supplies",
    color: "#52b788",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" aria-hidden="true">
        <path d="M24 8L6 18l18 10 18-10-18-10z" fill="currentColor" opacity=".2"/>
        <path d="M24 8L6 18l18 10 18-10-18-10z" stroke="currentColor" strokeWidth="2" opacity=".5"/>
        <path d="M12 23v10c0 3 5 6 12 6s12-3 12-6V23" stroke="currentColor" strokeWidth="2" opacity=".4"/>
        <path d="M42 18v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".4"/>
      </svg>
    ),
  },
  {
    slug: "agriculture-loan",
    name: "Agriculture Loan",
    tagline: "Fund the harvest cycle",
    description:
      "Built around planting and harvest seasons. Finance seeds, fertiliser, farming tools, or post-harvest storage — with longer repayment windows.",
    minAmount: 75_000,
    maxAmount: 1_500_000,
    rate: 3,
    minTerm: 6,
    maxTerm: 24,
    use: "Seeds, fertiliser, farm tools, storage",
    color: "#74c69d",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" aria-hidden="true">
        <path d="M24 38C24 38 10 28 10 18a14 14 0 0128 0c0 10-14 20-14 20z" fill="currentColor" opacity=".2"/>
        <path d="M24 18v20M18 24c2-4 6-6 6-6s0 4-6 6zM30 22c-2-3-6-4-6-4s0 3 6 4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity=".6"/>
      </svg>
    ),
  },
  {
    slug: "moto-vehicle",
    name: "Moto / Vehicle",
    tagline: "Finance your transport income",
    description:
      "Buy a moto-taxi, commercial bike, or light vehicle with structured monthly repayments — turning transport into a revenue stream.",
    minAmount: 200_000,
    maxAmount: 3_000_000,
    rate: 3.5,
    minTerm: 6,
    maxTerm: 24,
    use: "Moto-taxi, commercial bike, light vehicles",
    color: "#95d5b2",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" aria-hidden="true">
        <circle cx="14" cy="34" r="7" stroke="currentColor" strokeWidth="2" opacity=".5"/>
        <circle cx="34" cy="34" r="7" stroke="currentColor" strokeWidth="2" opacity=".5"/>
        <path d="M14 34h20M24 14l8 8H14l6-8h4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" opacity=".5"/>
        <path d="M28 22l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".4"/>
        <path d="M24 14v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".4"/>
      </svg>
    ),
  },
];


function formatFCFA(n: number) {
  return n.toLocaleString("fr-CM") + " FCFA";
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#d8e8df] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left py-5 flex items-start justify-between gap-4 group"
        aria-expanded={open}
      >
        <span className="font-semibold text-[#1b4332] text-[15px] leading-snug group-hover:text-[#2d6a4f] transition-colors">
          {q}
        </span>
        <span className="mt-0.5 shrink-0 text-[#52b788] transition-transform duration-200" style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
            <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
        </span>
      </button>
      {open && (
        <p className="pb-5 text-[#3a5a47] text-sm leading-relaxed pr-8">{a}</p>
      )}
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const { lang } = useLang();
  const t = translations[lang].landing;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.faq.items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    name: "BorrowMe2K",
    description:
      "Cameroonian online micro-lending platform offering Quick Cash, Salary Advance, Business Boost, School Fees, Agriculture, and Vehicle loans disbursed via Mobile Money.",
    url: "https://borrowme2k.com",
    areaServed: { "@type": "Country", name: "Cameroon" },
    currenciesAccepted: "XAF",
    paymentAccepted: "Mobile Money, Bank Transfer, Cash",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />

      <div className="min-h-screen bg-white text-[#1b4332] font-sans">

        {/* ── NAV ─────────────────────────────────────────────────────────────── */}
        <header
          role="banner"
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            scrolled ? "bg-white/95 backdrop-blur-sm shadow-sm" : "bg-transparent"
          }`}
        >
          <nav
            className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between"
            aria-label="Main navigation"
          >
            <a href="/" className="flex items-center gap-2.5" aria-label="BorrowMe2K home">
              <img src="/logo.png" alt="BorrowMe2K logo" className="h-9 w-auto" />
            </a>
            <div className="flex items-center gap-3">
              <LangToggle className="border-[#2d6a4f]/30 text-[#2d6a4f] hover:border-[#2d6a4f]" />
              <Link
                href="/auth"
                className="hidden sm:inline-flex text-sm font-medium text-[#2d6a4f] hover:text-[#1b4332] transition-colors px-3 py-2"
                data-testid="link-nav-signin"
              >
                {t.nav.signin}
              </Link>
              <Link
                href="/auth?tab=signup"
                className="inline-flex items-center gap-1.5 text-sm font-semibold bg-[#2d6a4f] text-white px-4 py-2 rounded-lg hover:bg-[#1b4332] transition-colors"
                data-testid="link-nav-get-started"
              >
                {t.nav.getStarted}
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </Link>
            </div>
          </nav>
        </header>

        <main>

          {/* ── HERO ──────────────────────────────────────────────────────────── */}
          <section
            aria-labelledby="hero-heading"
            className="relative pt-28 pb-20 px-5 overflow-hidden"
            style={{ background: "linear-gradient(160deg, #f0faf4 0%, #e8f5ee 50%, #fefdf8 100%)" }}
          >
            {/* Background texture lines */}
            <div aria-hidden="true" className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: "repeating-linear-gradient(0deg, #2d6a4f 0px, #2d6a4f 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, #2d6a4f 0px, #2d6a4f 1px, transparent 1px, transparent 60px)"
            }}/>

            <div className="max-w-6xl mx-auto relative">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-[#2d6a4f]/10 border border-[#2d6a4f]/20 rounded-full px-4 py-1.5 mb-6">
                  <span className="w-2 h-2 rounded-full bg-[#2d6a4f] animate-pulse shrink-0" aria-hidden="true"/>
                  <span className="text-[#2d6a4f] text-xs font-semibold tracking-wide uppercase">
                    {t.hero.badge}
                  </span>
                </div>

                <h1
                  id="hero-heading"
                  className="font-display text-4xl sm:text-5xl font-bold text-[#1b4332] leading-[1.1] tracking-tight mb-5"
                >
                  {t.hero.titleLine1}
                  <br />
                  <span className="text-[#2d6a4f]">{t.hero.titleLine2}</span>
                </h1>

                <p className="text-[#3a5a47] text-lg leading-relaxed mb-8 max-w-xl">
                  {t.hero.subtitle}
                </p>

                <div className="flex flex-wrap gap-3 mb-12">
                  <Link
                    href="/auth?tab=signup"
                    className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#1b4332] transition-colors text-sm shadow-md shadow-[#2d6a4f]/25"
                    data-testid="link-hero-apply"
                  >
                    {t.hero.cta1}
                    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" aria-hidden="true">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                  <a
                    href="#loan-products"
                    className="inline-flex items-center gap-2 bg-white border border-[#c8e0d4] text-[#2d6a4f] font-semibold px-6 py-3 rounded-xl hover:border-[#2d6a4f] transition-colors text-sm"
                    data-testid="link-hero-view-products"
                  >
                    {t.hero.cta2}
                  </a>
                </div>

                {/* Key stats */}
                <dl className="flex flex-wrap gap-8">
                  {t.hero.stats.map(({ value, label, desc }) => (
                    <div key={label}>
                      <dt className="sr-only">{desc}</dt>
                      <dd>
                        <span className="font-display text-3xl font-bold text-[#2d6a4f]">{value}</span>
                        <p className="text-xs font-semibold text-[#1b4332] mt-0.5">{label}</p>
                        <p className="text-xs text-[#52b788]">{desc}</p>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Hero visual — a contextual illustration of phone + mobile money */}
              <div aria-hidden="true" className="hidden lg:block absolute right-0 top-0 bottom-0 w-[380px]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-56">
                    {/* Phone frame */}
                    <div className="w-56 h-[440px] bg-[#1b4332] rounded-[2.5rem] shadow-2xl shadow-[#1b4332]/40 flex flex-col overflow-hidden border-4 border-[#2d6a4f]">
                      <div className="h-6 bg-[#162f24] flex items-center justify-center">
                        <div className="w-16 h-1.5 bg-[#2d6a4f] rounded-full"/>
                      </div>
                      <div className="flex-1 bg-[#f0faf4] flex flex-col p-4 gap-3">
                        <div className="bg-[#2d6a4f] rounded-xl p-3 text-white">
                          <p className="text-[10px] opacity-70 mb-1">Outstanding balance</p>
                          <p className="font-display font-bold text-lg">150,000 FCFA</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {["Quick Cash","Salary Advance","Business","School Fees"].map(n => (
                            <div key={n} className="bg-white rounded-lg p-2 border border-[#d8e8df]">
                              <p className="text-[9px] font-semibold text-[#2d6a4f] leading-tight">{n}</p>
                            </div>
                          ))}
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-[#d8e8df]">
                          <p className="text-[10px] text-[#52b788] font-semibold mb-1">Next payment</p>
                          <p className="text-xs font-bold text-[#1b4332]">12,500 FCFA</p>
                          <p className="text-[9px] text-[#74c69d]">due Jun 15, 2025</p>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-[#2d6a4f] text-white rounded-lg p-2 text-center">
                            <p className="text-[9px] font-bold">MTN MoMo</p>
                          </div>
                          <div className="flex-1 bg-[#f0a500]/20 border border-[#f0a500]/40 rounded-lg p-2 text-center">
                            <p className="text-[9px] font-bold text-[#c47a00]">Orange Money</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Floating badge */}
                    <div className="absolute -right-8 top-16 bg-white rounded-xl shadow-lg shadow-[#1b4332]/10 border border-[#d8e8df] px-3 py-2">
                      <p className="text-[10px] text-[#52b788] font-semibold">Loan approved</p>
                      <p className="text-xs font-bold text-[#1b4332]">Quick Cash</p>
                    </div>
                    <div className="absolute -left-10 bottom-24 bg-white rounded-xl shadow-lg shadow-[#1b4332]/10 border border-[#d8e8df] px-3 py-2">
                      <p className="text-[10px] text-[#52b788] font-semibold">Disbursed</p>
                      <p className="text-xs font-bold text-[#1b4332]">50,000 FCFA</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── TRUST BAR ─────────────────────────────────────────────────────── */}
          <section aria-label="Platform highlights" className="bg-[#1b4332] py-10 px-5">
            <div className="max-w-6xl mx-auto">
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                {t.trust.map(({ value, label }) => (
                  <div key={label} className="border-r border-white/10 last:border-0 pr-4 last:pr-0">
                    <dd className="font-display text-2xl font-bold text-[#95d5b2] mb-1">{value}</dd>
                    <dt className="text-xs text-white/60 leading-snug">{label}</dt>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
          <section
            id="how-it-works"
            aria-labelledby="how-heading"
            className="py-20 px-5 bg-white"
          >
            <div className="max-w-6xl mx-auto">
              <header className="text-center mb-14">
                <h2 id="how-heading" className="font-display text-3xl font-bold text-[#1b4332] mb-3">
                  {t.how.title}
                </h2>
                <p className="text-[#52b788] text-base max-w-lg mx-auto">
                  {t.how.subtitle}
                </p>
              </header>

              <ol className="relative grid sm:grid-cols-3 gap-10">
                {/* Connector line (desktop) */}
                <li aria-label="Step 1: Create your account and verify identity" className="flex flex-col items-center text-center relative">
                  <div className="w-16 h-16 rounded-2xl bg-[#f0faf4] border-2 border-[#2d6a4f]/20 flex items-center justify-center mb-5 relative">
                    <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9 text-[#2d6a4f]" aria-hidden="true">
                      <circle cx="24" cy="18" r="8" stroke="currentColor" strokeWidth="2"/>
                      <path d="M10 40c0-7.7 6.3-14 14-14s14 6.3 14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M32 14l2 2 4-4" stroke="#52b788" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-[#2d6a4f] text-white text-xs font-bold flex items-center justify-center font-display">1</span>
                  </div>
                  <h3 className="font-display font-bold text-[#1b4332] text-lg mb-2">{t.how.steps[0].title}</h3>
                  <p className="text-[#3a5a47] text-sm leading-relaxed">{t.how.steps[0].body}</p>
                </li>

                <li aria-label="Step 2: Choose a loan product and set your amount" className="flex flex-col items-center text-center relative">
                  <div className="w-16 h-16 rounded-2xl bg-[#f0faf4] border-2 border-[#2d6a4f]/20 flex items-center justify-center mb-5 relative">
                    <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9 text-[#2d6a4f]" aria-hidden="true">
                      <rect x="8" y="12" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="2"/>
                      <path d="M16 22h16M16 28h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <rect x="30" y="24" width="6" height="8" rx="1" fill="currentColor" opacity=".3"/>
                    </svg>
                    <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-[#2d6a4f] text-white text-xs font-bold flex items-center justify-center font-display">2</span>
                  </div>
                  <h3 className="font-display font-bold text-[#1b4332] text-lg mb-2">{t.how.steps[1].title}</h3>
                  <p className="text-[#3a5a47] text-sm leading-relaxed">{t.how.steps[1].body}</p>
                </li>

                <li aria-label="Step 3: Receive funds on Mobile Money" className="flex flex-col items-center text-center relative">
                  <div className="w-16 h-16 rounded-2xl bg-[#f0faf4] border-2 border-[#2d6a4f]/20 flex items-center justify-center mb-5 relative">
                    <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9 text-[#2d6a4f]" aria-hidden="true">
                      <rect x="14" y="6" width="20" height="36" rx="4" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="24" cy="36" r="2" fill="currentColor" opacity=".5"/>
                      <path d="M20 18l4 4 4-4" stroke="#52b788" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M24 14v8" stroke="#52b788" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-[#2d6a4f] text-white text-xs font-bold flex items-center justify-center font-display">3</span>
                  </div>
                  <h3 className="font-display font-bold text-[#1b4332] text-lg mb-2">{t.how.steps[2].title}</h3>
                  <p className="text-[#3a5a47] text-sm leading-relaxed">{t.how.steps[2].body}</p>
                </li>
              </ol>
            </div>
          </section>

          {/* ── LOAN PRODUCTS ────────────────────────────────────────────────── */}
          <section
            id="loan-products"
            aria-labelledby="products-heading"
            className="py-20 px-5"
            style={{ background: "linear-gradient(180deg, #f8fcf9 0%, #f0faf4 100%)" }}
          >
            <div className="max-w-6xl mx-auto">
              <header className="text-center mb-14">
                <h2 id="products-heading" className="font-display text-3xl font-bold text-[#1b4332] mb-3">
                  {t.products.title}
                </h2>
                <p className="text-[#52b788] text-base max-w-lg mx-auto">
                  {t.products.subtitle}
                </p>
              </header>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {LOAN_PRODUCTS.map((p, i) => (
                  <article
                    key={p.slug}
                    aria-label={`${p.name} loan product`}
                    className="bg-white rounded-2xl border border-[#d8e8df] p-6 flex flex-col gap-4 hover:shadow-md hover:border-[#2d6a4f]/40 transition-all"
                    data-testid={`card-product-${p.slug}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-[#f0faf4] flex items-center justify-center text-[#2d6a4f] shrink-0">
                        {p.icon}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-[#1b4332] text-base leading-tight">{p.name}</h3>
                        <p className="text-[#52b788] text-xs font-medium mt-0.5">{t.products.items[i].tagline}</p>
                      </div>
                    </div>
                    <p className="text-[#3a5a47] text-sm leading-relaxed">{t.products.items[i].description}</p>
                    <dl className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-[#eaf3ed]">
                      <div>
                        <dt className="text-[10px] text-[#74c69d] font-semibold uppercase tracking-wide">{t.products.amountRange}</dt>
                        <dd className="text-xs font-semibold text-[#1b4332] mt-0.5">
                          {formatFCFA(p.minAmount)} – {formatFCFA(p.maxAmount)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] text-[#74c69d] font-semibold uppercase tracking-wide">{t.products.interestRate}</dt>
                        <dd className="text-xs font-semibold text-[#1b4332] mt-0.5">{p.rate}% {t.products.perMonth}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] text-[#74c69d] font-semibold uppercase tracking-wide">{t.products.term}</dt>
                        <dd className="text-xs font-semibold text-[#1b4332] mt-0.5">{p.minTerm}–{p.maxTerm} {t.products.months}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] text-[#74c69d] font-semibold uppercase tracking-wide">{t.products.commonUse}</dt>
                        <dd className="text-[10px] text-[#3a5a47] mt-0.5 leading-tight">{t.products.items[i].use}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>

              <div className="text-center mt-10">
                <Link
                  href="/auth?tab=signup"
                  className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-[#1b4332] transition-colors shadow-md shadow-[#2d6a4f]/25"
                  data-testid="link-products-apply"
                >
                  {t.products.cta}
                </Link>
              </div>
            </div>
          </section>

          {/* ── REPAYMENT METHODS ────────────────────────────────────────────── */}
          <section
            aria-labelledby="repayment-heading"
            className="py-20 px-5 bg-[#1b4332]"
          >
            <div className="max-w-6xl mx-auto">
              <header className="text-center mb-14">
                <h2 id="repayment-heading" className="font-display text-3xl font-bold text-white mb-3">
                  {t.repayment.title}
                </h2>
                <p className="text-[#74c69d] text-base max-w-lg mx-auto">
                  {t.repayment.subtitle}
                </p>
              </header>

              <div className="grid sm:grid-cols-3 gap-6">
                {/* MTN Mobile Money */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/8 transition-colors">
                  <div className="w-20 h-14 mx-auto mb-4 rounded-2xl bg-white flex items-center justify-center overflow-hidden">
                    <img src="/mtn_momo.webp" alt="MTN Mobile Money" className="h-12 w-auto object-contain" />
                  </div>
                  <h3 className="font-display font-bold text-white text-base mb-2">{t.repayment.methods[0].title}</h3>
                  <p className="text-[#95d5b2] text-sm leading-relaxed">{t.repayment.methods[0].body}</p>
                </div>

                {/* Orange Money */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/8 transition-colors">
                  <div className="w-20 h-14 mx-auto mb-4 rounded-2xl bg-white flex items-center justify-center overflow-hidden">
                    <img src="/orange_money.png" alt="Orange Money" className="h-12 w-auto object-contain" />
                  </div>
                  <h3 className="font-display font-bold text-white text-base mb-2">{t.repayment.methods[1].title}</h3>
                  <p className="text-[#95d5b2] text-sm leading-relaxed">{t.repayment.methods[1].body}</p>
                </div>

                {/* Bank / Cash */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/8 transition-colors">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#95d5b2]/15 border border-[#95d5b2]/30 flex items-center justify-center">
                    <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9" aria-hidden="true">
                      <path d="M8 20l16-10 16 10H8z" fill="#95d5b2" opacity=".3"/>
                      <path d="M8 20l16-10 16 10H8z" stroke="#95d5b2" strokeWidth="1.5"/>
                      <rect x="12" y="22" width="4" height="12" rx="1" fill="#95d5b2" opacity=".5"/>
                      <rect x="22" y="22" width="4" height="12" rx="1" fill="#95d5b2" opacity=".5"/>
                      <rect x="32" y="22" width="4" height="12" rx="1" fill="#95d5b2" opacity=".5"/>
                      <path d="M6 36h36" stroke="#95d5b2" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h3 className="font-display font-bold text-white text-base mb-2">{t.repayment.methods[2].title}</h3>
                  <p className="text-[#95d5b2] text-sm leading-relaxed">{t.repayment.methods[2].body}</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── WHY BORROWME2K ───────────────────────────────────────────────── */}
          <section
            aria-labelledby="why-heading"
            className="py-20 px-5 bg-white"
          >
            <div className="max-w-6xl mx-auto">
              <header className="text-center mb-14">
                <h2 id="why-heading" className="font-display text-3xl font-bold text-[#1b4332] mb-3">
                  {t.why.title}
                </h2>
                <p className="text-[#52b788] text-base max-w-lg mx-auto">
                  {t.why.subtitle}
                </p>
              </header>

              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  {
                    title: "No collateral, no guarantor",
                    body: "We evaluate applications based on your verified identity and repayment history — not on property or third-party guarantors. This opens credit to people who need it most.",
                    icon: (
                      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8 text-[#2d6a4f]" aria-hidden="true">
                        <path d="M20 6l12 5v10c0 7-5 12-12 13C13 33 8 28 8 21V11l12-5z" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity=".1"/>
                        <path d="M14 20l4 4 8-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ),
                  },
                  {
                    title: "Transparent pricing — no surprises",
                    body: "Interest rate, processing fee, monthly repayment, and total cost are all shown before you confirm your loan. No hidden charges added after disbursement.",
                    icon: (
                      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8 text-[#2d6a4f]" aria-hidden="true">
                        <circle cx="20" cy="20" r="13" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity=".1"/>
                        <path d="M20 13v7l4 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ),
                  },
                  {
                    title: "Real-time loan tracking",
                    body: "Check your outstanding balance, next payment date, and full repayment history inside the app at any time. No need to call or visit an office.",
                    icon: (
                      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8 text-[#2d6a4f]" aria-hidden="true">
                        <rect x="6" y="10" width="28" height="22" rx="4" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity=".1"/>
                        <path d="M12 26l5-6 5 4 5-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ),
                  },
                  {
                    title: "Loans built around Cameroonian life",
                    body: "From agriculture harvest cycles to school registration deadlines and moto-taxi financing — our loan products reflect the actual financial rhythms of people in Douala, Yaoundé, and beyond.",
                    icon: (
                      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8 text-[#2d6a4f]" aria-hidden="true">
                        <circle cx="20" cy="20" r="13" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity=".1"/>
                        <path d="M14 20c2-4 4-6 6-6s4 2 6 6-4 6-6 6-4-2-6-6z" stroke="currentColor" strokeWidth="1.8"/>
                        <circle cx="20" cy="20" r="2.5" fill="currentColor"/>
                      </svg>
                    ),
                  },
                ].map(({ icon }, i) => (
                  <div
                    key={i}
                    className="flex gap-5 p-6 rounded-2xl border border-[#e8f3ed] bg-[#f8fcf9] hover:border-[#2d6a4f]/30 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-xl bg-white border border-[#d8e8df] flex items-center justify-center shrink-0">
                      {icon}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-[#1b4332] text-base mb-2">{t.why.reasons[i].title}</h3>
                      <p className="text-[#3a5a47] text-sm leading-relaxed">{t.why.reasons[i].body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FAQ ──────────────────────────────────────────────────────────── */}
          <section
            id="faq"
            aria-labelledby="faq-heading"
            className="py-20 px-5"
            style={{ background: "linear-gradient(180deg, #f0faf4 0%, #e8f5ee 100%)" }}
          >
            <div className="max-w-2xl mx-auto">
              <header className="text-center mb-12">
                <h2 id="faq-heading" className="font-display text-3xl font-bold text-[#1b4332] mb-3">
                  {t.faq.title}
                </h2>
                <p className="text-[#52b788] text-base">
                  {t.faq.subtitle}
                </p>
              </header>

              <div className="bg-white rounded-2xl border border-[#d8e8df] px-6 divide-y divide-[#eaf3ed]">
                {t.faq.items.map((item) => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          </section>

          {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
          <section
            aria-labelledby="cta-heading"
            className="py-20 px-5 bg-[#2d6a4f] relative overflow-hidden"
          >
            <div aria-hidden="true" className="absolute inset-0 opacity-5" style={{
              backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}/>
            <div className="max-w-2xl mx-auto text-center relative">
              <h2 id="cta-heading" className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
                {t.cta.title}
              </h2>
              <p className="text-[#95d5b2] text-base mb-8 max-w-md mx-auto">
                {t.cta.body}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/auth?tab=signup"
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#1b4332] font-semibold px-8 py-3.5 rounded-xl hover:bg-[#f0faf4] transition-colors shadow-lg"
                  data-testid="link-cta-create-account"
                >
                  {t.cta.createAccount}
                </Link>
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/20 transition-colors"
                  data-testid="link-cta-signin"
                >
                  {t.cta.signin}
                </Link>
              </div>
            </div>
          </section>

        </main>

        {/* ── FOOTER ────────────────────────────────────────────────────────── */}
        <footer role="contentinfo" className="bg-[#1b4332] border-t border-white/5 py-12 px-5">
          <div className="max-w-6xl mx-auto">
            <div className="grid sm:grid-cols-3 gap-8 mb-10">
              <div>
                <a href="/" className="flex items-center gap-2 mb-3" aria-label="BorrowMe2K home">
                  <img src="/logo.png" alt="BorrowMe2K logo" className="h-8 w-auto brightness-0 invert" />
                </a>
                <p className="text-[#74c69d] text-sm leading-relaxed">
                  {t.footer.tagline}
                </p>
              </div>
              <nav aria-label="Loan products">
                <p className="text-xs font-semibold text-[#52b788] uppercase tracking-wider mb-3">{t.footer.colProducts}</p>
                <ul className="space-y-2">
                  {LOAN_PRODUCTS.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href="/auth?tab=signup"
                        className="text-[#95d5b2] text-sm hover:text-white transition-colors"
                      >
                        {p.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <nav aria-label="Site links">
                <p className="text-xs font-semibold text-[#52b788] uppercase tracking-wider mb-3">{t.footer.colAccount}</p>
                <ul className="space-y-2">
                  <li>
                    <Link href="/auth" className="text-[#95d5b2] text-sm hover:text-white transition-colors">
                      {t.footer.linkSignin}
                    </Link>
                  </li>
                  <li>
                    <Link href="/auth?tab=signup" className="text-[#95d5b2] text-sm hover:text-white transition-colors">
                      {t.footer.linkCreate}
                    </Link>
                  </li>
                  <li>
                    <a href="#faq" className="text-[#95d5b2] text-sm hover:text-white transition-colors">
                      {t.footer.linkFaq}
                    </a>
                  </li>
                  <li>
                    <a href="#how-it-works" className="text-[#95d5b2] text-sm hover:text-white transition-colors">
                      {t.footer.linkHow}
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
            <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
              <p className="text-[#52b788] text-xs">
                {t.footer.copyright(new Date().getFullYear())}
              </p>
              <p className="text-[#3a5a47] text-xs">
                {t.footer.currency}
              </p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
