/**
 * Refashion EPR 2026 calculation engine.
 *
 * Based on the official Refashion 2026 Detailed & Simplified Declaration Scales.
 * Fees are PER ITEM, by product line and section (age/gender).
 * Declaration is ANNUAL (products placed on market in the previous year).
 *
 * Source: Refashion Eco-fee Guide, January 2026
 */

// ─── Product line rates (€/item) ─────────────────────────────────────────────

export interface ProductLine {
  code: string;       // Refashion reference code, e.g. "V-11-F-EM0"
  name: string;       // Product line name
  section: string;    // Target section (Baby, Children, Women, Men, Unisex)
  category: 'clothing' | 'household_linen' | 'footwear';
  rate: number;       // 2026 standard scale (€/item), incl. repair/reuse funds
}

export const PRODUCT_LINES: ProductLine[] = [
  // ── 1. CLOTHING ──────────────────────────────────────────────────────────
  // Specific items
  { code: 'V-00-N-EM0', name: 'Fabric sold by the meter (clothing)', section: 'Unisex', category: 'clothing', rate: 0.0626 },
  { code: 'V-01-N-EM0', name: 'High visibility safety vests', section: 'Unisex', category: 'clothing', rate: 0.0239 },
  { code: 'V-02-N-EM0', name: 'Dressing-up sets and fancy dress', section: 'Unisex', category: 'clothing', rate: 0.0481 },
  { code: 'V-03-N-EM0', name: 'Light work clothes', section: 'Unisex', category: 'clothing', rate: 0.0360 },
  { code: 'V-04-N-EM0', name: 'Other work clothes', section: 'Unisex', category: 'clothing', rate: 0.1545 },
  // Baby (0-36 months)
  { code: 'V-05-B-EM0', name: 'Baby footwear, underwear & small accessories', section: 'Baby (0-36 months)', category: 'clothing', rate: 0.0214 },
  { code: 'V-06-B-EM0', name: 'Baby clothes (small items)', section: 'Baby (0-36 months)', category: 'clothing', rate: 0.0239 },
  { code: 'V-07-B-EM0', name: 'Other baby clothes', section: 'Baby (0-36 months)', category: 'clothing', rate: 0.0505 },
  // Underwear
  { code: 'V-08-E-EM0', name: 'Underwear (all types)', section: 'Children (4-14 yrs)', category: 'clothing', rate: 0.0202 },
  { code: 'V-08-F-EM0', name: 'Underwear / Stockings', section: 'Women', category: 'clothing', rate: 0.0190 },
  { code: 'V-08-H-EM0', name: 'Underwear / Stockings', section: 'Men', category: 'clothing', rate: 0.0347 },
  { code: 'V-09-F-EM0', name: 'Lingerie and accessories', section: 'Women', category: 'clothing', rate: 0.0202 },
  // Footwear (clothing category)
  { code: 'V-10-N-EM0', name: 'Footwear (excl. baby)', section: 'Unisex', category: 'clothing', rate: 0.0214 },
  // T-shirts
  { code: 'V-11-E-EM0', name: 'T-shirt type tops', section: 'Children (4-14 yrs)', category: 'clothing', rate: 0.0214 },
  { code: 'V-11-F-EM0', name: 'T-shirt type tops', section: 'Women', category: 'clothing', rate: 0.0323 },
  { code: 'V-11-H-EM0', name: 'T-shirt type tops', section: 'Men', category: 'clothing', rate: 0.0396 },
  // Shirts
  { code: 'V-12-E-EM0', name: 'Shirt-type tops', section: 'Children (4-14 yrs)', category: 'clothing', rate: 0.0251 },
  { code: 'V-12-F-EM0', name: 'Shirt-type tops', section: 'Women', category: 'clothing', rate: 0.0323 },
  { code: 'V-12-H-EM0', name: 'Shirt-type tops', section: 'Men', category: 'clothing', rate: 0.0481 },
  // Pullovers/Jumpers
  { code: 'V-13-E-EM0', name: 'Pullover / jumper type tops', section: 'Children (4-14 yrs)', category: 'clothing', rate: 0.0481 },
  { code: 'V-13-F-EM0', name: 'Pullover / jumper type tops', section: 'Women', category: 'clothing', rate: 0.0614 },
  { code: 'V-13-H-EM0', name: 'Pullover / jumper type tops', section: 'Men', category: 'clothing', rate: 0.0844 },
  // Skirts
  { code: 'V-14-E-EM0', name: 'Skirts', section: 'Children (4-14 yrs)', category: 'clothing', rate: 0.0287 },
  { code: 'V-14-F-EM0', name: 'Skirts', section: 'Women', category: 'clothing', rate: 0.0481 },
  // Dresses
  { code: 'V-15-E-EM0', name: 'Dresses', section: 'Children (4-14 yrs)', category: 'clothing', rate: 0.0335 },
  { code: 'V-15-F-EM0', name: 'Dresses', section: 'Women', category: 'clothing', rate: 0.0565 },
  // Denim trousers
  { code: 'V-16-E-EM0', name: 'Denim trousers', section: 'Children (4-14 yrs)', category: 'clothing', rate: 0.0614 },
  { code: 'V-16-F-EM0', name: 'Denim trousers', section: 'Women', category: 'clothing', rate: 0.0831 },
  { code: 'V-16-H-EM0', name: 'Denim trousers', section: 'Men', category: 'clothing', rate: 0.1098 },
  // Everyday trousers
  { code: 'V-17-E-EM0', name: 'Everyday trousers (excl. denim)', section: 'Children (4-14 yrs)', category: 'clothing', rate: 0.0481 },
  { code: 'V-17-F-EM0', name: 'Everyday trousers (excl. denim)', section: 'Women', category: 'clothing', rate: 0.0662 },
  { code: 'V-17-H-EM0', name: 'Everyday trousers (excl. denim)', section: 'Men', category: 'clothing', rate: 0.0844 },
  // Sport trousers
  { code: 'V-18-E-EM0', name: 'Sport trousers and sportswear', section: 'Children (4-14 yrs)', category: 'clothing', rate: 0.0372 },
  { code: 'V-18-F-EM0', name: 'Sport trousers and sportswear', section: 'Women', category: 'clothing', rate: 0.0529 },
  { code: 'V-18-H-EM0', name: 'Sport trousers and sportswear', section: 'Men', category: 'clothing', rate: 0.0723 },
  // Shorts
  { code: 'V-19-E-EM0', name: 'Shorts / bermuda shorts', section: 'Children (4-14 yrs)', category: 'clothing', rate: 0.0311 },
  { code: 'V-19-F-EM0', name: 'Shorts / bermuda shorts', section: 'Women', category: 'clothing', rate: 0.0444 },
  { code: 'V-19-H-EM0', name: 'Shorts / bermuda shorts', section: 'Men', category: 'clothing', rate: 0.0481 },
  // Overalls
  { code: 'V-20-E-EM0', name: 'Overalls / dungarees', section: 'Children (4-14 yrs)', category: 'clothing', rate: 0.0384 },
  { code: 'V-20-F-EM0', name: 'Overalls / dungarees', section: 'Women', category: 'clothing', rate: 0.0650 },
  { code: 'V-20-H-EM0', name: 'Overalls / dungarees', section: 'Men', category: 'clothing', rate: 0.1654 },
  // Suits
  { code: 'V-21-E-EM0', name: 'Suits (2-3 piece)', section: 'Children (4-14 yrs)', category: 'clothing', rate: 0.1170 },
  { code: 'V-21-F-EM0', name: 'Suits (2-3 piece)', section: 'Women', category: 'clothing', rate: 0.1497 },
  { code: 'V-21-H-EM0', name: 'Suits (2-3 piece)', section: 'Men', category: 'clothing', rate: 0.1933 },
  // Sportswear sets
  { code: 'V-22-E-EM0', name: '2-piece sportswear sets', section: 'Children (4-14 yrs)', category: 'clothing', rate: 0.0795 },
  { code: 'V-22-F-EM0', name: '2-piece sportswear sets', section: 'Women', category: 'clothing', rate: 0.1086 },
  { code: 'V-22-H-EM0', name: '2-piece sportswear sets', section: 'Men', category: 'clothing', rate: 0.1521 },
  // Jackets
  { code: 'V-23-E-EM0', name: 'Jackets and light jackets', section: 'Children (4-14 yrs)', category: 'clothing', rate: 0.0747 },
  { code: 'V-23-F-EM0', name: 'Jackets and light jackets', section: 'Women', category: 'clothing', rate: 0.0880 },
  { code: 'V-23-H-EM0', name: 'Jackets and light jackets', section: 'Men', category: 'clothing', rate: 0.1146 },
  // Waterproof
  { code: 'V-24-E-EM0', name: 'Waterproof clothing', section: 'Children (4-14 yrs)', category: 'clothing', rate: 0.0408 },
  { code: 'V-24-F-EM0', name: 'Waterproof clothing', section: 'Women', category: 'clothing', rate: 0.0807 },
  { code: 'V-24-H-EM0', name: 'Waterproof clothing', section: 'Men', category: 'clothing', rate: 0.0505 },
  // Coats
  { code: 'V-25-E-EM0', name: 'Coats', section: 'Children (4-14 yrs)', category: 'clothing', rate: 0.1267 },
  { code: 'V-25-F-EM0', name: 'Coats', section: 'Women', category: 'clothing', rate: 0.1582 },
  { code: 'V-25-H-EM0', name: 'Coats', section: 'Men', category: 'clothing', rate: 0.1666 },
  // Padded clothing
  { code: 'V-26-E-EM0', name: 'Padded clothing (multilayer)', section: 'Children (4-14 yrs)', category: 'clothing', rate: 0.0928 },
  { code: 'V-26-F-EM0', name: 'Padded clothing (multilayer)', section: 'Women', category: 'clothing', rate: 0.1582 },
  { code: 'V-26-H-EM0', name: 'Padded clothing (multilayer)', section: 'Men', category: 'clothing', rate: 0.1739 },
  // Pyjamas
  { code: 'V-27-E-EM0', name: 'Pyjamas / homewear / loungewear', section: 'Children (4-14 yrs)', category: 'clothing', rate: 0.0408 },
  { code: 'V-27-F-EM0', name: 'Pyjamas / homewear / loungewear', section: 'Women', category: 'clothing', rate: 0.0456 },
  { code: 'V-27-H-EM0', name: 'Pyjamas / homewear / loungewear', section: 'Men', category: 'clothing', rate: 0.0614 },
  // Pyjama sets
  { code: 'V-28-E-EM0', name: 'Pyjama / homewear sets', section: 'Children (4-14 yrs)', category: 'clothing', rate: 0.0589 },
  { code: 'V-28-F-EM0', name: 'Pyjama / homewear sets', section: 'Women', category: 'clothing', rate: 0.0819 },
  { code: 'V-28-H-EM0', name: 'Pyjama / homewear sets', section: 'Men', category: 'clothing', rate: 0.0892 },
  // Accessories
  { code: 'V-29-N-EM0', name: 'Small accessories (ties etc.)', section: 'Unisex', category: 'clothing', rate: 0.0202 },
  { code: 'V-30-N-EM0', name: 'Hats and headwear', section: 'Unisex', category: 'clothing', rate: 0.0190 },
  { code: 'V-31-N-EM0', name: 'Gloves / mittens', section: 'Unisex', category: 'clothing', rate: 0.0190 },
  { code: 'V-32-N-EM0', name: 'Medium accessories (shawls etc.)', section: 'Unisex', category: 'clothing', rate: 0.0335 },
  // Swimwear
  { code: 'V-33-E-EM0', name: 'Swimwear', section: 'Children (4-14 yrs)', category: 'clothing', rate: 0.0202 },
  { code: 'V-33-F-EM0', name: 'Swimwear', section: 'Women', category: 'clothing', rate: 0.0263 },
  { code: 'V-33-H-EM0', name: 'Swimwear', section: 'Men', category: 'clothing', rate: 0.0311 },

  // ── 2. HOUSEHOLD LINEN ───────────────────────────────────────────────────
  { code: 'L-00-N-EM0', name: 'Fabric by the meter (linen)', section: 'Unisex', category: 'household_linen', rate: 0.1037 },
  { code: 'L-01-N-EM0', name: 'Various household linen', section: 'Unisex', category: 'household_linen', rate: 0.0626 },
  { code: 'L-02-N-EM0', name: 'Flannels / bath linen', section: 'Unisex', category: 'household_linen', rate: 0.0311 },
  { code: 'L-03-N-EM0', name: 'Bath linen and mats', section: 'Unisex', category: 'household_linen', rate: 0.0904 },
  { code: 'L-04-N-EM0', name: 'Towels', section: 'Unisex', category: 'household_linen', rate: 0.0565 },
  { code: 'L-05-N-EM0', name: 'Pillow/bolster cases', section: 'Unisex', category: 'household_linen', rate: 0.0481 },
  { code: 'L-06-N-EM0', name: 'Sheets', section: 'Unisex', category: 'household_linen', rate: 0.1122 },
  { code: 'L-07-N-EM0', name: 'Continental quilt covers', section: 'Unisex', category: 'household_linen', rate: 0.2017 },
  { code: 'L-08-N-EM0', name: 'Bed linen sets', section: 'Unisex', category: 'household_linen', rate: 0.1642 },
  { code: 'L-09-N-EM0', name: 'Protective covers', section: 'Unisex', category: 'household_linen', rate: 0.1122 },
  { code: 'L-10-N-EM0', name: 'Blankets', section: 'Unisex', category: 'household_linen', rate: 0.2175 },
  { code: 'L-11-N-EM0', name: 'Tablecloths', section: 'Unisex', category: 'household_linen', rate: 0.0868 },
  { code: 'L-12-N-EM0', name: 'Table linen', section: 'Unisex', category: 'household_linen', rate: 0.0384 },
  { code: 'L-13-B-EM0', name: 'Baby bath linen (0-3 yrs)', section: 'Baby (0-36 months)', category: 'household_linen', rate: 0.1037 },
  { code: 'L-14-B-EM0', name: 'Baby bedlinen for cots (0-3 yrs)', section: 'Baby (0-36 months)', category: 'household_linen', rate: 0.1037 },

  // ── 3. FOOTWEAR ──────────────────────────────────────────────────────────
  { code: 'C-01-E-EM0', name: 'Flat footwear', section: 'Children (sizes 27-36)', category: 'footwear', rate: 0.0626 },
  { code: 'C-01-F-EM0', name: 'Flat footwear', section: 'Women (sizes 37+)', category: 'footwear', rate: 0.1086 },
  { code: 'C-01-H-EM0', name: 'Flat footwear', section: 'Men (sizes 37+)', category: 'footwear', rate: 0.1570 },
  { code: 'C-02-E-EM0', name: 'Booties', section: 'Children (sizes 27-36)', category: 'footwear', rate: 0.1073 },
  { code: 'C-02-F-EM0', name: 'Booties', section: 'Women (sizes 37+)', category: 'footwear', rate: 0.1473 },
  { code: 'C-02-H-EM0', name: 'Booties', section: 'Men (sizes 37+)', category: 'footwear', rate: 0.1787 },
  { code: 'C-03-E-EM0', name: 'Boots', section: 'Children (sizes 27-36)', category: 'footwear', rate: 0.1182 },
  { code: 'C-03-F-EM0', name: 'Boots', section: 'Women (sizes 37+)', category: 'footwear', rate: 0.1908 },
  { code: 'C-03-H-EM0', name: 'Boots', section: 'Men (sizes 37+)', category: 'footwear', rate: 0.2138 },
  { code: 'C-04-E-EM0', name: 'Trainers', section: 'Children (sizes 27-36)', category: 'footwear', rate: 0.0880 },
  { code: 'C-04-F-EM0', name: 'Trainers', section: 'Women (sizes 37+)', category: 'footwear', rate: 0.1134 },
  { code: 'C-04-H-EM0', name: 'Trainers', section: 'Men (sizes 37+)', category: 'footwear', rate: 0.1243 },
  { code: 'C-06-B-EM0', name: 'Baby footwear (0-3 yrs)', section: 'Baby (sizes 19-26)', category: 'footwear', rate: 0.0456 },
  { code: 'C-07-E-EM0', name: 'Summer footwear', section: 'Children (sizes 27-36)', category: 'footwear', rate: 0.0626 },
  { code: 'C-07-F-EM0', name: 'Summer footwear', section: 'Women (sizes 37+)', category: 'footwear', rate: 0.0892 },
  { code: 'C-07-H-EM0', name: 'Summer footwear', section: 'Men (sizes 37+)', category: 'footwear', rate: 0.0880 },
  { code: 'C-08-N-EM0', name: 'Indoor footwear', section: 'Unisex', category: 'footwear', rate: 0.0553 },
];

