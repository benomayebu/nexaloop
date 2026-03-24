# N.E.X.A Loop — Claude Code Master Brief

## What this project is
N.E.X.A Loop is a B2B SaaS supply chain compliance and traceability platform for EU-facing fashion brands. It lets brands centralise supplier data, track compliance documents, map products to suppliers, and generate EU regulatory outputs (ESPR Digital Product Passports, EPR exports).

## Documentation
All reference documents are in /docs/:
- NEXA_Loop_PRD_v1.0.docx         — full product requirements
- NEXA_Loop_AppFlow_v1.0.html     — system architecture + API flows + ERD
- NEXA_Loop_BackendDocs_v1.0.html — NestJS stack, schema, security patterns
- NEXA_Loop_DesignSystem_v1.0.html — UI components, colour tokens, screen designs
- NEXA_Loop_SecurityAudit_v1.0.html — 51 security checks, pre-deploy checklist

## Monorepo structure
nexaloop/
  apps/
    api/    — NestJS 10 + Prisma 5 + PostgreSQL 16
    web/    — Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
  docker-compose.yml
  pnpm-workspace.yaml

## Tech stack (non-negotiable)
- Package manager: pnpm workspaces
- API: NestJS 10, TypeScript strict, Prisma 5, JWT httpOnly cookie auth
- Web: Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, DM Sans font
- DB: PostgreSQL 16
- File uploads: multer memoryStorage, UUID filenames, 20MB limit
- Containerisation: Docker + docker-compose

## Colours / design tokens
- Primary brand: Indigo (#4f46e5 / indigo-600)
- Foundation: Slate scale (slate-900 sidebar, slate-50 backgrounds)
- Status: emerald=approved, amber=warning/expiring, red=rejected/error
- Font: DM Sans (body), DM Mono (code/IDs)
- No purple gradients. No Inter font. Clean data-dense B2B aesthetic.

## Core security rules (apply to every file you write)
1. passwordHash NEVER returned — always call sanitizeUser()
2. orgId ALWAYS from @CurrentOrg() JWT decorator — never from request body
3. reviewedByUserId ALWAYS from @CurrentUser() — never from DTO
4. mimeType ALWAYS from file.mimetype — never from body
5. All Prisma queries use findFirst({ where: { id, orgId } }) — never bare findUnique
6. ValidationPipe: whitelist:true, forbidNonWhitelisted:true, transform:true (global)
7. Soft deletes for Supplier, Product, DocumentType — never .delete()
8. Hard deletes only for Contact and ProductSupplier

## Build phases
- Phase 1: Foundation & Auth (DONE — implement if missing)
- Phase 2: Supplier & Contact management (DONE — implement if missing)
- Phase 3: Document Types & Documents (DONE — implement if missing)
- Phase 4: Products & ProductSupplier (IN PROGRESS — complete this)
- Phase 5: Dashboard aggregation + expiry notifications (BUILD)
- Phase 6: DPP/EPR regulatory outputs (BUILD)

## What I cannot do — flag these for manual action
- Creating GitHub repository secrets
- Running docker compose up for the first time (I'll tell you when)
- Creating AWS S3 bucket and IAM user
- Buying/configuring a domain
- Setting up Vercel/Railway/Render deployment
- Running database migrations for the first time (I'll give you the command)
- Generating and storing the production JWT_SECRET
