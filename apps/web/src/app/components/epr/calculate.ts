/**
 * Refashion EPR calculation engine.
 * Indicative rates — must be verified against the official 2025 Refashion table.
 */

export const REFASHION_BASE_RATES: Record<string, number> = {
  'Cotton (natural vegetable)': 80,
  'Linen / Hemp (natural vegetable)': 70,
  'Wool (natural animal)': 90,
  'Cashmere / Alpaca (natural animal)': 90,
  'Silk (natural animal)': 85,
  'Polyester (synthetic)': 110,
  'Nylon / Polyamide (synthetic)': 110,
  'Acrylic (synthetic)': 115,
  'Viscose / Modal / Lyocell (semi-synthetic)': 85,
  'Leather (animal)': 95,
  'Down / Feathers (natural animal)': 88,
  'Recycled cotton': 55,
  'Recycled polyester': 70,
  'Blended / Mixed fabrics': 100,
  Other: 100,
};

export const MATERIAL_CATEGORIES: Record<string, string> = {
  'Cotton (natural vegetable)': 'natural',
  'Linen / Hemp (natural vegetable)': 'natural',
  'Wool (natural animal)': 'natural',
  'Cashmere / Alpaca (natural animal)': 'natural',
  'Silk (natural animal)': 'natural',
  'Polyester (synthetic)': 'synthetic',
  'Nylon / Polyamide (synthetic)': 'synthetic',
  'Acrylic (synthetic)': 'synthetic',
  'Viscose / Modal / Lyocell (semi-synthetic)': 'semi-synthetic',
  'Leather (animal)': 'animal',
  'Down / Feathers (natural animal)': 'natural',
  'Recycled cotton': 'recycled',
  'Recycled polyester': 'recycled',
  'Blended / Mixed fabrics': 'blended',
  Other: 'other',
};

export interface ModulationDef {
  key: string;
  label: string;
  value: number;
}

export const BONUS_DEFS: ModulationDef[] = [
  { key: '2year_durability', label: 'Designed to last at least 2 years', value: -0.05 },
  { key: 'repairability_score', label: 'Carries a repairability score', value: -0.05 },
  { key: 'mono_material', label: 'Mono-material (single fibre type)', value: -0.10 },
  { key: 'certified_material', label: 'GOTS, GRS, or equivalent certification', value: -0.08 },
];

export const MALUS_DEFS: ModulationDef[] = [
  { key: 'hazardous_substances', label: 'Contains REACH-flagged hazardous substances', value: 0.15 },
  { key: 'no_takeback', label: 'No take-back / end-of-life programme', value: 0.05 },
];

export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
export type Quarter = (typeof QUARTERS)[number];

export const QUARTER_LABELS: Record<string, string> = {
  Q1: 'Q1 (Jan–Mar)',
  Q2: 'Q2 (Apr–Jun)',
  Q3: 'Q3 (Jul–Sep)',
  Q4: 'Q4 (Oct–Dec)',
};

export const YEARS = ['2024', '2025', '2026'];

export interface MaterialRow {
  material: string;
  weightKg: string;
}

export interface EprFormData {
  brandName: string;
  contact: string;
  quarter: string;
  year: string;
  countries: string[];
  materials: MaterialRow[];
  bonuses: string[];
  maluses: string[];
}

export const DEFAULT_DATA: EprFormData = {
  brandName: '',
  contact: '',
  quarter: 'Q1',
  year: '2026',
  countries: ['france'],
  materials: [
    { material: '', weightKg: '' },
    { material: '', weightKg: '' },
  ],
  bonuses: [],
  maluses: [],
};

export interface LineItem {
  material: string;
  weightKg: number;
  ratePerTonne: number;
  modulationFactor: number;
  baseFee: number;
  subtotal: number;
}

export interface CalculationResult {
  lineItems: LineItem[];
  totalWeight: number;
  totalBase: number;
  totalFee: number;
  modulationFactor: number;
}

export function calculateModulation(checkedBonuses: string[], checkedMaluses: string[]): number {
  const bonusMap = Object.fromEntries(BONUS_DEFS.map((b) => [b.key, b.value]));
  const malusMap = Object.fromEntries(MALUS_DEFS.map((m) => [m.key, m.value]));
  const totalBonus = checkedBonuses.reduce((s, k) => s + (bonusMap[k] || 0), 0);
  const totalMalus = checkedMaluses.reduce((s, k) => s + (malusMap[k] || 0), 0);
  return Math.max(-0.2, Math.min(0.3, totalBonus + totalMalus));
}

export function calculateRowFee(material: string, weightKg: number, modulationFactor: number): number {
  const ratePerTonne = REFASHION_BASE_RATES[material] || 100;
  const weightTonnes = weightKg / 1000;
  const baseFee = weightTonnes * ratePerTonne;
  const modulatedFee = baseFee * (1 + modulationFactor);
  return Math.round(modulatedFee * 100) / 100;
}

export function calculateTotal(rows: MaterialRow[], modulationFactor: number): CalculationResult {
  const lineItems: LineItem[] = rows
    .filter((r) => r.material && Number(r.weightKg) > 0)
    .map((r) => {
      const weightKg = Number(r.weightKg);
      const ratePerTonne = REFASHION_BASE_RATES[r.material] || 100;
      return {
        material: r.material,
        weightKg,
        ratePerTonne,
        modulationFactor,
        baseFee: Math.round((weightKg / 1000) * ratePerTonne * 100) / 100,
        subtotal: calculateRowFee(r.material, weightKg, modulationFactor),
      };
    });
  const totalWeight = lineItems.reduce((s, r) => s + r.weightKg, 0);
  const totalBase = lineItems.reduce((s, r) => s + r.baseFee, 0);
  const totalFee = lineItems.reduce((s, r) => s + r.subtotal, 0);
  return { lineItems, totalWeight, totalBase, totalFee, modulationFactor };
}

export function nextQuarter(q: string, y: string): { quarter: string; year: string } {
  const idx = QUARTERS.indexOf(q as Quarter);
  if (idx === 3) return { quarter: 'Q1', year: String(Number(y) + 1) };
  return { quarter: QUARTERS[idx + 1], year: y };
}

export function fmtEUR(n: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);
}

export function fmtKg(n: number): string {
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(n || 0);
}

export function fmtPct(n: number): string {
  if (!n) return '—';
  const sign = n > 0 ? '+' : '−';
  return `${sign}${Math.abs(Math.round(n * 100))}%`;
}

/** Material-category CSS colour mapping (Tailwind classes for the dot) */
export function materialDotClass(material: string): string {
  const cat = MATERIAL_CATEGORIES[material] || 'other';
  const map: Record<string, string> = {
    natural: 'bg-green-600',
    synthetic: 'bg-indigo-600',
    'semi-synthetic': 'bg-indigo-400',
    recycled: 'bg-teal-600',
    blended: 'bg-slate-500',
    animal: 'bg-amber-700',
    other: 'bg-slate-400',
  };
  return map[cat] || 'bg-slate-400';
}
