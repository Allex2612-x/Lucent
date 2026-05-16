import {
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  UtensilsCrossed,
  Bus,
  Home,
  Film,
  HeartPulse,
  ShoppingBag,
  GraduationCap,
  Zap,
  Coffee,
  Repeat,
  Wallet,
  CreditCard,
  Plane,
  Fuel,
  Tag as TagIcon,
  Music,
  Dumbbell,
  Smartphone,
  Wrench,
  PiggyBank,
  ShoppingCart,
  PawPrint,
  Baby,
  Banknote,
} from 'lucide-react';

type LucideIcon = typeof Briefcase;

/**
 * Canonical name lookup. Keys are normalised (lowercased, diacritics stripped).
 * The lookup runs against the icon field FIRST so users can pick a name
 * directly (e.g. "wallet" → Wallet), then falls back to matching the category
 * name (so a category called "Mâncare" with an empty icon still shows the
 * fork-knife icon).
 */
const ICON_MAP: Record<string, LucideIcon> = {
  // generic / income
  salariu: Briefcase,
  salary: Briefcase,
  briefcase: Briefcase,
  business: Briefcase,
  freelance: Laptop,
  laptop: Laptop,
  consultanta: Laptop,
  investitii: TrendingUp,
  investments: TrendingUp,
  'trending-up': TrendingUp,
  dividende: TrendingUp,
  cadouri: Gift,
  'cadouri primite': Gift,
  gift: Gift,
  bonus: Gift,
  cash: Banknote,
  'cash-outline': Banknote,
  banknote: Banknote,

  // food
  mancare: UtensilsCrossed,
  food: UtensilsCrossed,
  restaurant: UtensilsCrossed,
  utensils: UtensilsCrossed,
  'utensils-crossed': UtensilsCrossed,
  cafenea: Coffee,
  cafenele: Coffee,
  cafe: Coffee,
  coffee: Coffee,

  // transport
  transport: Bus,
  bus: Bus,
  carburant: Fuel,
  benzina: Fuel,
  fuel: Fuel,
  zbor: Plane,
  zboruri: Plane,
  plane: Plane,
  flight: Plane,

  // housing
  locuinta: Home,
  rent: Home,
  chirie: Home,
  home: Home,
  utilitati: Zap,
  utilities: Zap,
  curent: Zap,
  zap: Zap,
  electricity: Zap,

  // entertainment / lifestyle
  divertisment: Film,
  entertainment: Film,
  film: Film,
  movies: Film,
  cinema: Film,
  muzica: Music,
  music: Music,
  abonament: Repeat,
  abonamente: Repeat,
  subscriptions: Repeat,
  repeat: Repeat,
  sport: Dumbbell,
  sala: Dumbbell,
  fitness: Dumbbell,
  dumbbell: Dumbbell,

  // health
  sanatate: HeartPulse,
  health: HeartPulse,
  medical: HeartPulse,
  farmacia: HeartPulse,
  farmacie: HeartPulse,
  'heart-pulse': HeartPulse,

  // shopping / goods
  cumparaturi: ShoppingBag,
  shopping: ShoppingBag,
  'shopping-bag': ShoppingBag,
  'shopping-cart': ShoppingCart,
  haine: ShoppingBag,
  vestimentar: ShoppingBag,
  emag: ShoppingBag,
  electronice: Smartphone,
  telefon: Smartphone,
  smartphone: Smartphone,

  // education
  educatie: GraduationCap,
  education: GraduationCap,
  carti: GraduationCap,
  'graduation-cap': GraduationCap,

  // misc
  servicii: Wrench,
  service: Wrench,
  reparatii: Wrench,
  wrench: Wrench,
  economii: PiggyBank,
  savings: PiggyBank,
  'piggy-bank': PiggyBank,
  card: CreditCard,
  'credit-card': CreditCard,
  portofel: Wallet,
  wallet: Wallet,
  animale: PawPrint,
  pets: PawPrint,
  copii: Baby,
  baby: Baby,
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .trim();
}

/**
 * Detects whether a string contains an actual emoji glyph. Lets us treat
 * "💼" as an emoji and "cash-outline" as a lookup key without false matches.
 */
function isEmoji(s: string): boolean {
  if (!s) return false;
  return /\p{Extended_Pictographic}/u.test(s);
}

interface CategoryIconProps {
  /** The stored icon string — can be an emoji, a known icon name, or empty */
  icon?: string | null;
  /** The category's display name — used as a fallback for inferring the icon */
  name?: string | null;
  /** Size in pixels for the rendered Lucide icon (default 16) */
  size?: number;
  /** Optional stroke colour override */
  color?: string;
}

/**
 * Renders a Lucide line icon when we can map the input to one, otherwise
 * shows the original emoji (so user-typed emojis still work) or a neutral
 * fallback Tag icon. Use this everywhere a category badge is drawn.
 */
export function CategoryIcon({ icon, name, size = 16, color }: CategoryIconProps) {
  // 1. If the icon field already contains a real emoji glyph, render it as-is
  if (icon && isEmoji(icon)) {
    return <span style={{ fontSize: size, lineHeight: 1 }}>{icon}</span>;
  }
  // 2. Try the icon string against our mapping
  if (icon) {
    const key = normalize(icon);
    const Mapped = ICON_MAP[key];
    if (Mapped) return <Mapped size={size} color={color} />;
  }
  // 3. Fall back to the category name
  if (name) {
    const key = normalize(name);
    const Mapped = ICON_MAP[key];
    if (Mapped) return <Mapped size={size} color={color} />;
    // partial match — pick the first key the name contains
    for (const k of Object.keys(ICON_MAP)) {
      if (k.length >= 4 && key.includes(k)) {
        const Partial = ICON_MAP[k]!;
        return <Partial size={size} color={color} />;
      }
    }
  }
  // 4. Generic fallback
  return <TagIcon size={size} color={color} />;
}

/** Ordered list of (label, icon name) pairs for the category create/edit picker. */
export const ICON_PICKER: Array<{ name: string; label: string }> = [
  { name: 'briefcase', label: 'Salariu' },
  { name: 'laptop', label: 'Freelance' },
  { name: 'trending-up', label: 'Investiții' },
  { name: 'gift', label: 'Cadouri' },
  { name: 'cash-outline', label: 'Cash' },
  { name: 'utensils-crossed', label: 'Mâncare' },
  { name: 'coffee', label: 'Cafenea' },
  { name: 'bus', label: 'Transport' },
  { name: 'fuel', label: 'Carburant' },
  { name: 'plane', label: 'Zboruri' },
  { name: 'home', label: 'Locuință' },
  { name: 'zap', label: 'Utilități' },
  { name: 'film', label: 'Divertisment' },
  { name: 'music', label: 'Muzică' },
  { name: 'repeat', label: 'Abonamente' },
  { name: 'dumbbell', label: 'Sport' },
  { name: 'heart-pulse', label: 'Sănătate' },
  { name: 'shopping-bag', label: 'Cumpărături' },
  { name: 'shopping-cart', label: 'Coș' },
  { name: 'smartphone', label: 'Electronice' },
  { name: 'graduation-cap', label: 'Educație' },
  { name: 'wrench', label: 'Servicii' },
  { name: 'piggy-bank', label: 'Economii' },
  { name: 'wallet', label: 'Portofel' },
  { name: 'credit-card', label: 'Card' },
  { name: 'paw-print', label: 'Animale' },
  { name: 'baby', label: 'Copii' },
];