/** Simplified declaration rates for <5,000 items/year (no eco-modulation) */
export const SIMPLIFIED_RATES = {
  clothing: 0.5799,
  household_linen: 0.6525,
  footwear: 0.6414,
} as const;

/** Flat administrative fee per Refashion */
export const ADMIN_FEE = 30;

// ─── Eco-modulation ──────────────────────────────────────────────────────────

export interface ModulationDef {
  key: string;
  label: string;
  description: string;
  type: 'bonus' | 'malus';
}

/** Official 2026 eco-modulation criteria (since Jan 1st, 2025) */
export const BONUS_DEFS: ModulationDef[] = [
  {
    key: 'durability',
    label: 'Durability',
    description: 'Product is designed to last — meets Refashion durability criteria',
    type: 'bonus',
  },
  {
    key: 'environmental_label',
    label: 'Environmental label certification',
    description: 'Certified with GOTS, Oeko-Tex Made in Green, EU Ecolabel, or equivalent',
    type: 'bonus',
  },
  {
    key: 'recycled_materials',
    label: 'Recycled raw materials',
    description: 'Product incorporates recycled raw materials meeting Refashion thresholds',
    type: 'bonus',
  },
];

export const MALUS_DEFS: ModulationDef[] = [
  {
    key: 'metalloplastic_fibers',
    label: 'Metalloplastic fibers',
    description: 'Contains metalloplastic fibers that hinder recyclability',
    type: 'malus',
  },
  {
    key: 'electronic_components',
    label: 'Electrical / electronic components',
    description: 'Contains electrical or electronic components that hinder recyclability',
    type: 'malus',
  },
];

