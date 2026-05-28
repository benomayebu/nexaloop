# N.E.X.A Loop

## The Simple Version

Fashion brands selling into Europe must prove where their products come from, who made them, and that every supplier has valid compliance certificates. Today, most brands track this in spreadsheets and email threads. When an auditor or retailer asks for proof, it takes days of scrambling to find the right documents — and sometimes those documents have already expired.

**N.E.X.A Loop is a web platform that replaces that chaos with one organised place for everything.**

---

## What We Do

N.E.X.A Loop is a supply chain compliance platform built for fashion brands. It does three things:

1. **Organises supplier data** — Every factory, mill, and material supplier in one searchable database with contacts, risk ratings, and status tracking.

2. **Manages compliance documents** — Upload certificates, audit reports, and policies. The system tracks expiry dates, sends reminders before they lapse, and lets managers approve or reject documents with a click.

3. **Connects products to suppliers** — Map every product to the suppliers involved in making it — from yarn spinner to cut-and-sew factory — so the brand can answer "who made this and where?" instantly.

On top of that foundation, the platform generates regulatory outputs that EU law increasingly demands: Digital Product Passports (DPP) and Extended Producer Responsibility (EPR) declarations.

---

## The Problem

### New EU regulations are coming fast

The European Union is rolling out strict new rules for fashion and textiles:

- **ESPR & Digital Product Passports (DPP):** Every product sold in the EU will need a digital record of its composition, origin, durability, and environmental impact.
- **Textile EPR:** Brands must declare their textile volumes and pay eco-modulated fees based on product design and recyclability.
- **CSRD/ESRS Due Diligence:** Larger buyers and investors now require ESG and traceability data from their suppliers.

These regulations specifically require data that most brands cannot currently provide — particularly about suppliers beyond the first tier (mills, spinners, dye houses).

### Brands are not ready

- Supplier lists live in spreadsheets with inconsistent formats and outdated information.
- Compliance certificates are scattered across email inboxes, shared drives, and individual laptops.
- Nobody knows which documents have expired until an auditor asks.
- Answering "what is in this garment and where did it come from?" takes days of manual work.
- When a retailer requests an audit pack, it triggers a multi-day scramble.

### Existing tools don't fit

- **Enterprise platforms** (Sedex, TrusTrace, Sourcemap) are designed for large corporations with dedicated IT teams. They cost too much and take too long to implement for a 50-person brand.
- **Generic tools** (Notion, Google Drive, SharePoint) have no concept of supplier tiers, document expiry dates, or compliance workflows.
- **Spreadsheets** cannot send reminders, enforce data quality, generate regulatory reports, or provide audit trails.

**There is a gap in the market** between expensive enterprise software and manual spreadsheet-based processes. That gap is exactly where most EU-facing fashion brands sit today.

---

## Who It's For

### Primary Customer

Small and mid-size fashion brands selling into the EU:

- 10 to 200 employees
- 30 to 500+ suppliers across multiple countries
- Sales through direct-to-consumer, marketplaces, and wholesale into Europe
- Typically has a compliance manager, sustainability lead, or founder handling compliance alongside other responsibilities

### The People Who Use It

| Role | What they need | Their pain today |
|------|---------------|-----------------|
| **Compliance / Sustainability Manager** | Track certificates, prepare audit packs, stay ahead of DPP/EPR | Drowning in spreadsheet upkeep; discovers expired certs during audits |
| **Sourcing Manager** | Know which suppliers are compliant before placing orders | No single view of supplier risk; manually chases documents every season |
| **Founder / COO** | Understand compliance posture at a glance; avoid fines | Compliance is a black box until something breaks |

### Future Expansion

After fashion, the same compliance challenges apply to footwear, accessories, home textiles, and other consumer goods subject to EU ESPR regulations.

---

## How It Works

### Step 1: Set up your supply chain (Day 1)

Sign up, name your organisation, and start adding suppliers. For each one, record the type (factory, mill, spinner, dye house), location, status, and risk level. Add key contacts. Import existing supplier lists from CSV.

### Step 2: Define what documents you need

