import { PrismaClient, SupplierType, SupplierStatus, RiskLevel, DocumentStatus, ProductStatus, ProductSupplierRole, CrmTaskPriority, CrmTaskStatus, CrmThreadStatus, CrmMessageAuthorType, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Main ───────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding N.E.X.A Loop database...\n');

  // ── Clean (dev only) ────────────────────────────────────────
  await prisma.webhookLog.deleteMany();
  await prisma.webhook.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.crmMessage.deleteMany();
  await prisma.crmTask.deleteMany();
  await prisma.crmThread.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.productSupplier.deleteMany();
  await prisma.product.deleteMany();
  await prisma.document.deleteMany();
  await prisma.documentType.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.userOrganization.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.orgInviteToken.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  console.log('  ✓ Cleaned existing data');

  // ── Organization ────────────────────────────────────────────
  const org = await prisma.organization.create({
    data: {
      name: 'Maison Élan',
      country: 'FR',
      vat: 'FR12345678901',
      website: 'https://maison-elan.eu',
      address: '42 Rue du Faubourg Saint-Honoré, 75008 Paris',
      currency: 'EUR',
      industry: 'Fashion & Apparel',
      supplierCount: '10-50',
      primaryConcern: 'ESPR compliance',
      onboardingComplete: true,
    },
  });
  console.log('  ✓ Organization: Maison Élan');

  // ── Users ───────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('TestPass123!', 10);

  const [userSophie, userMarc, userLeila] = await Promise.all([
    prisma.user.create({
      data: { email: 'sophie@maison-elan.eu', passwordHash, name: 'Sophie Durand' },
    }),
    prisma.user.create({
      data: { email: 'marc@maison-elan.eu', passwordHash, name: 'Marc Lefèvre' },
    }),
    prisma.user.create({
      data: { email: 'leila@maison-elan.eu', passwordHash, name: 'Leïla Benali' },
    }),
  ]);

  await Promise.all([
    prisma.userOrganization.create({ data: { userId: userSophie.id, organizationId: org.id, role: 'OWNER' } }),
    prisma.userOrganization.create({ data: { userId: userMarc.id, organizationId: org.id, role: 'ADMIN' } }),
    prisma.userOrganization.create({ data: { userId: userLeila.id, organizationId: org.id, role: 'USER' } }),
  ]);
  console.log('  ✓ Users: Sophie (Owner), Marc (Admin), Leïla (User)');
  console.log('    Login: sophie@maison-elan.eu / TestPass123!');

  // ── Document Types ──────────────────────────────────────────
  const docTypeData = [
    { name: 'BSCI Audit Report', description: 'amfori BSCI social compliance audit', requiredForSupplierTypes: [SupplierType.TIER1_FACTORY, SupplierType.MILL] },
    { name: 'OEKO-TEX Standard 100', description: 'Chemical safety certification for textiles', requiredForSupplierTypes: [SupplierType.MILL, SupplierType.DYEHOUSE] },
    { name: 'REACH Declaration', description: 'EU REACH regulation substance compliance', requiredForSupplierTypes: [SupplierType.TIER1_FACTORY, SupplierType.MILL, SupplierType.DYEHOUSE] },
    { name: 'GRS Certificate', description: 'Global Recycled Standard certification', requiredForSupplierTypes: [SupplierType.SPINNER, SupplierType.MILL] },
    { name: 'ISO 14001', description: 'Environmental management system certification', requiredForSupplierTypes: [SupplierType.TIER1_FACTORY] },
    { name: 'Fire Safety Certificate', description: 'Factory fire safety compliance report', requiredForSupplierTypes: [SupplierType.TIER1_FACTORY] },
    { name: 'NDA Agreement', description: 'Non-disclosure agreement for supplier onboarding', requiredForSupplierTypes: [] },
    { name: 'Insurance Certificate', description: 'Product liability insurance proof', requiredForSupplierTypes: [SupplierType.TIER1_FACTORY] },
  ];

  const docTypes = await Promise.all(
    docTypeData.map((dt) =>
      prisma.documentType.create({ data: { orgId: org.id, ...dt } }),
    ),
  );
  console.log(`  ✓ Document types: ${docTypes.length}`);

  // ── Suppliers ───────────────────────────────────────────────
  const supplierData = [
    { name: 'Lusitex Confecções', supplierCode: 'SUP-001', type: SupplierType.TIER1_FACTORY, country: 'PT', city: 'Porto', status: SupplierStatus.ACTIVE, riskLevel: RiskLevel.LOW, notes: 'Primary cut & sew partner since 2021. Excellent audit scores.' },
    { name: 'İstanbul Tekstil A.Ş.', supplierCode: 'SUP-002', type: SupplierType.MILL, country: 'TR', city: 'Istanbul', status: SupplierStatus.ACTIVE, riskLevel: RiskLevel.MEDIUM, notes: 'Woven fabric supplier. Recent water treatment upgrade pending verification.' },
    { name: 'Zhejiang Silk Road Fabrics', supplierCode: 'SUP-003', type: SupplierType.MILL, country: 'CN', city: 'Hangzhou', status: SupplierStatus.ACTIVE, riskLevel: RiskLevel.HIGH, notes: 'Silk and satin supplier. BSCI audit overdue — follow up required.' },
    { name: 'Rajasthan Spinners Pvt.', supplierCode: 'SUP-004', type: SupplierType.SPINNER, country: 'IN', city: 'Jaipur', status: SupplierStatus.ACTIVE, riskLevel: RiskLevel.MEDIUM, notes: 'Organic cotton yarn supplier. GRS certified.' },
    { name: 'Dhaka Garments Ltd.', supplierCode: 'SUP-005', type: SupplierType.TIER1_FACTORY, country: 'BD', city: 'Dhaka', status: SupplierStatus.ACTIVE, riskLevel: RiskLevel.HIGH, notes: 'Knitwear specialist. Fire safety cert expired — critical.' },
    { name: 'ColorTech Tintoria', supplierCode: 'SUP-006', type: SupplierType.DYEHOUSE, country: 'IT', city: 'Prato', status: SupplierStatus.ACTIVE, riskLevel: RiskLevel.LOW, notes: 'Premium dyehouse with OEKO-TEX and ZDHC compliance.' },
    { name: 'Barcelona Trims S.L.', supplierCode: 'SUP-007', type: SupplierType.TRIM_SUPPLIER, country: 'ES', city: 'Barcelona', status: SupplierStatus.ACTIVE, riskLevel: RiskLevel.LOW, notes: 'Buttons, zippers, labels. Long-standing relationship.' },
    { name: 'Saigon Fabrics Co.', supplierCode: 'SUP-008', type: SupplierType.MILL, country: 'VN', city: 'Ho Chi Minh City', status: SupplierStatus.ONBOARDING, riskLevel: RiskLevel.UNKNOWN, notes: 'New supplier — vetting in progress. Competitive pricing on jersey knits.' },
    { name: 'Marokko Textilwerk', supplierCode: 'SUP-009', type: SupplierType.TIER1_FACTORY, country: 'MA', city: 'Casablanca', status: SupplierStatus.PROSPECT, riskLevel: RiskLevel.UNKNOWN, notes: 'Exploring for nearshoring. Initial contact made via trade fair.' },
    { name: 'Tessuti Pregiati Milano', supplierCode: 'SUP-010', type: SupplierType.MILL, country: 'IT', city: 'Milan', status: SupplierStatus.ACTIVE, riskLevel: RiskLevel.LOW, notes: 'Premium Italian wool and cashmere. Fully compliant.' },
    { name: 'Thai Silk Heritage', supplierCode: 'SUP-011', type: SupplierType.MILL, country: 'TH', city: 'Bangkok', status: SupplierStatus.ACTIVE, riskLevel: RiskLevel.MEDIUM, notes: 'Artisanal silk supplier. Cultural heritage weaving techniques.' },
    { name: 'Merino Wool Australia', supplierCode: 'SUP-012', type: SupplierType.SPINNER, country: 'AU', city: 'Melbourne', status: SupplierStatus.INACTIVE, riskLevel: RiskLevel.LOW, notes: 'Paused — minimum order quantity too high for current season.' },
  ];

  const suppliers = await Promise.all(
    supplierData.map((s) =>
      prisma.supplier.create({ data: { orgId: org.id, ...s } }),
    ),
  );
  console.log(`  ✓ Suppliers: ${suppliers.length}`);

  // ── Contacts ────────────────────────────────────────────────
  const contactData = [
    { supplierId: suppliers[0].id, name: 'Ana Ferreira', email: 'ana@lusitex.pt', phone: '+351 912 345 678', role: 'Production Manager' },
    { supplierId: suppliers[0].id, name: 'Rui Santos', email: 'rui@lusitex.pt', role: 'Quality Control' },
    { supplierId: suppliers[1].id, name: 'Emre Yılmaz', email: 'emre@istanbultekstil.com.tr', phone: '+90 532 111 2233', role: 'Sales Director' },
    { supplierId: suppliers[2].id, name: 'Wei Chen', email: 'wei.chen@zjsilkroad.cn', phone: '+86 139 0000 1111', role: 'Export Manager' },
    { supplierId: suppliers[3].id, name: 'Priya Sharma', email: 'priya@rajasthanspinners.in', role: 'Compliance Officer' },
    { supplierId: suppliers[4].id, name: 'Rahim Ahmed', email: 'rahim@dhakagarments.com.bd', phone: '+880 171 234 5678', role: 'Factory Manager' },
    { supplierId: suppliers[5].id, name: 'Marco Bianchi', email: 'marco@colortech.it', role: 'Technical Director' },
    { supplierId: suppliers[6].id, name: 'Isabel García', email: 'isabel@barcelonatrims.es', role: 'Account Manager' },
    { supplierId: suppliers[7].id, name: 'Nguyen Minh', email: 'minh@saigonfabrics.vn', role: 'Managing Director' },
    { supplierId: suppliers[9].id, name: 'Giulia Rossi', email: 'giulia@tessutipregiati.it', phone: '+39 02 1234567', role: 'Key Account Manager' },
    { supplierId: suppliers[10].id, name: 'Somchai Pradit', email: 'somchai@thaisilk.co.th', role: 'Head of Sales' },
  ];

  const contacts = await Promise.all(
    contactData.map((c) => prisma.contact.create({ data: c })),
  );
  console.log(`  ✓ Contacts: ${contacts.length}`);

  // ── Documents ───────────────────────────────────────────────
  const docsToCreate = [
    // Lusitex — fully compliant
    { supplierId: suppliers[0].id, docTypeIdx: 0, status: DocumentStatus.APPROVED, issuedDate: daysAgo(180), expiryDate: daysFromNow(185), filename: 'lusitex-bsci-2025.pdf' },
    { supplierId: suppliers[0].id, docTypeIdx: 2, status: DocumentStatus.APPROVED, issuedDate: daysAgo(90), expiryDate: daysFromNow(275), filename: 'lusitex-reach-declaration.pdf' },
    { supplierId: suppliers[0].id, docTypeIdx: 4, status: DocumentStatus.APPROVED, issuedDate: daysAgo(60), expiryDate: daysFromNow(305), filename: 'lusitex-iso14001.pdf' },
    { supplierId: suppliers[0].id, docTypeIdx: 5, status: DocumentStatus.APPROVED, issuedDate: daysAgo(30), expiryDate: daysFromNow(335), filename: 'lusitex-fire-safety.pdf' },
    { supplierId: suppliers[0].id, docTypeIdx: 7, status: DocumentStatus.APPROVED, issuedDate: daysAgo(120), expiryDate: daysFromNow(245), filename: 'lusitex-insurance.pdf' },

    // İstanbul Tekstil — one expiring soon
    { supplierId: suppliers[1].id, docTypeIdx: 1, status: DocumentStatus.APPROVED, issuedDate: daysAgo(340), expiryDate: daysFromNow(25), filename: 'istanbul-oekotex.pdf' },
    { supplierId: suppliers[1].id, docTypeIdx: 2, status: DocumentStatus.APPROVED, issuedDate: daysAgo(200), expiryDate: daysFromNow(165), filename: 'istanbul-reach.pdf' },
    { supplierId: suppliers[1].id, docTypeIdx: 0, status: DocumentStatus.PENDING_REVIEW, issuedDate: daysAgo(5), expiryDate: daysFromNow(360), filename: 'istanbul-bsci-2026.pdf' },

    // Zhejiang — high risk, audit overdue
    { supplierId: suppliers[2].id, docTypeIdx: 0, status: DocumentStatus.EXPIRED, issuedDate: daysAgo(400), expiryDate: daysAgo(35), filename: 'zhejiang-bsci-2024.pdf' },
    { supplierId: suppliers[2].id, docTypeIdx: 1, status: DocumentStatus.APPROVED, issuedDate: daysAgo(100), expiryDate: daysFromNow(265), filename: 'zhejiang-oekotex.pdf' },
    { supplierId: suppliers[2].id, docTypeIdx: 2, status: DocumentStatus.REJECTED, issuedDate: daysAgo(15), filename: 'zhejiang-reach-v1.pdf' },

    // Rajasthan — GRS certified
    { supplierId: suppliers[3].id, docTypeIdx: 3, status: DocumentStatus.APPROVED, issuedDate: daysAgo(60), expiryDate: daysFromNow(305), filename: 'rajasthan-grs.pdf' },
    { supplierId: suppliers[3].id, docTypeIdx: 2, status: DocumentStatus.PENDING_REVIEW, issuedDate: daysAgo(3), expiryDate: daysFromNow(362), filename: 'rajasthan-reach.pdf' },

    // Dhaka — fire safety expired (critical)
    { supplierId: suppliers[4].id, docTypeIdx: 5, status: DocumentStatus.EXPIRED, issuedDate: daysAgo(500), expiryDate: daysAgo(135), filename: 'dhaka-firesafety-2023.pdf' },
    { supplierId: suppliers[4].id, docTypeIdx: 0, status: DocumentStatus.APPROVED, issuedDate: daysAgo(200), expiryDate: daysFromNow(165), filename: 'dhaka-bsci.pdf' },
    { supplierId: suppliers[4].id, docTypeIdx: 7, status: DocumentStatus.APPROVED, issuedDate: daysAgo(90), expiryDate: daysFromNow(10), filename: 'dhaka-insurance.pdf' },

    // ColorTech — fully compliant
    { supplierId: suppliers[5].id, docTypeIdx: 1, status: DocumentStatus.APPROVED, issuedDate: daysAgo(45), expiryDate: daysFromNow(320), filename: 'colortech-oekotex.pdf' },
    { supplierId: suppliers[5].id, docTypeIdx: 2, status: DocumentStatus.APPROVED, issuedDate: daysAgo(30), expiryDate: daysFromNow(335), filename: 'colortech-reach.pdf' },

    // Barcelona Trims
    { supplierId: suppliers[6].id, docTypeIdx: 6, status: DocumentStatus.APPROVED, issuedDate: daysAgo(200), expiryDate: daysFromNow(530), filename: 'barca-trims-nda.pdf' },

    // Tessuti Pregiati — fully compliant
    { supplierId: suppliers[9].id, docTypeIdx: 1, status: DocumentStatus.APPROVED, issuedDate: daysAgo(30), expiryDate: daysFromNow(335), filename: 'tessuti-oekotex.pdf' },
    { supplierId: suppliers[9].id, docTypeIdx: 2, status: DocumentStatus.APPROVED, issuedDate: daysAgo(60), expiryDate: daysFromNow(305), filename: 'tessuti-reach.pdf' },
    { supplierId: suppliers[9].id, docTypeIdx: 3, status: DocumentStatus.APPROVED, issuedDate: daysAgo(90), expiryDate: daysFromNow(275), filename: 'tessuti-grs.pdf' },

    // Thai Silk
    { supplierId: suppliers[10].id, docTypeIdx: 1, status: DocumentStatus.APPROVED, issuedDate: daysAgo(150), expiryDate: daysFromNow(215), filename: 'thaisilk-oekotex.pdf' },
    { supplierId: suppliers[10].id, docTypeIdx: 2, status: DocumentStatus.PENDING_REVIEW, issuedDate: daysAgo(7), filename: 'thaisilk-reach-2026.pdf' },
  ];

  const documents = await Promise.all(
    docsToCreate.map((d) =>
      prisma.document.create({
        data: {
          orgId: org.id,
          supplierId: d.supplierId,
          documentTypeId: docTypes[d.docTypeIdx].id,
          fileUrl: `uploads/${d.filename}`,
          filename: d.filename,
          mimeType: 'application/pdf',
          issuedDate: d.issuedDate,
          expiryDate: d.expiryDate ?? null,
          status: d.status,
          uploadedByUserId: pick([userSophie.id, userMarc.id, userLeila.id]),
          reviewedByUserId: d.status !== DocumentStatus.PENDING_REVIEW ? pick([userSophie.id, userMarc.id]) : null,
          reviewNotes: d.status === DocumentStatus.REJECTED ? 'REACH substance list incomplete — missing restricted amine declarations per Annex XVII Entry 43.' : null,
        },
      }),
    ),
  );
  console.log(`  ✓ Documents: ${documents.length}`);

  // ── Products ────────────────────────────────────────────────
  const productData = [
    { name: 'Élan Classic Blazer', sku: 'ELN-BLZ-001', category: 'Outerwear', season: 'AW26', dppEnabled: true, materialComposition: '98% Wool, 2% Elastane', countryOfOrigin: 'PT', weight: 0.85, recycledContent: 0, repairabilityScore: 7 },
    { name: 'Riviera Silk Dress', sku: 'ELN-DRS-002', category: 'Dresses', season: 'SS26', dppEnabled: true, materialComposition: '100% Mulberry Silk', countryOfOrigin: 'CN', weight: 0.32, recycledContent: 0, repairabilityScore: 5 },
    { name: 'Côte d\'Azur Linen Shirt', sku: 'ELN-SHT-003', category: 'Tops', season: 'SS26', dppEnabled: true, materialComposition: '100% Organic Linen', countryOfOrigin: 'PT', weight: 0.25, recycledContent: 0, repairabilityScore: 8 },
    { name: 'Montmartre Trousers', sku: 'ELN-TRS-004', category: 'Bottoms', season: 'AW26', dppEnabled: true, materialComposition: '60% Recycled Polyester, 40% Organic Cotton', countryOfOrigin: 'TR', weight: 0.45, recycledContent: 60, repairabilityScore: 6 },
    { name: 'Seine Cashmere Scarf', sku: 'ELN-ACC-005', category: 'Accessories', season: 'AW26', dppEnabled: true, materialComposition: '100% Cashmere', countryOfOrigin: 'IT', weight: 0.15, recycledContent: 0, repairabilityScore: 4 },
    { name: 'Bastille Denim Jacket', sku: 'ELN-JKT-006', category: 'Outerwear', season: 'SS26', dppEnabled: false, materialComposition: '100% Organic Cotton Denim', countryOfOrigin: 'PT', weight: 0.95, recycledContent: 0, repairabilityScore: 9 },
    { name: 'Provence Midi Skirt', sku: 'ELN-SKT-007', category: 'Bottoms', season: 'SS26', dppEnabled: true, materialComposition: '70% Viscose, 30% Linen', countryOfOrigin: 'IT', weight: 0.3, recycledContent: 0, repairabilityScore: 6 },
    { name: 'Opéra Knit Sweater', sku: 'ELN-KNT-008', category: 'Knitwear', season: 'AW26', dppEnabled: false, materialComposition: '80% Merino Wool, 20% Recycled Cashmere', countryOfOrigin: 'BD', weight: 0.4, recycledContent: 20, repairabilityScore: 7 },
    { name: 'Arc de Triomphe Coat', sku: 'ELN-COT-009', category: 'Outerwear', season: 'AW26', dppEnabled: true, materialComposition: '90% Wool, 10% Polyamide', countryOfOrigin: 'PT', weight: 1.2, recycledContent: 0, repairabilityScore: 8 },
    { name: 'Jardin Print Blouse', sku: 'ELN-BLS-010', category: 'Tops', season: 'SS26', dppEnabled: true, materialComposition: '100% Organic Cotton', countryOfOrigin: 'IN', weight: 0.2, recycledContent: 0, repairabilityScore: 7 },
    { name: 'Tuileries Palazzo Pants', sku: 'ELN-PNT-011', category: 'Bottoms', season: 'SS26', dppEnabled: false, materialComposition: '55% Tencel, 45% Linen', countryOfOrigin: 'TR', weight: 0.35, recycledContent: 0, repairabilityScore: 6 },
    { name: 'Champs-Élysées Tote', sku: 'ELN-BAG-012', category: 'Accessories', season: 'Core', dppEnabled: true, materialComposition: '100% Recycled Nylon', countryOfOrigin: 'VN', weight: 0.28, recycledContent: 100, repairabilityScore: 5 },
  ];

  const products = await Promise.all(
    productData.map((p) =>
      prisma.product.create({
        data: {
          orgId: org.id,
          ...p,
          status: ProductStatus.ACTIVE,
          manufacturingDate: daysAgo(Math.floor(Math.random() * 90) + 30),
          weightUnit: 'kg',
        },
      }),
    ),
  );
  console.log(`  ✓ Products: ${products.length}`);

  // ── Product–Supplier links ──────────────────────────────────
  const links = [
    { productIdx: 0, supplierIdx: 0, role: ProductSupplierRole.CUT_AND_SEW },
    { productIdx: 0, supplierIdx: 9, role: ProductSupplierRole.FABRIC_SUPPLIER },
    { productIdx: 1, supplierIdx: 2, role: ProductSupplierRole.FABRIC_SUPPLIER },
    { productIdx: 1, supplierIdx: 0, role: ProductSupplierRole.CUT_AND_SEW },
    { productIdx: 2, supplierIdx: 0, role: ProductSupplierRole.CUT_AND_SEW },
    { productIdx: 3, supplierIdx: 1, role: ProductSupplierRole.FABRIC_SUPPLIER },
    { productIdx: 3, supplierIdx: 0, role: ProductSupplierRole.CUT_AND_SEW },
    { productIdx: 4, supplierIdx: 9, role: ProductSupplierRole.FABRIC_SUPPLIER },
    { productIdx: 5, supplierIdx: 0, role: ProductSupplierRole.CUT_AND_SEW },
    { productIdx: 5, supplierIdx: 1, role: ProductSupplierRole.FABRIC_SUPPLIER },
    { productIdx: 6, supplierIdx: 5, role: ProductSupplierRole.FABRIC_SUPPLIER },
    { productIdx: 6, supplierIdx: 0, role: ProductSupplierRole.CUT_AND_SEW },
    { productIdx: 7, supplierIdx: 4, role: ProductSupplierRole.CUT_AND_SEW },
    { productIdx: 7, supplierIdx: 3, role: ProductSupplierRole.YARN_SUPPLIER },
    { productIdx: 8, supplierIdx: 0, role: ProductSupplierRole.CUT_AND_SEW },
    { productIdx: 8, supplierIdx: 9, role: ProductSupplierRole.FABRIC_SUPPLIER },
    { productIdx: 9, supplierIdx: 3, role: ProductSupplierRole.YARN_SUPPLIER },
    { productIdx: 10, supplierIdx: 1, role: ProductSupplierRole.FABRIC_SUPPLIER },
    { productIdx: 11, supplierIdx: 7, role: ProductSupplierRole.FABRIC_SUPPLIER },
    { productIdx: 6, supplierIdx: 6, role: ProductSupplierRole.TRIM_SUPPLIER },
    { productIdx: 0, supplierIdx: 6, role: ProductSupplierRole.TRIM_SUPPLIER },
    { productIdx: 5, supplierIdx: 6, role: ProductSupplierRole.TRIM_SUPPLIER },
  ];

  await Promise.all(
    links.map((l) =>
      prisma.productSupplier.create({
        data: { productId: products[l.productIdx].id, supplierId: suppliers[l.supplierIdx].id, role: l.role },
      }),
    ),
  );
  console.log(`  ✓ Product–Supplier links: ${links.length}`);

  // ── CRM Notes & Comments (internal team discussions) ─────────
  const threads = [
    {
      subject: 'BSCI audit renewal — Zhejiang facility',
      supplierId: suppliers[2].id,
      contactId: contacts[3].id,
      status: CrmThreadStatus.OPEN,
      createdByUserId: userSophie.id,
      messages: [
        { body: 'The BSCI audit for the Hangzhou facility expired last month. I\'ve emailed Wei Chen to schedule the renewal audit with TÜV. Waiting for their available dates.', authorName: 'Sophie Durand', authorType: CrmMessageAuthorType.INTERNAL, authorUserId: userSophie.id },
        { body: 'Update: Wei confirmed TÜV proposed the week of July 14th. I\'ve approved that timeframe. We need to make sure the pre-audit checklist is completed beforehand — assigning a task for that.', authorName: 'Sophie Durand', authorType: CrmMessageAuthorType.INTERNAL, authorUserId: userSophie.id },
        { body: 'Good. I\'ll flag this on our next compliance review call. We should also check if the GRS certificate for this facility is still valid — last I saw it was expiring in Q3.', authorName: 'Marc Lefèvre', authorType: CrmMessageAuthorType.INTERNAL, authorUserId: userMarc.id },
      ],
    },
    {
      subject: 'Fire safety certificate — Dhaka urgent',
      supplierId: suppliers[4].id,
      contactId: contacts[5].id,
      status: CrmThreadStatus.OPEN,
      createdByUserId: userMarc.id,
      messages: [
        { body: 'The fire safety certificate for the Dhaka facility has been expired for over 4 months. This is a critical compliance gap — we cannot place new orders until this is resolved. I\'ve escalated via email to Rahim.', authorName: 'Marc Lefèvre', authorType: CrmMessageAuthorType.INTERNAL, authorUserId: userMarc.id },
        { body: 'Spoke with Rahim on the phone. They had an inspection last week and the certificate should be reissued within 2 weeks. He\'s sending an interim pass letter from the local fire department.', authorName: 'Marc Lefèvre', authorType: CrmMessageAuthorType.INTERNAL, authorUserId: userMarc.id },
        { body: 'Received the interim pass letter via email and uploaded it as a document. Still waiting for the formal certificate. Keeping orders on hold until we have the official cert.', authorName: 'Leïla Benali', authorType: CrmMessageAuthorType.INTERNAL, authorUserId: userLeila.id },
      ],
    },
    {
      subject: 'OEKO-TEX renewal notice — certificate expiring',
      supplierId: suppliers[1].id,
      contactId: contacts[2].id,
      status: CrmThreadStatus.OPEN,
      createdByUserId: userLeila.id,
      messages: [
        { body: 'OEKO-TEX Standard 100 certificate for Anatolian Textiles expires in 25 days. I\'ve sent Emre a reminder email asking about the renewal status.', authorName: 'Leïla Benali', authorType: CrmMessageAuthorType.INTERNAL, authorUserId: userLeila.id },
        { body: 'Emre confirmed via email that they submitted the renewal application last week. Lab testing is in progress and they expect the new certificate by end of month. Adding a follow-up task for the 28th.', authorName: 'Leïla Benali', authorType: CrmMessageAuthorType.INTERNAL, authorUserId: userLeila.id },
      ],
    },
    {
      subject: 'New supplier onboarding — Saigon Fabrics',
      supplierId: suppliers[7].id,
      contactId: contacts[8].id,
      status: CrmThreadStatus.OPEN,
      createdByUserId: userSophie.id,
      messages: [
        { body: 'Starting the onboarding process for Saigon Fabrics. I\'ve emailed Nguyen Minh with our standard requirements: NDA, REACH declaration, OEKO-TEX certificate (if available), and factory profile. They confirmed they\'ll have everything ready by Friday.', authorName: 'Sophie Durand', authorType: CrmMessageAuthorType.INTERNAL, authorUserId: userSophie.id },
        { body: 'Just a heads-up — I checked their initial factory profile and they do have OEKO-TEX, which is great. Country risk for Vietnam is medium so we should make sure the BSCI is scheduled within 60 days of onboarding.', authorName: 'Marc Lefèvre', authorType: CrmMessageAuthorType.INTERNAL, authorUserId: userMarc.id },
      ],
    },
    {
      subject: 'REACH declaration review — rejected submission',
      supplierId: suppliers[2].id,
      contactId: contacts[3].id,
      status: CrmThreadStatus.RESOLVED,
      createdByUserId: userMarc.id,
      messages: [
        { body: 'Rejected the REACH declaration from Zhejiang Silk Co. — the restricted amine declarations per Annex XVII Entry 43 were missing. I\'ve emailed Wei Chen asking for a resubmission with the complete substance list.', authorName: 'Marc Lefèvre', authorType: CrmMessageAuthorType.INTERNAL, authorUserId: userMarc.id },
        { body: 'Wei sent the updated declaration with all required amine test results. I\'ve uploaded it and it\'s now in the review queue.', authorName: 'Leïla Benali', authorType: CrmMessageAuthorType.INTERNAL, authorUserId: userLeila.id },
        { body: 'Reviewed and approved the updated declaration. All good now — marking this as resolved.', authorName: 'Marc Lefèvre', authorType: CrmMessageAuthorType.INTERNAL, authorUserId: userMarc.id },
      ],
    },
  ];

  for (const t of threads) {
    const thread = await prisma.crmThread.create({
      data: {
        orgId: org.id,
        subject: t.subject,
        supplierId: t.supplierId,
        contactId: t.contactId,
        status: t.status,
        createdByUserId: t.createdByUserId,
        lastMessageAt: daysAgo(Math.floor(Math.random() * 5)),
      },
    });
    for (let i = 0; i < t.messages.length; i++) {
      await prisma.crmMessage.create({
        data: {
          threadId: thread.id,
          body: t.messages[i].body,
          authorName: t.messages[i].authorName,
          authorType: t.messages[i].authorType,
          authorUserId: t.messages[i].authorUserId ?? null,
          createdAt: daysAgo(t.messages.length * 2 - i * 2),
        },
      });
    }
  }
  console.log(`  ✓ Internal notes: ${threads.length} with comments`);

  // ── CRM Tasks ───────────────────────────────────────────────
  const taskData = [
    { title: 'Follow up on Zhejiang BSCI audit date', supplierId: suppliers[2].id, assigneeId: userSophie.id, priority: CrmTaskPriority.HIGH, dueDate: daysFromNow(3), status: CrmTaskStatus.OPEN },
    { title: 'Review Dhaka fire safety inspection letter', supplierId: suppliers[4].id, assigneeId: userMarc.id, priority: CrmTaskPriority.HIGH, dueDate: daysFromNow(-2), status: CrmTaskStatus.OPEN },
    { title: 'Verify İstanbul OEKO-TEX renewal status', supplierId: suppliers[1].id, assigneeId: userLeila.id, priority: CrmTaskPriority.MEDIUM, dueDate: daysFromNow(7), status: CrmTaskStatus.OPEN },
    { title: 'Send onboarding pack to Saigon Fabrics', supplierId: suppliers[7].id, assigneeId: userSophie.id, priority: CrmTaskPriority.MEDIUM, dueDate: daysFromNow(5), status: CrmTaskStatus.OPEN },
    { title: 'Review Rajasthan REACH declaration', supplierId: suppliers[3].id, assigneeId: userMarc.id, priority: CrmTaskPriority.LOW, dueDate: daysFromNow(14), status: CrmTaskStatus.OPEN },
    { title: 'Update Dhaka insurance certificate before expiry', supplierId: suppliers[4].id, assigneeId: userLeila.id, priority: CrmTaskPriority.HIGH, dueDate: daysFromNow(10), status: CrmTaskStatus.OPEN },
    { title: 'Schedule Marokko Textilwerk site visit', supplierId: suppliers[8].id, assigneeId: userSophie.id, priority: CrmTaskPriority.LOW, dueDate: daysFromNow(30), status: CrmTaskStatus.OPEN },
    { title: 'Approved Lusitex ISO 14001 renewal', supplierId: suppliers[0].id, assigneeId: userMarc.id, priority: CrmTaskPriority.MEDIUM, dueDate: daysAgo(5), status: CrmTaskStatus.DONE, completedAt: daysAgo(3) },
    { title: 'Verify ColorTech OEKO-TEX certificate', supplierId: suppliers[5].id, assigneeId: userLeila.id, priority: CrmTaskPriority.LOW, dueDate: daysAgo(10), status: CrmTaskStatus.DONE, completedAt: daysAgo(8) },
  ];

  await Promise.all(
    taskData.map((t) =>
      prisma.crmTask.create({
        data: {
          orgId: org.id,
          title: t.title,
          supplierId: t.supplierId,
          assigneeId: t.assigneeId,
          priority: t.priority,
          dueDate: t.dueDate,
          status: t.status,
          completedAt: t.completedAt ?? null,
        },
      }),
    ),
  );
  console.log(`  ✓ CRM Tasks: ${taskData.length}`);

  // ── Notifications ───────────────────────────────────────────
  const notifData = [
    { userId: userSophie.id, type: NotificationType.DOCUMENT_EXPIRING, title: 'Certificate expiring soon', message: 'OEKO-TEX Standard 100 for İstanbul Tekstil expires in 25 days', entityType: 'supplier', entityId: suppliers[1].id },
    { userId: userSophie.id, type: NotificationType.DOCUMENT_EXPIRED, title: 'Certificate expired', message: 'BSCI Audit Report for Zhejiang Silk Road Fabrics has expired', entityType: 'supplier', entityId: suppliers[2].id },
    { userId: userMarc.id, type: NotificationType.DOCUMENT_EXPIRED, title: 'Certificate expired', message: 'Fire Safety Certificate for Dhaka Garments has been expired for 135 days', entityType: 'supplier', entityId: suppliers[4].id },
    { userId: userMarc.id, type: NotificationType.DOCUMENT_UPLOADED, title: 'New document uploaded', message: 'İstanbul Tekstil submitted a new BSCI Audit Report for review', entityType: 'supplier', entityId: suppliers[1].id },
    { userId: userLeila.id, type: NotificationType.DOCUMENT_EXPIRING, title: 'Insurance expiring', message: 'Insurance Certificate for Dhaka Garments expires in 10 days', entityType: 'supplier', entityId: suppliers[4].id },
    { userId: userSophie.id, type: NotificationType.DOCUMENT_REVIEWED, title: 'Document rejected', message: 'REACH Declaration from Zhejiang Silk Road Fabrics was rejected — missing amine declarations', entityType: 'supplier', entityId: suppliers[2].id, read: true },
  ];

  await Promise.all(
    notifData.map((n) =>
      prisma.notification.create({
        data: { orgId: org.id, ...n, read: n.read ?? false },
      }),
    ),
  );
  console.log(`  ✓ Notifications: ${notifData.length}`);

  // ── Webhooks (sample) ───────────────────────────────────────
  await prisma.webhook.create({
    data: {
      orgId: org.id,
      url: 'https://hooks.slack.example.com/nexaloop-alerts',
      secret: `whsec_${randomBytes(24).toString('hex')}`,
      events: ['document.expired', 'document.reviewed', 'supplier.created'],
      isActive: true,
    },
  });
  console.log('  ✓ Sample webhook created');

  // ── API Key (sample) ────────────────────────────────────────
  const sampleKey = `nxa_${randomBytes(32).toString('hex')}`;
  await prisma.apiKey.create({
    data: {
      orgId: org.id,
      name: 'Development',
      keyHash: createHash('sha256').update(sampleKey).digest('hex'),
      prefix: sampleKey.slice(0, 12),
      isActive: true,
    },
  });
  console.log('  ✓ Sample API key created');

  console.log('\n✅ Seed complete!\n');
  console.log('  Organization: Maison Élan');
  console.log('  Login:        sophie@maison-elan.eu / TestPass123!');
  console.log('  Alt logins:   marc@maison-elan.eu / TestPass123!');
  console.log('                leila@maison-elan.eu / TestPass123!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