// ─── Form data types ─────────────────────────────────────────────────────────

export type DeclarationType = 'detailed' | 'simplified';

export interface ProductRow {
  productLineCode: string; // Refashion code, e.g. "V-11-F-EM0"
  quantity: string;        // number of items as string (form input)
}

export interface SimplifiedRow {
  category: 'clothing' | 'household_linen' | 'footwear';
  quantity: string;
}

export interface EprFormData {
  brandName: string;
  contact: string;
  declarationYear: string;   // year of products placed on market (e.g. "2025")
  countries: string[];
  declarationType: DeclarationType;
  // Detailed declaration
  products: ProductRow[];
  bonuses: string[];
  maluses: string[];
  // Simplified declaration
  simplifiedRows: SimplifiedRow[];
}

export const DECLARATION_YEARS = ['2024', '2025', '2026'];

export const DEFAULT_DATA: EprFormData = {
  brandName: '',
  contact: '',
  declarationYear: '2025',
  countries: ['france'],
  declarationType: 'detailed',
  products: [
    { productLineCode: '', quantity: '' },
    { productLineCode: '', quantity: '' },
    { productLineCode: '', quantity: '' },
  ],
  bonuses: [],
  maluses: [],
  simplifiedRows: [
    { category: 'clothing', quantity: '' },
  ],
};

