import { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "en" | "fr";
const LS_KEY = "bm2k_lang";

function getSaved(): Lang {
  try { const v = localStorage.getItem(LS_KEY); if (v === "fr" || v === "en") return v; } catch {}
  return "en";
}

export const translations = {
  en: {
    landing: {
      nav: { signin: "Sign in", getStarted: "Get started" },
      hero: {
        badge: "Online loans for Cameroonians",
        titleLine1: "Fast loans for every",
        titleLine2: "Cameroonian need",
        subtitle: "Apply online in minutes. Funds arrive on your MTN MoMo or Orange Money wallet — no collateral, no branch visit, six loan products for life's real demands.",
        cta1: "Apply for a loan",
        cta2: "See loan products",
        stats: [
          { value: "6", label: "Loan products", desc: "tailored to Cameroonian life" },
          { value: "0", label: "Collateral required", desc: "identity verification only" },
          { value: "2.5%", label: "From per month", desc: "starting interest rate" },
        ],
      },
      trust: [
        { value: "10 min", label: "Average approval time" },
        { value: "0 FCFA", label: "Application fee" },
        { value: "6", label: "Loan products available" },
        { value: "3", label: "Repayment channels" },
      ],
      how: {
        title: "From application to wallet in three steps",
        subtitle: "No branch visit, no long forms, no hidden steps.",
        steps: [
          { title: "Create account & verify identity", body: "Register with your name, phone, and email. Submit your national ID for a one-time identity check — done in under five minutes." },
          { title: "Pick a product and set your amount", body: "Browse six loan products. Slide to your desired amount and term — your monthly repayment and total cost update instantly before you apply." },
          { title: "Receive funds on Mobile Money", body: "Once approved, funds are sent directly to your MTN MoMo or Orange Money wallet. Repay monthly via mobile money, bank transfer, or cash." },
        ],
      },
      products: {
        title: "Six loan products for real Cameroonian needs",
        subtitle: "Each product is purpose-built, with amounts, rates, and terms designed around how Cameroonians actually live and work.",
        amountRange: "Amount range",
        interestRate: "Interest rate",
        term: "Term",
        commonUse: "Common use",
        months: "months",
        perMonth: "/ month",
        cta: "Apply for a loan today",
        items: [
          { tagline: "Emergency funds in minutes", description: "Unexpected expenses don't wait for payday. Quick Cash puts money in your Mobile Money wallet fast — no collateral, minimal paperwork.", use: "Medical bills, utility arrears, urgent travel" },
          { tagline: "Access your salary before payday", description: "For salaried workers who need cash before month-end. Repay in one lump-sum when your salary lands, keeping your budget intact.", use: "Rent advance, home appliances, family expenses" },
          { tagline: "Working capital for your enterprise", description: "Designed for traders, shop owners, and SME operators. Stock up, expand, or bridge a cash-flow gap without disrupting your operations.", use: "Stock purchase, equipment, market expansion" },
          { tagline: "Never let fees interrupt education", description: "Cover tuition, levies, and registration fees for primary, secondary or university. Repay comfortably across the school term.", use: "Tuition, exam fees, school supplies" },
          { tagline: "Fund the harvest cycle", description: "Built around planting and harvest seasons. Finance seeds, fertiliser, farming tools, or post-harvest storage — with longer repayment windows.", use: "Seeds, fertiliser, farm tools, storage" },
          { tagline: "Finance your transport income", description: "Buy a moto-taxi, commercial bike, or light vehicle with structured monthly repayments — turning transport into a revenue stream.", use: "Moto-taxi, commercial bike, light vehicles" },
        ],
      },
      repayment: {
        title: "Repay the way that works for you",
        subtitle: "Three channels, all tracked automatically in your BorrowMe2K account.",
        methods: [
          { title: "MTN Mobile Money", body: "Send your monthly payment directly from your MTN MoMo wallet — available anywhere in Cameroon, 24/7." },
          { title: "Orange Money", body: "Orange Money subscribers can repay without cash or branches — just your phone. Every payment is logged instantly." },
          { title: "Bank Transfer or Cash", body: "Prefer a bank transfer or in-person cash payment? Both are accepted and reflected in your loan account within one business day." },
        ],
      },
      why: {
        title: "Why borrowers choose BorrowMe2K",
        subtitle: "Built for Cameroon's financial reality, not a generic template.",
        reasons: [
          { title: "No collateral, no guarantor", body: "We evaluate applications based on your verified identity and repayment history — not on property or third-party guarantors. This opens credit to people who need it most." },
          { title: "Transparent pricing — no surprises", body: "Interest rate, processing fee, monthly repayment, and total cost are all shown before you confirm your loan. No hidden charges added after disbursement." },
          { title: "Real-time loan tracking", body: "Check your outstanding balance, next payment date, and full repayment history inside the app at any time. No need to call or visit an office." },
          { title: "Loans built around Cameroonian life", body: "From agriculture harvest cycles to school registration deadlines and moto-taxi financing — our loan products reflect the actual financial rhythms of people in Douala, Yaoundé, and beyond." },
        ],
      },
      faq: {
        title: "Frequently asked questions",
        subtitle: "Everything you need to know before you apply.",
        items: [
          { q: "How quickly can I receive a loan in Cameroon?", a: "Once your ID is verified and your application is approved, disbursement to your Mobile Money wallet (MTN MoMo or Orange Money) or bank account typically happens within the same business day." },
          { q: "Do I need collateral to borrow on BorrowMe2K?", a: "No. BorrowMe2K is a collateral-free micro-lending platform. We rely on identity verification and your repayment history instead of physical assets." },
          { q: "What interest rate does BorrowMe2K charge?", a: "Interest rates depend on the loan product: from 2.5% per month for School Fees loans up to 5% per month for Quick Cash. Your exact rate and monthly repayment are shown before you confirm any application." },
          { q: "How do I repay my loan?", a: "You can repay through MTN Mobile Money, Orange Money, direct bank transfer, or cash at our offices. All payments are logged instantly in the app so you can track your balance in real time." },
          { q: "Can I apply for multiple loans at the same time?", a: "Yes — provided your outstanding balance and repayment track record support additional credit. Each application is reviewed individually." },
          { q: "What is ID verification and why is it required?", a: "ID verification is a one-time identity check required by Cameroonian financial regulations. You submit your national ID or passport once; after approval you can apply for any loan product." },
        ],
      },
      cta: {
        title: "Ready to apply for your loan?",
        body: "Create your account in two minutes. Your first loan application can be submitted the same day your identity is verified.",
        createAccount: "Create free account",
        signin: "Sign in",
      },
      footer: {
        tagline: "Cameroon's online micro-lending platform. Fast, fair, collateral-free.",
        colProducts: "Loan products",
        colAccount: "Account",
        linkSignin: "Sign in",
        linkCreate: "Create account",
        linkFaq: "FAQ",
        linkHow: "How it works",
        copyright: (y: number) => `© ${y} BorrowMe2K. All rights reserved. Serving borrowers across Cameroon.`,
        currency: "Amounts in Central African CFA Franc (XAF / FCFA)",
      },
    },

    auth: {
      tabLogin: "Login",
      tabSignup: "Sign Up",
      tagline: "Cameroon's instant loan partner — borrow, build, repay.",
      login: {
        credentialLabel: "Phone, email or username",
        credentialPlaceholder: "e.g. +237 6 70 00 00 00",
        passwordLabel: "Password",
        passwordPlaceholder: "Enter password",
        forgotPassword: "Forgot password?",
        submitButton: "Sign in",
        welcomeBack: "Welcome back to BorrowMe2K",
        loginFailed: "Login failed",
        invalidCredentials: "Invalid credentials",
      },
      forgot: {
        title: "Reset your password",
        subtitle: "Enter the email on your account and we'll send you a reset link.",
        emailLabel: "Email address",
        emailPlaceholder: "you@example.com",
        sendButton: "Send reset link",
        back: "Back",
        checkInbox: "Check your inbox",
        sent: "A password reset link has been sent. It expires in 1 hour.",
        backToLogin: "Back to login",
        couldNotSend: "Could not send reset link",
      },
      register: {
        steps: ["Personal", "Contact", "Verify", "Password"],
        step1Title: "Personal information",
        fullNameLabel: "Full name",
        fullNamePlaceholder: "e.g. Awa Tabe",
        fullNameWarning: "Enter your real legal name exactly as it appears on your ID. This will be used for identity verification.",
        usernameLabel: "Username",
        usernamePlaceholder: "e.g. awa_tabe",
        usernameHint: "Lowercase letters, numbers and underscores only.",
        cityLabel: "City",
        cityPlaceholder: "Douala, Yaoundé, Bamenda…",
        continueButton: "Continue",
        backButton: "Back",
        step2Title: "Contact details",
        phoneLabel: "Phone (Mobile Money)",
        phonePlaceholder: "+237 6 XX XX XX XX",
        emailLabel: "Email address",
        emailPlaceholder: "you@example.com",
        sendCodeButton: "Send verification code",
        step3VerifyTitle: "Verify your email",
        step3VerifySubtitle: "We sent a 4-digit code to",
        codeLabel: "Verification code",
        codePlaceholder: "_ _ _ _",
        verifyButton: "Verify",
        didntGetIt: "Didn't get it?",
        goBackToResend: "Go back to resend",
        step4Title: "Set your password",
        verifiedLabel: "verified successfully",
        passwordLabel: "Password",
        passwordPlaceholder: "At least 8 characters",
        createAccountButton: "Create account",
        codeSentTitle: "Code sent!",
        codeSentDesc: (email: string) => `Check ${email} for your 4-digit code.`,
        couldNotSend: "Could not send code",
        tryAgain: "Try again",
        welcome: "Welcome to BorrowMe2K!",
        registrationFailed: "Registration failed",
        couldNotCreate: "Could not create account",
      },
    },

    kyc: {
      title: "Identity Verification",
      subtitle: "Before you can access BorrowMe2K, we need to verify your identity. This is a one-time process required by Cameroonian financial regulations.",
      docsTitle: "What you'll need",
      docs: [
        "National ID card (front and back)",
        "A clear selfie holding your ID card",
        "Your phone number for confirmation",
      ],
      howTitle: "How it works",
      howSteps: [
        "Your details are ready",
        "Click to start verification",
        "Our team reviews within 24h",
      ],
      startButton: "Start identity verification",
      loadingButton: "Preparing your link…",
      openButton: "Open verification link",
      linkOpenedTitle: "Verification started",
      linkOpenedBody: "Complete all steps in the verification tab that just opened. Return here at any time to check your status.",
      refreshButton: "Refresh status",
      pendingTitle: "Under review",
      pendingBody: "Our team is reviewing your documents. You'll receive an email once your account is approved — usually within 24 hours.",
      pendingEta: "Typical review time: 24 hours",
      rejectedTitle: "Verification not approved",
      rejectedBody: "Unfortunately your identity verification was not approved. Please contact our support team for help.",
      contactSupport: "Contact support",
      logout: "Log out",
      noLinkAvailable: "No verification links are currently available. Please try again in a few minutes.",
    },
  },

  fr: {
    landing: {
      nav: { signin: "Se connecter", getStarted: "Commencer" },
      hero: {
        badge: "Prêts en ligne pour les Camerounais",
        titleLine1: "Des prêts rapides pour",
        titleLine2: "chaque besoin camerounais",
        subtitle: "Faites votre demande en ligne en quelques minutes. Les fonds arrivent sur votre portefeuille MTN MoMo ou Orange Money — sans garantie, sans visite en agence, six produits pour vos besoins réels.",
        cta1: "Demander un prêt",
        cta2: "Voir les produits",
        stats: [
          { value: "6", label: "Produits de prêt", desc: "adaptés à la vie camerounaise" },
          { value: "0", label: "Garantie requise", desc: "vérification d'identité uniquement" },
          { value: "2,5 %", label: "Dès par mois", desc: "taux d'intérêt de départ" },
        ],
      },
      trust: [
        { value: "10 min", label: "Délai moyen d'approbation" },
        { value: "0 FCFA", label: "Frais de dossier" },
        { value: "6", label: "Produits disponibles" },
        { value: "3", label: "Canaux de remboursement" },
      ],
      how: {
        title: "De la demande au portefeuille en trois étapes",
        subtitle: "Pas de visite en agence, pas de formulaires longs, pas d'étapes cachées.",
        steps: [
          { title: "Créer un compte et vérifier son identité", body: "Inscrivez-vous avec votre nom, téléphone et e-mail. Soumettez votre pièce d'identité pour une vérification unique — en moins de cinq minutes." },
          { title: "Choisir un produit et définir son montant", body: "Parcourez six produits de prêt. Faites glisser jusqu'au montant et à la durée souhaités — votre mensualité et le coût total se mettent à jour instantanément." },
          { title: "Recevoir les fonds sur Mobile Money", body: "Une fois approuvé, les fonds sont envoyés directement sur votre portefeuille MTN MoMo ou Orange Money. Remboursez mensuellement via mobile money, virement ou espèces." },
        ],
      },
      products: {
        title: "Six produits de prêt pour de vrais besoins camerounais",
        subtitle: "Chaque produit est conçu avec des montants, des taux et des durées adaptés à la façon dont les Camerounais vivent et travaillent.",
        amountRange: "Montant",
        interestRate: "Taux d'intérêt",
        term: "Durée",
        commonUse: "Utilisation courante",
        months: "mois",
        perMonth: "/ mois",
        cta: "Demander un prêt aujourd'hui",
        items: [
          { tagline: "Fonds d'urgence en quelques minutes", description: "Les dépenses imprévues n'attendent pas le jour de paie. Quick Cash met de l'argent sur votre portefeuille Mobile Money rapidement — sans garantie, peu de paperasse.", use: "Factures médicales, arrières, voyage urgent" },
          { tagline: "Accédez à votre salaire avant le jour de paie", description: "Pour les salariés qui ont besoin d'argent avant la fin du mois. Remboursez en une seule somme à la réception de votre salaire.", use: "Avance de loyer, électroménager, dépenses familiales" },
          { tagline: "Fonds de roulement pour votre entreprise", description: "Conçu pour les commerçants, propriétaires de boutiques et PME. Réapprovisionnez, développez-vous ou comblez un déficit de trésorerie.", use: "Achat de stock, équipements, expansion" },
          { tagline: "Ne laissez jamais les frais interrompre l'éducation", description: "Couvrez les frais de scolarité pour le primaire, le secondaire ou l'université. Remboursez confortablement sur le trimestre scolaire.", use: "Frais de scolarité, d'examen, fournitures" },
          { tagline: "Financez le cycle de récolte", description: "Conçu autour des saisons de plantation et de récolte. Financez semences, engrais, outils agricoles ou stockage post-récolte avec des délais plus longs.", use: "Semences, engrais, outils agricoles, stockage" },
          { tagline: "Financez vos revenus de transport", description: "Achetez un moto-taxi, un vélo commercial ou un véhicule léger avec des mensualités structurées — transformez le transport en source de revenus.", use: "Moto-taxi, vélo commercial, véhicules légers" },
        ],
      },
      repayment: {
        title: "Remboursez comme vous le souhaitez",
        subtitle: "Trois canaux, tous suivis automatiquement dans votre compte BorrowMe2K.",
        methods: [
          { title: "MTN Mobile Money", body: "Envoyez votre mensualité directement depuis votre portefeuille MTN MoMo — disponible partout au Cameroun, 24h/24, 7j/7." },
          { title: "Orange Money", body: "Les abonnés Orange Money remboursent sans espèces ni agences — juste votre téléphone. Chaque paiement est enregistré instantanément." },
          { title: "Virement bancaire ou espèces", body: "Vous préférez un virement ou un paiement en espèces ? Les deux sont acceptés et reflétés dans votre compte sous un jour ouvrable." },
        ],
      },
      why: {
        title: "Pourquoi les emprunteurs choisissent BorrowMe2K",
        subtitle: "Construit pour la réalité financière du Cameroun, pas un modèle générique.",
        reasons: [
          { title: "Sans garantie, sans caution", body: "Nous évaluons les demandes en fonction de votre identité vérifiée et de votre historique de remboursement — pas de bien immobilier ni de caution tiers. Cela ouvre le crédit à ceux qui en ont le plus besoin." },
          { title: "Prix transparents — aucune surprise", body: "Le taux d'intérêt, les frais de dossier, la mensualité et le coût total sont tous affichés avant de confirmer votre prêt. Pas de frais cachés après le versement." },
          { title: "Suivi des prêts en temps réel", body: "Consultez votre solde impayé, la date du prochain paiement et l'historique complet dans l'application à tout moment. Pas besoin d'appeler ou de visiter un bureau." },
          { title: "Prêts conçus pour la vie camerounaise", body: "Des cycles de récolte agricole aux délais d'inscription scolaire et au financement de moto-taxi — nos produits reflètent les rythmes financiers réels des gens à Douala, Yaoundé et au-delà." },
        ],
      },
      faq: {
        title: "Questions fréquentes",
        subtitle: "Tout ce que vous devez savoir avant de postuler.",
        items: [
          { q: "Comment recevoir rapidement un prêt au Cameroun ?", a: "Une fois votre identité vérifiée et votre demande approuvée, le versement sur votre portefeuille Mobile Money (MTN MoMo ou Orange Money) ou compte bancaire se fait généralement dans la même journée ouvrable." },
          { q: "Ai-je besoin d'une garantie pour emprunter sur BorrowMe2K ?", a: "Non. BorrowMe2K est une plateforme de micro-prêt sans garantie. Nous nous appuyons sur la vérification d'identité et votre historique de remboursement plutôt que sur des actifs physiques." },
          { q: "Quel taux d'intérêt BorrowMe2K applique-t-il ?", a: "Les taux dépendent du produit : de 2,5 % par mois pour les prêts Frais de scolarité jusqu'à 5 % pour Quick Cash. Votre taux exact et votre mensualité sont affichés avant de confirmer votre demande." },
          { q: "Comment rembourser mon prêt ?", a: "Vous pouvez rembourser via MTN Mobile Money, Orange Money, virement bancaire ou espèces dans nos bureaux. Tous les paiements sont enregistrés instantanément dans l'application." },
          { q: "Puis-je demander plusieurs prêts en même temps ?", a: "Oui — à condition que votre solde impayé et votre historique de remboursement supportent un crédit supplémentaire. Chaque demande est examinée individuellement." },
          { q: "Qu'est-ce que la vérification d'identité et pourquoi est-elle requise ?", a: "La vérification d'identité est un contrôle unique requis par la réglementation financière camerounaise. Vous soumettez votre carte nationale d'identité ou passeport une fois ; après approbation, vous pouvez demander n'importe quel produit." },
        ],
      },
      cta: {
        title: "Prêt à demander votre prêt ?",
        body: "Créez votre compte en deux minutes. Votre première demande peut être soumise le jour même où votre identité est vérifiée.",
        createAccount: "Créer un compte gratuit",
        signin: "Se connecter",
      },
      footer: {
        tagline: "Plateforme de micro-prêt en ligne du Cameroun. Rapide, équitable, sans garantie.",
        colProducts: "Produits de prêt",
        colAccount: "Compte",
        linkSignin: "Se connecter",
        linkCreate: "Créer un compte",
        linkFaq: "FAQ",
        linkHow: "Comment ça marche",
        copyright: (y: number) => `© ${y} BorrowMe2K. Tous droits réservés. Au service des emprunteurs à travers le Cameroun.`,
        currency: "Montants en Franc CFA d'Afrique Centrale (XAF / FCFA)",
      },
    },

    auth: {
      tabLogin: "Connexion",
      tabSignup: "Inscription",
      tagline: "Votre partenaire de prêt instantané au Cameroun — empruntez, construisez, remboursez.",
      login: {
        credentialLabel: "Téléphone, e-mail ou nom d'utilisateur",
        credentialPlaceholder: "ex. +237 6 70 00 00 00",
        passwordLabel: "Mot de passe",
        passwordPlaceholder: "Entrer le mot de passe",
        forgotPassword: "Mot de passe oublié ?",
        submitButton: "Se connecter",
        welcomeBack: "Bienvenue de retour sur BorrowMe2K",
        loginFailed: "Échec de connexion",
        invalidCredentials: "Identifiants incorrects",
      },
      forgot: {
        title: "Réinitialiser votre mot de passe",
        subtitle: "Entrez l'e-mail de votre compte et nous vous enverrons un lien de réinitialisation.",
        emailLabel: "Adresse e-mail",
        emailPlaceholder: "vous@exemple.com",
        sendButton: "Envoyer le lien",
        back: "Retour",
        checkInbox: "Vérifiez votre boîte de réception",
        sent: "Un lien de réinitialisation a été envoyé. Il expire dans 1 heure.",
        backToLogin: "Retour à la connexion",
        couldNotSend: "Impossible d'envoyer le lien",
      },
      register: {
        steps: ["Personnel", "Contact", "Vérification", "Mot de passe"],
        step1Title: "Informations personnelles",
        fullNameLabel: "Nom complet",
        fullNamePlaceholder: "ex. Awa Tabe",
        fullNameWarning: "Entrez votre vrai nom légal exactement comme il apparaît sur votre pièce d'identité. Il sera utilisé pour la vérification d'identité.",
        usernameLabel: "Nom d'utilisateur",
        usernamePlaceholder: "ex. awa_tabe",
        usernameHint: "Lettres minuscules, chiffres et underscores uniquement.",
        cityLabel: "Ville",
        cityPlaceholder: "Douala, Yaoundé, Bamenda…",
        continueButton: "Continuer",
        backButton: "Retour",
        step2Title: "Coordonnées",
        phoneLabel: "Téléphone (Mobile Money)",
        phonePlaceholder: "+237 6 XX XX XX XX",
        emailLabel: "Adresse e-mail",
        emailPlaceholder: "vous@exemple.com",
        sendCodeButton: "Envoyer le code de vérification",
        step3VerifyTitle: "Vérifiez votre e-mail",
        step3VerifySubtitle: "Nous avons envoyé un code à 4 chiffres à",
        codeLabel: "Code de vérification",
        codePlaceholder: "_ _ _ _",
        verifyButton: "Vérifier",
        didntGetIt: "Vous ne l'avez pas reçu ?",
        goBackToResend: "Retourner pour renvoyer",
        step4Title: "Définir votre mot de passe",
        verifiedLabel: "vérifié avec succès",
        passwordLabel: "Mot de passe",
        passwordPlaceholder: "Au moins 8 caractères",
        createAccountButton: "Créer mon compte",
        codeSentTitle: "Code envoyé !",
        codeSentDesc: (email: string) => `Vérifiez ${email} pour votre code à 4 chiffres.`,
        couldNotSend: "Impossible d'envoyer le code",
        tryAgain: "Réessayer",
        welcome: "Bienvenue sur BorrowMe2K !",
        registrationFailed: "Échec de l'inscription",
        couldNotCreate: "Impossible de créer le compte",
      },
    },

    kyc: {
      title: "Vérification d'identité",
      subtitle: "Avant d'accéder à BorrowMe2K, nous devons vérifier votre identité. C'est un processus unique requis par la réglementation financière camerounaise.",
      docsTitle: "Ce dont vous aurez besoin",
      docs: [
        "Carte nationale d'identité (recto et verso)",
        "Un selfie clair tenant votre pièce d'identité",
        "Votre numéro de téléphone pour confirmation",
      ],
      howTitle: "Comment ça fonctionne",
      howSteps: [
        "Vos informations sont prêtes",
        "Cliquez pour commencer la vérification",
        "Notre équipe examine sous 24h",
      ],
      startButton: "Commencer la vérification d'identité",
      loadingButton: "Préparation de votre lien…",
      openButton: "Ouvrir le lien de vérification",
      linkOpenedTitle: "Vérification lancée",
      linkOpenedBody: "Complétez toutes les étapes dans l'onglet de vérification qui vient de s'ouvrir. Revenez ici à tout moment pour vérifier votre statut.",
      refreshButton: "Actualiser le statut",
      pendingTitle: "En cours d'examen",
      pendingBody: "Notre équipe examine vos documents. Vous recevrez un e-mail une fois votre compte approuvé — généralement dans les 24 heures.",
      pendingEta: "Délai d'examen habituel : 24 heures",
      rejectedTitle: "Vérification non approuvée",
      rejectedBody: "Malheureusement, votre vérification d'identité n'a pas été approuvée. Veuillez contacter notre équipe d'assistance pour obtenir de l'aide.",
      contactSupport: "Contacter le support",
      logout: "Se déconnecter",
      noLinkAvailable: "Aucun lien de vérification n'est disponible pour le moment. Veuillez réessayer dans quelques minutes.",
    },
  },
} as const;

type LangCtx = { lang: Lang; setLang: (l: Lang) => void };
export const LangContext = createContext<LangCtx>({ lang: "en", setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getSaved);
  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(LS_KEY, l); } catch {}
  };
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <button
      onClick={() => setLang(lang === "en" ? "fr" : "en")}
      className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${className}`}
      aria-label="Switch language"
    >
      <span className={lang === "en" ? "opacity-100" : "opacity-40"}>EN</span>
      <span className="opacity-30">|</span>
      <span className={lang === "fr" ? "opacity-100" : "opacity-40"}>FR</span>
    </button>
  );
}
