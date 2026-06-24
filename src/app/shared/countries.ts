// Países para etiquetar comidas típicas (con bandera emoji).
export interface Country {
  code: string;   // ISO-3166-1 alpha-2
  name: string;   // nombre en español
  flag: string;   // emoji bandera
}

export const COUNTRIES: Country[] = [
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'PA', name: 'Panamá', flag: '🇵🇦' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'DO', name: 'República Dominicana', flag: '🇩🇴' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'FR', name: 'Francia', flag: '🇫🇷' },
  { code: 'JP', name: 'Japón', flag: '🇯🇵' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'TH', name: 'Tailandia', flag: '🇹🇭' },
  { code: 'INT', name: 'Internacional', flag: '🌎' },
];

const BY_CODE: Record<string, Country> = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

export const getCountry = (code?: string | null): Country | undefined =>
  code ? BY_CODE[code] : undefined;

// Normaliza para búsqueda (sin acentos, minúsculas).
const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function searchCountries(q: string): Country[] {
  const s = norm(q.trim());
  if (!s) return COUNTRIES;
  return COUNTRIES.filter((c) => norm(c.name).includes(s) || c.code.toLowerCase() === s);
}