Create document types that match your compliance requirements — social audits, GRS certificates, OEKO-TEX reports, whatever your supply chain demands. Specify which supplier types need which documents.

### Step 3: Upload and track documents

Upload compliance documents against each supplier. The system tracks issue dates, expiry dates, and review status. Managers approve or reject documents. A nightly job flags documents expiring within 30 days and sends notifications.

### Step 4: Map products to suppliers

Link each product (SKU) to the suppliers involved in making it, with roles — cut-and-sew factory, fabric supplier, yarn spinner, trim supplier. This builds the traceability chain regulators now require.

### Step 5: See your compliance posture

The dashboard shows compliance scores, expiring documents, pending reviews, supplier risk distribution, and products with missing supplier links — all in real time, all from real data.

### Step 6: Generate regulatory outputs

When you need a Digital Product Passport, the platform assembles the data from your products, suppliers, and documents into the structured format EU regulations require. EPR declarations are similarly generated from your product data.

---

## Business Model

### How We Make Money

**SaaS subscription** — monthly or annual plans based on organisation size.

| Plan | Target | Includes |
|------|--------|----------|
| **Starter** | Small brands (up to 50 suppliers) | Core compliance tracking, document management, CSV import/export |
| **Professional** | Growing brands (up to 200 suppliers) | Everything in Starter + DPP generation, EPR exports, team roles, priority support |
| **Enterprise** | Large brands (500+ suppliers) | Everything in Professional + API access, custom integrations, dedicated onboarding |

### Key Metrics We Track

| Metric | 12-Month Target |
|--------|----------------|
| Paying organisations | 50+ |
| Average suppliers per org | 80–200 |
| Documents tracked per org | 300–1,000 |
| Monthly active users | 150+ |
| Monthly churn | < 2% |
| NPS | > 45 |

### Why Customers Stay

1. **Data gravity** — Once a brand has loaded 200 suppliers and 500 documents, switching costs are real.
2. **Regulatory dependency** — As DPP and EPR deadlines approach, the platform becomes essential infrastructure, not optional tooling.
3. **Network effects (future)** — Suppliers who upload documents for one brand can reuse them across multiple brands on the platform, making N.E.X.A Loop more valuable the more brands use it.

---

## Business Model Canvas

### Customer Segments
- EU-facing fashion and apparel SMEs (10–200 employees)
- Compliance, sustainability, and sourcing managers
- Founders and COOs at smaller brands

### Value Propositions
- Single source of truth for supply chain compliance
- Automated document expiry tracking and reminders
- Audit-ready in minutes, not days
- EU regulatory output generation (DPP, EPR)
- Affordable and quick to onboard (vs. enterprise tools)
- Product-to-supplier traceability mapping

### Channels
- Direct web sales (self-serve sign-up)
- Content marketing (compliance guides, regulatory updates)
- Industry events and trade shows
- Partnerships with sustainability consultancies
- Word of mouth within brand compliance networks

### Customer Relationships
- Self-service platform with guided onboarding
- In-app notifications and compliance reminders
- Email support and knowledge base
- Dedicated account management (Enterprise tier)

### Revenue Streams
- Monthly/annual SaaS subscriptions (tiered by org size)
- Premium features (DPP generation, advanced reporting)
- Future: supplier verification services, marketplace integrations

### Key Resources
- The platform (Next.js + NestJS + PostgreSQL)
- Regulatory expertise (ESPR, DPP, EPR knowledge)
- Supplier data network (grows with each customer)
- Engineering team

### Key Activities
- Platform development and maintenance
- Regulatory monitoring (keeping up with EU rule changes)
- Customer acquisition and onboarding
- Data security and compliance (SOC 2, GDPR)

### Key Partners
- Sustainability consultancies (referral channel)
- Certification bodies (data integration potential)
- EU regulatory bodies (standards compliance)
- Cloud infrastructure providers (Vercel, Railway/AWS)

### Cost Structure
- Engineering salaries (largest cost)
- Cloud hosting and infrastructure
- Sales and marketing
- Regulatory/legal advisory
- Customer support

---

## Why Now

Three forces are converging that make this the right moment:

