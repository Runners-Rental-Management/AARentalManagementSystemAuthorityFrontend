export type Locale = "en" | "am";

/** Shared with tenant/landlord frontend so locale persists across apps. */
const LOCALE_STORAGE_KEY = "aa_rental_locale";

export const translations = {
  en: {
    common: {
      english: "English",
      amharic: "አማርኛ",
      close: "Close",
      closeDialog: "Close dialog",
      ok: "OK",
      loading: "Loading…",
      databaseUnavailable:
        "The database is not reachable. Start the API backend and PostgreSQL, then try again.",
      internalServerError:
        "The server encountered an error. Please try again in a moment or contact support.",
      unexpectedError: "An unexpected error occurred. Please try again.",
      backendUnreachable:
        "Could not reach the server. Check that the API is running and try again.",
    },
    auth: {
      loginFailed: "Sign in failed",
      invalidCredentials:
        "Incorrect email or password. Please check your details and try again.",
      sessionExpired: "Your session has expired. Please sign in again.",
    },
    authorityAuth: {
      portalTitle: "Authority Portal",
      heroTitle: "Government rental administration",
      heroDesc:
        "Verify tenancy agreements, resolve disputes, approve rent adjustments, and oversee the Addis Ababa regulated rental market.",
      footerNotice: "Authorized personnel only. All actions are logged.",
      officialSignIn: "Official sign in",
      role: "Role",
      locationAdmin: "Location-based Admin",
      officialEmail: "Official email",
      password: "Password",
      credentialsRequired:
        "Enter your official email and password (min 8 characters).",
      demoHint:
        "Demo: admin@aarental.local or admin-bole@aarental.local / Passw0rd!234",
      signIn: "Sign in",
      signingIn: "Signing in…",
    },
  },
  am: {
    common: {
      english: "English",
      amharic: "አማርኛ",
      close: "ዝጋ",
      closeDialog: "መገናኛ ዝጋ",
      ok: "እሺ",
      loading: "በመጫን ላይ…",
      databaseUnavailable:
        "ዳታቤዝ አልተገኘም። የኤፒአይ አገልጋይ እና PostgreSQL ያስኬዱ፣ ከዚያ እንደገና ይሞክሩ።",
      internalServerError:
        "አገልጋዩ ስህተት አጋጥሞታል። ትንሽ ቆይተው እንደገና ይሞክሩ ወይም ድጋፍ ያግኙ።",
      unexpectedError: "ያልተጠበቀ ስህተት ተከስቷል። እባክዎ እንደገና ይሞክሩ።",
      backendUnreachable:
        "አገልጋዩን ማግኘት አልተቻለም። API እንደሚሰራ ያረጋግጡና እንደገና ይሞክሩ።",
    },
    auth: {
      loginFailed: "መግባት አልተሳካም",
      invalidCredentials:
        "ኢሜይል ወይም የይለፍ ቃል ትክክል አይደለም። ዝርዝሮችዎን ያረጋግጡና እንደገና ይሞክሩ።",
      sessionExpired: "የእርስዎ ክፍለ ጊዜ አልቋል። እባክዎ እንደገና ይግቡ።",
    },
    authorityAuth: {
      portalTitle: "የባለስልጣን መግቢያ",
      heroTitle: "የመንግስት የኪራይ አስተዳደር",
      heroDesc:
        "የኪራይ ስምምነቶችን ያረጋግጡ፣ ክርክሮችን ይፍቱ፣ የኪራይ ማስተካከያዎችን ያጽድቁ እና የአዲስ አበባ የተቆጣጠረ ገበያን ይቆጣጠሩ።",
      footerNotice: "ለተፈቀዱ ሰራተኞች ብቻ። ሁሉም ተግባራት ይመዘገባሉ።",
      officialSignIn: "ኦፊሴላዊ መግቢያ",
      role: "ሚና",
      locationAdmin: "ቦታ ላይ የተመሰረተ አስተዳዳሪ",
      officialEmail: "ኦፊሴላዊ ኢሜይል",
      password: "የይለፍ ቃል",
      credentialsRequired: "ኦፊሴላዊ ኢሜይልዎን እና የይለፍ ቃልዎን ያስገቡ (ቢያንስ 8 ቁምፊ)።",
      demoHint:
        "ሙከራ፡ admin@aarental.local ወይም admin-bole@aarental.local / Passw0rd!234",
      signIn: "ግባ",
      signingIn: "በመግባት ላይ…",
    },
  },
} as const;

export type TranslationSection = keyof (typeof translations)["en"];

export function getStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "en" || stored === "am") return stored;
  } catch {
    // ignore
  }
  return "en";
}

export function storeLocale(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}

export function resolveTranslation(
  locale: Locale,
  section: TranslationSection,
  key: string,
): string {
  const sectionObj = translations[locale][section] as Record<string, string>;
  if (key in sectionObj) return sectionObj[key];

  const fallback = translations.en[section] as Record<string, string>;
  if (key in fallback) {
    if (import.meta.env.DEV) {
      console.warn(`[i18n] Missing "${locale}.${section}.${key}" — using English`);
    }
    return fallback[key];
  }

  if (import.meta.env.DEV) {
    console.warn(`[i18n] Missing translation key: ${section}.${key}`);
  }
  return fallback[key] ?? key;
}