// ─── Calculation ─────────────────────────────────────────────────────────────

export interface DetailedLineItem {
  code: string;
  productName: string;
  section: string;
  category: string;
  quantity: number;
  ratePerItem: number;
  subtotal: number;
}

export interface SimplifiedLineItem {
  category: 'clothing' | 'household_linen' | 'footwear';
  categoryLabel: string;
  quantity: number;
  ratePerItem: number;
  subtotal: number;
}

export interface CalculationResult {
  type: DeclarationType;
  detailedItems: DetailedLineItem[];
  simplifiedItems: SimplifiedLineItem[];
  totalItems: number;
  subtotalFees: number;
  adminFee: number;
  totalFee: number;
  bonusesApplied: string[];
  malusesApplied: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  clothing: 'Clothing',
  household_linen: 'Household Linen',
  footwear: 'Footwear',
};

/** Build a lookup map from code → ProductLine */
const productLineMap = new Map(PRODUCT_LINES.map((pl) => [pl.code, pl]));

export function getProductLine(code: string): ProductLine | undefined {
  return productLineMap.get(code);
}

export function calculateTotal(data: EprFormData): CalculationResult {
  if (data.declarationType === 'simplified') {
    return calculateSimplified(data);
  }
  return calculateDetailed(data);
}

function calculateDetailed(data: EprFormData): CalculationResult {
  const detailedItems: DetailedLineItem[] = data.products
    .filter((r) => r.productLineCode && Number(r.quantity) > 0)
    .map((r) => {
      const pl = productLineMap.get(r.productLineCode);
      const qty = Number(r.quantity);
      const rate = pl?.rate ?? 0;
      return {
        code: r.productLineCode,
        productName: pl?.name ?? 'Unknown',
        section: pl?.section ?? '',
        category: pl?.category ?? '',
        quantity: qty,
        ratePerItem: rate,
        subtotal: Math.round(qty * rate * 10000) / 10000, // keep 4 decimal precision
      };
    });

  const totalItems = detailedItems.reduce((s, r) => s + r.quantity, 0);
  const subtotalFees = Math.round(detailedItems.reduce((s, r) => s + r.subtotal, 0) * 100) / 100;
  const totalFee = Math.round((subtotalFees + ADMIN_FEE) * 100) / 100;

  return {
    type: 'detailed',
    detailedItems,
    simplifiedItems: [],
    totalItems,
    subtotalFees,
    adminFee: ADMIN_FEE,
    totalFee,
    bonusesApplied: data.bonuses,
    malusesApplied: data.maluses,
  };
}

