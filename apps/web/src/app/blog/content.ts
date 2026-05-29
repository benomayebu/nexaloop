/**
 * Blog post data for N.E.X.A Loop resources section.
 *
 * Posts contain factual, educational content about EU textile EPR compliance.
 * All regulatory details are based on official Refashion and EU sources.
 */

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;       // ISO date string
  updatedAt?: string;
  author: string;
  category: 'epr' | 'dpp' | 'compliance' | 'guides';
  readingTime: string;
  tags: string[];
  coverImageAlt?: string;
  sections: BlogSection[];
}

export interface BlogSection {
  heading?: string;
  paragraphs: string[];
  callout?: { type: 'info' | 'warning' | 'tip'; text: string };
  list?: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  epr: 'EPR Compliance',
  dpp: 'Digital Product Passport',
  compliance: 'EU Regulation',
  guides: 'Guides',
};

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export const POSTS: BlogPost[] = [
  // ── POST 1 ─────────────────────────────────────────────────
  {
    slug: 'how-refashion-epr-fees-work-2026',
    title: 'How Refashion EPR Fees Work in 2026',
    description:
      'A clear breakdown of how the French Refashion EPR system calculates eco-contribution fees for textile, clothing, and footwear brands in 2026.',
    publishedAt: '2026-05-28',
    author: 'N.E.X.A Loop Team',
    category: 'epr',
    readingTime: '7 min read',
    tags: ['Refashion', 'EPR', 'France', 'eco-fees', '2026'],
    sections: [
      {
        paragraphs: [
          'If you sell clothing, household linen, or footwear in France, you are subject to the Extended Producer Responsibility (EPR) obligation managed by Refashion (formerly Eco-TLC). This means you must register with Refashion and pay an annual eco-contribution fee based on the products you place on the French market.',
          'The system changed significantly in January 2025 with the introduction of eco-modulation criteria. The 2026 fee scales build on this framework. Here is how the fees are actually calculated.',
        ],
      },
      {
        heading: 'Per-item fees, not per-tonne',
        paragraphs: [
          'A common misconception is that Refashion fees are calculated by weight. They are not. Fees are calculated per item placed on the market, with each product line having its own rate.',
          'The Refashion scale includes over 80 distinct product lines across three categories: clothing, household linen, and footwear. Each line is further divided by target section (Baby, Children, Women, Men, Unisex), and each combination has a specific rate in euros per item.',
        ],
        callout: {
          type: 'info',
          text: 'Example: A women\'s T-shirt type top (code V-11-F-EM0) has a 2026 rate of €0.0323 per item. If you place 10,000 units on the market, the fee for that line alone would be €323.00.',
        },
      },
      {
        heading: 'The three product categories',
        paragraphs: [
          'Refashion organises all products into three main categories, each with its own product lines and rate structures.',
        ],
        list: [
          'Clothing — The largest category, covering everything from underwear and T-shirts to coats and suits. Includes sections for Baby (0-36 months), Children (4-14 years), Women, Men, and Unisex items. Also covers fabric sold by the meter, work clothes, swimwear, and accessories.',
          'Household Linen — Covers towels, sheets, pillowcases, duvet covers, blankets, tablecloths, bath mats, and baby bedlinen. Generally has higher per-item rates due to larger fabric volumes.',
          'Footwear — Separate from the clothing category. Includes flat footwear, booties, boots, trainers, summer footwear, indoor footwear, and baby shoes. Divided by size range rather than age.',
        ],
      },
      {
        heading: 'Detailed vs. simplified declaration',
        paragraphs: [
          'Refashion offers two declaration modes. The detailed declaration requires you to specify exactly which product lines you are placing on the market and how many of each. This mode is required if you want to benefit from eco-modulation bonuses.',
          'The simplified declaration uses flat rates per category and is available only for brands placing fewer than 5,000 items per year. The 2026 simplified rates are: Clothing at €0.5799 per item, Household Linen at €0.6525 per item, and Footwear at €0.6414 per item. No eco-modulation bonuses or maluses apply under the simplified mode.',
        ],
      },
      {
        heading: 'Eco-modulation: bonuses and maluses',
        paragraphs: [
          'Since January 1st, 2025, Refashion applies eco-modulation adjustments to detailed declarations. These either reduce (bonus) or increase (malus) your contribution based on the environmental characteristics of your products.',
        ],
        list: [
          'Durability bonus — Products designed to last, meeting Refashion\'s durability criteria.',
          'Environmental label certification — Products certified with GOTS, Oeko-Tex Made in Green, EU Ecolabel, or equivalent recognised labels.',
          'Recycled raw materials — Products incorporating recycled materials above Refashion thresholds.',
          'Metalloplastic fibers malus — Products containing metalloplastic fibers that hinder recyclability.',
          'Electrical/electronic components malus — Products with electrical or electronic elements that complicate end-of-life processing.',
        ],
        callout: {
          type: 'tip',
          text: 'To benefit from eco-modulation bonuses, you must use the detailed declaration mode and provide supporting documentation to Refashion during your annual declaration.',
        },
      },
      {
        heading: 'Key dates and administrative fees',
        paragraphs: [
          'The Refashion declaration is annual. You declare the products placed on the French market in the previous calendar year. The declaration window opens on January 14 and closes on February 28. Payment is due by March 31.',
          'Refashion charges a flat €30 administrative fee on every declaration, regardless of the number of items or total contribution amount. Non-compliance can result in fines of up to €30,000.',
        ],
      },
      {
        heading: 'What this means for your brand',
        paragraphs: [
          'Understanding how Refashion calculates fees is the first step to managing your EPR obligations efficiently. By choosing the right declaration mode, accurately categorising your products, and pursuing eco-modulation bonuses where eligible, you can ensure compliance while optimising your contribution.',
          'Tools like the N.E.X.A Loop EPR Calculator can help you estimate your fees before the declaration window opens, so there are no surprises when it comes time to file.',
        ],
      },
    ],
  },

  // ── POST 2 ─────────────────────────────────────────────────
  {
    slug: 'complete-guide-2026-refashion-declaration',
    title: 'Complete Guide to the 2026 Refashion Declaration',
    description:
      'Step-by-step guide to preparing and submitting your annual Refashion EPR declaration for products placed on the French market in 2025.',
    publishedAt: '2026-05-28',
    author: 'N.E.X.A Loop Team',
    category: 'guides',
    readingTime: '9 min read',
    tags: ['Refashion', 'declaration', 'guide', '2026', 'compliance'],
    sections: [
      {
        paragraphs: [
          'Every brand that places clothing, household linen, or footwear on the French market is legally required to submit an annual declaration to Refashion and pay the corresponding eco-contribution. The 2026 declaration covers products placed on the market during the 2025 calendar year.',
          'This guide walks through the entire process, from registration to payment, so you know exactly what to expect.',
        ],
      },
      {
        heading: 'Step 1: Register with Refashion',
        paragraphs: [
          'Before you can declare, you must be registered with Refashion as a contributor. Registration is done through the Refashion extranet portal. You will need your company details (SIRET number for French entities, or equivalent registration for foreign companies), the name of the person responsible for the declaration, and details about the types of products you place on the market.',
          'If you are a non-French brand selling into France through e-commerce or distribution, you still need to register. The EPR obligation applies to the entity that first places the product on the French market.',
        ],
        callout: {
          type: 'warning',
          text: 'Registration must be completed before the declaration window opens. If you are not yet registered and sell textiles in France, act now to avoid penalties.',
        },
      },
      {
        heading: 'Step 2: Gather your product data',
        paragraphs: [
          'The most time-consuming part of the declaration is preparing your product data. You need to know exactly how many items of each product line you placed on the French market during the declaration year.',
          'For the detailed declaration, this means mapping each SKU or product in your catalog to a Refashion product line code. There are over 80 product lines, organised by category (clothing, household linen, footwear) and section (Baby, Children, Women, Men, Unisex).',
        ],
        list: [
          'Audit your product catalog against the Refashion product line list.',
          'Count the total units placed on the French market per product line for the calendar year.',
          'Identify products eligible for eco-modulation bonuses (durability, environmental labels, recycled materials).',
          'Flag any products with malus criteria (metalloplastic fibers, electronic components).',
          'If using the simplified declaration (under 5,000 items/year), simply tally totals per category.',
        ],
      },
      {
        heading: 'Step 3: Choose your declaration mode',
        paragraphs: [
          'If you place 5,000 or more items per year on the French market, you must use the detailed declaration. This requires specifying quantities per product line but also qualifies you for eco-modulation bonuses.',
          'If you place fewer than 5,000 items per year, you can opt for the simplified declaration at flat rates per category. This is simpler to prepare but does not allow eco-modulation adjustments.',
        ],
      },
      {
        heading: 'Step 4: Submit during the declaration window',
        paragraphs: [
          'The declaration window for the 2026 cycle opens on January 14 and closes on February 28. Submit your declaration through the Refashion extranet portal.',
          'You will enter your product quantities (either by product line or by category, depending on your declaration mode), select any applicable eco-modulation criteria, and review the calculated contribution before confirming.',
        ],
        callout: {
          type: 'info',
          text: 'Pro tip: Use the N.E.X.A Loop EPR Calculator to estimate your fees before the window opens. This helps with budgeting and avoids surprises during the actual declaration.',
        },
      },
      {
        heading: 'Step 5: Pay by March 31',
        paragraphs: [
          'Once your declaration is confirmed, Refashion will issue an invoice for the total eco-contribution amount plus the €30 administrative fee. Payment is due by March 31.',
          'Payment methods and terms are specified on the Refashion portal. Late payments may incur additional fees.',
        ],
      },
      {
        heading: 'Common mistakes to avoid',
        paragraphs: [
          'Based on common issues reported by brands going through the declaration process, here are pitfalls to watch for.',
        ],
        list: [
          'Miscategorising products — A dress categorised as a T-shirt will have the wrong rate applied. Take time to map accurately.',
          'Forgetting e-commerce sales — If your brand ships directly to French consumers from outside France, those units count.',
          'Missing the deadline — The February 28 cutoff is firm. Late declarations can trigger the €30,000 non-compliance fine.',
          'Not claiming eco-modulation bonuses — If you qualify for durability or recycled material bonuses, using the detailed declaration saves money.',
          'Counting returns incorrectly — Only count items that were placed on the market (i.e., sold or made available), not items returned by customers.',
        ],
      },
      {
        heading: 'Planning ahead',
        paragraphs: [
          'The best time to start preparing for your declaration is well before January. Build the product line mapping into your product catalog management process. Track units placed on the French market throughout the year, rather than scrambling to compile data in January.',
          'Supply chain compliance platforms like N.E.X.A Loop are designed to help brands maintain this data year-round, so the annual declaration becomes a confirmation rather than a research project.',
        ],
      },
    ],
  },

  // ── POST 3 ─────────────────────────────────────────────────
  {
    slug: 'epr-vs-dpp-what-fashion-brands-need-to-know',
    title: 'EPR vs DPP: What Fashion Brands Need to Know',
    description:
      'Understanding the difference between Extended Producer Responsibility (EPR) and Digital Product Passports (DPP), and how they work together under EU regulation.',
    publishedAt: '2026-05-28',
    author: 'N.E.X.A Loop Team',
    category: 'compliance',
    readingTime: '6 min read',
    tags: ['EPR', 'DPP', 'ESPR', 'EU regulation', 'fashion'],
    sections: [
      {
        paragraphs: [
          'Two EU regulatory frameworks are reshaping how fashion brands operate: Extended Producer Responsibility (EPR) and Digital Product Passports (DPP). While both target sustainability, they serve different purposes and have different timelines. Understanding the distinction is critical for brands planning their compliance strategy.',
        ],
      },
      {
        heading: 'What is EPR?',
        paragraphs: [
          'Extended Producer Responsibility makes brands financially responsible for the end-of-life management of the products they place on the market. In the textile sector, this means paying eco-contribution fees to fund collection, sorting, recycling, and reuse of textiles.',
          'In France, EPR for textiles has been in place since 2007, managed by Refashion (formerly Eco-TLC). Brands pay annual fees based on the number and type of items they sell. The funds go toward building textile recycling infrastructure, supporting second-hand markets, and financing research into textile-to-textile recycling.',
          'EPR is already active and mandatory in France. Other EU member states are implementing their own textile EPR schemes, and the EU is moving toward harmonised rules through the revised Waste Framework Directive.',
        ],
      },
      {
        heading: 'What is DPP?',
        paragraphs: [
          'The Digital Product Passport is a newer requirement under the EU Ecodesign for Sustainable Products Regulation (ESPR), adopted in 2024. A DPP is a digital record attached to each product (or product model) that contains information about its materials, origin, environmental impact, repairability, and end-of-life handling.',
          'For textiles, the DPP will need to include details like fiber composition, country of manufacturing, care instructions, durability information, and recycling guidance. The exact data requirements are still being defined through delegated acts.',
          'The DPP requirement for textiles is expected to apply from 2027 or 2028, depending on the final timeline of the delegated acts. Unlike EPR, which is a financial obligation, DPP is a data obligation — it requires brands to collect, structure, and share detailed product information.',
        ],
      },
      {
        heading: 'Key differences',
        paragraphs: [
          'While both frameworks aim to make the fashion industry more sustainable, they work in fundamentally different ways.',
        ],
        list: [
          'EPR is a financial obligation — you pay fees. DPP is a data obligation — you provide information.',
          'EPR has been active in France since 2007. DPP for textiles is expected from 2027-2028.',
          'EPR is managed by national Producer Responsibility Organisations (like Refashion). DPP will be regulated at the EU level under ESPR.',
          'EPR data is aggregate (total items per product line per year). DPP data is per-product or per-model.',
          'EPR requires financial planning. DPP requires supply chain transparency and data infrastructure.',
        ],
      },
      {
        heading: 'How they work together',
        paragraphs: [
          'EPR and DPP are complementary. The supply chain data you collect for DPP compliance (materials, manufacturing origin, composition) directly supports your EPR declarations. Knowing the exact fiber composition helps with eco-modulation bonuses. Knowing the weight and material type helps with accurate product line categorisation.',
          'Brands that invest in proper product data infrastructure now will find both EPR and DPP compliance significantly easier. Those relying on spreadsheets and manual processes will face compounding complexity as both requirements tighten.',
        ],
        callout: {
          type: 'tip',
          text: 'Building a single source of truth for product data — covering materials, suppliers, certifications, and quantities — is the most efficient way to prepare for both EPR and DPP simultaneously.',
        },
      },
      {
        heading: 'Timeline for fashion brands',
        paragraphs: [
          'Here is a practical timeline for EU-facing fashion brands.',
        ],
        list: [
          'Now — If you sell in France, ensure your Refashion EPR registration and declarations are up to date.',
          '2026 — Prepare for increasing EPR harmonisation across EU member states. Monitor national transpositions.',
          '2027-2028 — Begin preparing DPP data infrastructure. Collect supply chain data, material compositions, and certifications.',
          '2028+ — Full DPP compliance expected for textile products. Integrate EPR and DPP data flows.',
        ],
      },
      {
        heading: 'Taking action',
        paragraphs: [
          'The brands that will adapt most smoothly are those that treat compliance as a data problem, not a paperwork problem. Centralising supplier data, product information, and compliance documents in a single platform — rather than scattered across spreadsheets, email threads, and filing cabinets — is the foundation.',
          'N.E.X.A Loop is built specifically for this: helping EU-facing fashion brands manage supplier compliance, product data, and regulatory outputs (including EPR and DPP) from one platform.',
        ],
      },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return POSTS.map((p) => p.slug);
}
