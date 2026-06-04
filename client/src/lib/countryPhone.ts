export interface CountryInfo {
  code: string;
  name: string;
  dialCode: string;
  phonePlaceholder: string;
}

const TIMEZONE_MAP: Record<string, CountryInfo> = {
  "Africa/Porto-Novo": { code: "BJ", name: "Benin", dialCode: "+229", phonePlaceholder: "+229 XX XX XX XX" },
  "Africa/Cotonou":    { code: "BJ", name: "Benin", dialCode: "+229", phonePlaceholder: "+229 XX XX XX XX" },
  "Africa/Ouagadougou":{ code: "BF", name: "Burkina Faso", dialCode: "+226", phonePlaceholder: "+226 XX XX XX XX" },
  "Africa/Abidjan":    { code: "CI", name: "Ivory Coast", dialCode: "+225", phonePlaceholder: "+225 XX XX XX XX XX" },
  "Africa/Bamako":     { code: "ML", name: "Mali", dialCode: "+223", phonePlaceholder: "+223 XX XX XX XX" },
  "Africa/Niamey":     { code: "NE", name: "Niger", dialCode: "+227", phonePlaceholder: "+227 XX XX XX XX" },
  "Africa/Dakar":      { code: "SN", name: "Senegal", dialCode: "+221", phonePlaceholder: "+221 XX XXX XX XX" },
  "Africa/Lome":       { code: "TG", name: "Togo", dialCode: "+228", phonePlaceholder: "+228 XX XX XX XX" },
  "Africa/Douala":     { code: "CM", name: "Cameroon", dialCode: "+237", phonePlaceholder: "+237 6 XX XX XX XX" },
  "Africa/Bangui":     { code: "CF", name: "Central African Republic", dialCode: "+236", phonePlaceholder: "+236 XX XX XX XX" },
  "Africa/Ndjamena":   { code: "TD", name: "Chad", dialCode: "+235", phonePlaceholder: "+235 XX XX XX XX" },
  "Africa/Libreville": { code: "GA", name: "Gabon", dialCode: "+241", phonePlaceholder: "+241 X XX XX XX" },
  "Africa/Brazzaville":{ code: "CG", name: "Republic of the Congo", dialCode: "+242", phonePlaceholder: "+242 XX XXX XX XX" },
  "Africa/Lagos":      { code: "NG", name: "Nigeria", dialCode: "+234", phonePlaceholder: "+234 XX XXXX XXXX" },
  "Africa/Accra":      { code: "GH", name: "Ghana", dialCode: "+233", phonePlaceholder: "+233 XX XXX XXXX" },
};

const DEFAULT_COUNTRY: CountryInfo = {
  code: "CM",
  name: "Cameroon",
  dialCode: "+237",
  phonePlaceholder: "+237 6 XX XX XX XX",
};

export function detectCountryFromTimezone(): CountryInfo {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_MAP[tz] ?? DEFAULT_COUNTRY;
  } catch {
    return DEFAULT_COUNTRY;
  }
}
