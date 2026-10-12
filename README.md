# San Felipe LGU Digital Portal & Multi-Office CMS

Official digital portal and multi-office Content Management System for the **Municipal Government of San Felipe, Zambales, Philippines**.

---

## 1. Project Purpose & Overview

This system provides a modern, accessible, and transparent digital presence for the Municipality of San Felipe while establishing a secure, multi-departmental administrative portal for municipal staff.

It combines two connected applications:
1. **Public Municipal Website**: Open civic portal delivering municipal announcements, public advisories, citizen services guides, department listings, and transparency compliance documents (Full Disclosure, Annual Budgets, BAC Procurement, Ordinances).
2. **Secure Staff CMS**: Authenticated multi-office portal for municipal employees to draft, review, approve, and publish content scoped to their respective departments.

---

## 2. Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **UI & Styling**: React 19, Tailwind CSS v4, Lucide Icons
- **Forms & Validation**: React Hook Form, Zod
- **Database**: PostgreSQL 16 (Docker Compose for local development)
- **ORM**: Prisma ORM
- **Password Hashing**: Argon2id (`@node-rs/argon2`)
- **Authorization**: Granular Role-Based Access Control (RBAC) with office-level ownership scoping

---

## 3. Project & Route Architecture

```text
SFZ-WEBSITE/
├── docker-compose.yml          # PostgreSQL 16 dev container (port 5435)
├── .env.example                # Documented configuration template
├── prisma/
│   ├── schema.prisma           # Core models: Office, User, Role, Permission, RolePermission
│   └── seed.ts                 # Idempotent seed for baseline roles, permissions, ICT office, admin
├── src/
│   ├── app/
│   │   ├── (public)/           # Public municipal portal (no authentication required)
│   │   │   ├── layout.tsx      # GovPH top bar, header, navigation, footer
│   │   │   └── page.tsx        # Base homepage verifying civic layout and tokens
│   │   ├── (auth)/
│   │   │   └── staff/login/    # Staff CMS login (Zod validation, legal notice)
│   │   └── (cms)/
│   │       └── admin/          # Authenticated multi-office CMS (deny-by-default)
│   ├── components/
│   │   ├── auth/               # LoginForm component
│   │   ├── layout/             # TopBar, Header, Navigation, Footer, Container, PageHeader
│   │   └── ui/                 # Reusable buttons, inputs, labels, checkboxes, badges
│   ├── config/
│   │   └── site.ts             # Site metadata and navigation configuration
│   ├── lib/
│   │   ├── utils.ts            # Class merging utility (clsx + twMerge)
│   │   └── validation/         # Zod schemas (auth.ts)
│   └── server/
│       ├── audit/              # Audit action constants
│       ├── auth/               # Argon2id hashing and session interfaces
│       ├── authz/              # requireUser(), requirePermission(), requireOfficeAccess()
│       └── db/                 # Prisma client singleton (server-only)
```

---

## 4. Local Development Setup

### Prerequisites
- Node.js 20+ (v22 recommended)
- npm 10+
- Docker & Docker Compose

### Step 1: Clone and Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Key configuration items:
- `DATABASE_URL`: Defaults to `postgresql://sfz_portal_user:sfz_portal_dev_pass_2026@localhost:5435/sfz_portal_db?schema=public`
- `SEED_SUPERADMIN_EMAIL`: Email for the initial bootstrap administrator.
- `SEED_SUPERADMIN_PASSWORD`: Strong password (minimum 12 characters).

### Step 3: Start Local PostgreSQL Database
```bash
docker compose up -d
```
The database runs on port **5435** to avoid conflicts with any PostgreSQL instances on host port 5432.

### Step 4: Run Prisma Migration & Seed
```bash
npm run db:migrate -- --name init_identity_and_offices
npm run db:seed
```

### Step 5: Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Launch Next.js development server |
| `npm run build` | Generate production build |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint checks |
| `npm run typecheck` | Run TypeScript type checks (`tsc --noEmit`) |
| `npm run db:migrate` | Apply Prisma schema migrations |
| `npm run db:seed` | Execute idempotent database seeding |
| `npm run db:generate` | Generate Prisma client types |

---

## 6. Security & Authorization Architecture

- **Deny-by-Default**: Every administrative operation requires an explicit, active user session.
- **Permission-Based**: Authorization verifies specific granular permissions (`posts.create`, `documents.approve`, etc.), not hardcoded role names.
- **Office Scoping**: Staff members without system scope (`isSystemScope: false`) can only modify resources assigned to their specific municipal office (`requireOfficeAccess(officeId)`).
- **Password Security**: Modern Argon2id hashing with OWASP-recommended parameters (19 MiB memory, 2 iterations, 1 parallelism).
- **No Insecure Mocks**: Phase 1 staff login strictly rejects mock authentications until Phase 2 HttpOnly sessions are activated.