1. **Regulatory pressure is accelerating.** The EU's ESPR framework and DPP requirements begin taking effect from 2026–2028. Brands that are not prepared face fines, retailer delistings, and lost market access. The deadline is real and approaching.

2. **SMEs are underserved.** Enterprise compliance platforms have existed for years, but they were built for companies with 10,000+ suppliers and million-pound budgets. The thousands of brands with 50–500 suppliers have had nowhere to turn.

3. **Data is becoming mandatory, not optional.** Retailers like Zalando, ASOS, and H&M are already requiring supplier transparency data from their brand partners. This is not just about regulation — it is about staying on the shelf.

---

## Why Us

- **Built for the gap:** We are not building a stripped-down enterprise tool or a dressed-up spreadsheet. We are building the right tool for the right customer — from scratch.
- **Fast to value:** A brand should go from sign-up to a meaningful compliance dashboard within one working day, without consultants or IT involvement.
- **Modern technology:** Built with the same stack and design standards used by the best modern SaaS products — fast, clean, and reliable.
- **Regulatory-first architecture:** The data model was designed around EU compliance requirements from day one, not retrofitted.

---

## What's Built Today

The platform is live and functional with:

- User registration, authentication, and organisation setup
- Full supplier management with types, risk levels, status tracking, and contacts
- Document type configuration and document upload/review workflow
- Automated document expiry detection and notification system
- Product management with SKU tracking and product-to-supplier mapping
- Compliance dashboard with real-time scores and risk indicators
- Digital Product Passport (DPP) generation
- EPR export functionality
- CSV import and export for suppliers and products
- Global search across suppliers, products, and documents
- CRM module with supplier relationship tracking
- Team management with role-based access (Owner, Admin, User, Viewer)
- Full settings suite (profile, organisation, security, notifications, integrations)

**Live at:** [nexaloop.vercel.app](https://nexaloop.vercel.app)

---

## Growth Strategy: Free EPR Calculator as Lead Magnet

We have built a standalone **EU EPR Fee Calculator** — a free, no-account-needed tool that lets fashion brands calculate their quarterly Refashion eco-contribution fees in minutes instead of spending hours in spreadsheets.

**Why this matters for the business model:**

This follows the proven **freemium funnel** pattern (LinkedIn, HubSpot, Calendly):

1. **Free tool on the public website** — Compliance managers searching for "EU EPR calculator" or "Refashion fee calculator" find our tool, use it, and see the N.E.X.A Loop brand
2. **Email capture** — After calculating, users can opt in for quarterly reminders
3. **Conversion to platform** — A clear CTA leads users from the free calculator to the full compliance platform
4. **Premium upgrade** — Inside the dashboard, an enhanced EPR module auto-fills from existing product/supplier data, saves calculations over time, and tracks quarterly trends

This creates a virtuous cycle: the free tool builds brand recognition and trust at zero marginal cost, captures the exact right audience, and funnels them toward the paid platform where data gravity creates high switching costs.

---

## What's Next

### Near-term (next 3 months)
- Integrate EPR calculator on the public homepage as a lead generation tool
- Supplier self-service portal (suppliers upload their own documents)
- Audit pack generator (one-click ZIP download of all approved documents per supplier)
- Advanced compliance analytics and trend reporting
- Email notification delivery for document expiry reminders

### Medium-term (3–6 months)
- Enhanced EPR module inside the dashboard (auto-fills from product data, quarterly history)
- Multi-language support (starting with French, German, Italian)
- Mobile-responsive optimisation
- API access for enterprise customers
- Bulk document operations and batch review workflows

### Long-term (6–12 months)
- Supplier network effect (cross-brand document reuse)
- Marketplace integrations (Shopify, Zalando, ASOS)
- AI-powered document classification and data extraction
- Carbon footprint estimation based on supply chain data

---

## The Ask

We are looking for:

1. **Early testers** — Fashion brands willing to use the platform with real supplier data and give us feedback on what works and what's missing.

2. **Design partners** — Compliance managers who will work closely with us to shape the product roadmap based on their day-to-day pain points.

3. **Investment** — Seed funding to accelerate development, hire the core team, and acquire our first 50 paying customers.

---

*N.E.X.A Loop — Supply chain compliance, simplified.*