function calculateSimplified(data: EprFormData): CalculationResult {
  const simplifiedItems: SimplifiedLineItem[] = data.simplifiedRows
    .filter((r) => Number(r.quantity) > 0)
    .map((r) => {
      const qty = Number(r.quantity);
      const rate = SIMPLIFIED_RATES[r.category];
      return {
        category: r.category,
        categoryLabel: CATEGORY_LABELS[r.category] ?? r.category,
        quantity: qty,
        ratePerItem: rate,
        subtotal: Math.round(qty * rate * 100) / 100,
      };
    });

  const totalItems = simplifiedItems.reduce((s, r) => s + r.quantity, 0);
  const subtotalFees = Math.round(simplifiedItems.reduce((s, r) => s + r.subtotal, 0) * 100) / 100;
  const totalFee = Math.round((subtotalFees + ADMIN_FEE) * 100) / 100;

  return {
    type: 'simplified',
    detailedItems: [],
    simplifiedItems,
    totalItems,
    subtotalFees,
    adminFee: ADMIN_FEE,
    totalFee,
    bonusesApplied: [],
    malusesApplied: [],
  };
}

// ─── Unique product line names (for search/filter) ───────────────────────────

export function getProductLinesByCategory(category: 'clothing' | 'household_linen' | 'footwear'): ProductLine[] {
  return PRODUCT_LINES.filter((pl) => pl.category === category);
}

/** Group product lines by name (e.g., "T-shirt type tops" → [Children, Women, Men]) */
export function getGroupedProductLines(): Map<string, Map<string, ProductLine[]>> {
  const groups = new Map<string, Map<string, ProductLine[]>>();
  for (const cat of ['clothing', 'household_linen', 'footwear'] as const) {
    const catLines = new Map<string, ProductLine[]>();
    for (const pl of PRODUCT_LINES.filter((p) => p.category === cat)) {
      const existing = catLines.get(pl.name) ?? [];
      existing.push(pl);
      catLines.set(pl.name, existing);
    }
    groups.set(cat, catLines);
  }
  return groups;
}

// ─── Formatting helpers ──────────────────────────────────────────────────────

export function fmtEUR(n: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);
}

export function fmtItems(n: number): string {
  return new Intl.NumberFormat('en-GB').format(n || 0);
}

export function fmtRate(n: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(n || 0);
}

/** Category colour dot CSS class */
export function categoryDotClass(category: string): string {
  const map: Record<string, string> = {
    clothing: 'bg-indigo-600',
    household_linen: 'bg-teal-600',
    footwear: 'bg-amber-600',
  };
  return map[category] || 'bg-slate-400';
}
