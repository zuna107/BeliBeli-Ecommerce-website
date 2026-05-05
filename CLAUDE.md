# BeliBeli — Project Context for AI Assistants

> Baca file ini sebelum menyentuh kode apapun. Ini adalah sumber kebenaran tunggal untuk konvensi proyek.

---

## 1. Gambaran Proyek

**BeliBeli** adalah platform e-commerce multi-seller berbasis web yang terinspirasi dari Tokopedia (tata letak/UX) dan Blibli (color scheme: biru `#0095DA`). Ini proyek solo development, scope saat ini adalah **development/sandbox only** — belum ada production deployment.

- **Nama domain**: beibeli.com (konseptual, belum dibeli)
- **Model bisnis**: Marketplace multi-seller — buyer membeli dari berbagai toko dalam satu checkout
- **Stack**: SvelteKit 2 (frontend) + Fastify 5 TypeScript (API) + PostgreSQL 16 + Redis
- **Monorepo**: pnpm workspaces

---

## 2. Struktur Direktori

```
BeliBeli/
├── apps/
│   ├── web/          # SvelteKit 2 — Frontend
│   └── api/          # Fastify 5 TypeScript — Backend API
│       └── uploads/  # File storage lokal (development)
│           ├── products/
│           ├── avatars/
│           ├── shops/
│           └── reviews/
├── packages/
│   ├── db/           # Prisma schema + generated client
│   └── shared/       # Zod schemas, TypeScript types, constants
├── docs/             # Semua dokumentasi proyek
├── docker-compose.yml
├── .env              # JANGAN commit
├── .env.example
├── pnpm-workspace.yaml
└── CLAUDE.md         # File ini
```

---

## 3. Commands

```bash
# Development
pnpm dev              # Jalankan web + api bersamaan (dari root)
pnpm dev --filter web # Hanya frontend
pnpm dev --filter api # Hanya backend

# Database
pnpm db:migrate       # prisma migrate dev
pnpm db:studio        # Buka Prisma Studio di localhost:5555
pnpm db:seed          # Seed data dummy
pnpm db:reset         # Drop + recreate + seed (HATI-HATI)

# Build
pnpm build            # Build semua packages
pnpm build --filter web
pnpm build --filter api

# Type checking
pnpm typecheck        # tsc --noEmit semua packages

# Lint & Format
pnpm lint             # ESLint
pnpm format           # Prettier

# Docker (infrastruktur lokal)
docker compose up -d           # Jalankan PostgreSQL + Redis + Mailhog
docker compose down            # Stop semua
docker compose logs mailhog    # Lihat log Mailhog

# Ngrok (untuk webhook testing)
ngrok http 3000       # Jalankan di terminal terpisah — dapat URL public untuk Xendit webhook
```

---

## 4. Tech Stack Detail

| Layer | Teknologi | Versi | Catatan |
|-------|-----------|-------|---------|
| Frontend | SvelteKit | 2.x | SSR untuk halaman publik, CSR untuk dashboard |
| UI Components | shadcn-svelte + Tailwind CSS | latest | Color: `primary` = `#0095DA` (Blibli-inspired) |
| Backend | Fastify | 5.x | TypeScript-native |
| ORM | Prisma | 6.x | Schema di `packages/db/prisma/schema.prisma` |
| Database | PostgreSQL | 16 | Docker lokal |
| Cache | Redis | 7.x | Docker lokal — OTP, rate limit, session |
| Auth | JWT + Refresh Token | - | Access: 15m (memory/header), Refresh: 7d (httpOnly cookie) |
| Validasi | Zod | 3.x | Dipakai di frontend DAN backend via `packages/shared` |
| File Storage | Local disk `/uploads` | - | Dev only — abstraksi `StorageService` untuk future swap ke R2 |
| Payment | Xendit Sandbox | - | SDK: `xendit-node`, env: `xnd_development_...` |
| Shipping | Komerce API Sandbox | - | Ongkir multi-kurir |
| Email | Mailhog (Docker) | - | SMTP localhost:1025, UI di localhost:8025 |

---

## 5. Konvensi Kode

### Backend (Fastify)

```
apps/api/src/
├── app.ts              # Entry point, register plugins
├── plugins/            # Fastify plugins (prisma, jwt, cors, rate-limit, etc.)
├── modules/            # Domain modules
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.service.ts
│   │   └── auth.schema.ts    # Zod schemas untuk request/response
│   ├── products/
│   ├── orders/
│   └── ...
├── middleware/          # Global middleware
└── types/               # TypeScript augmentation (FastifyRequest, etc.)
```

**Naming conventions:**
- File: `kebab-case.ts`
- Class/Type/Interface: `PascalCase`
- Function/variable: `camelCase`
- Env variable: `UPPER_SNAKE_CASE`
- Database column: `snake_case` (Prisma)
- API route: `kebab-case` (`/order-items`, bukan `/orderItems`)

**Error handling:** Gunakan `reply.status(4xx).send({ error: 'pesan', code: 'ERROR_CODE' })`  
**Semua route terproteksi JWT kecuali** diberi `config: { skipAuth: true }`

### Frontend (SvelteKit)

```
apps/web/src/
├── routes/             # File-based routing
│   ├── (public)/       # Layout publik (tidak perlu login)
│   │   ├── +layout.svelte
│   │   ├── +page.svelte       # Homepage
│   │   ├── login/+page.svelte
│   │   └── p/[slug]/          # Halaman produk
│   ├── (auth)/         # Layout yang butuh login (buyer)
│   │   ├── cart/
│   │   └── orders/
│   └── seller/         # Dashboard seller
├── lib/
│   ├── components/     # Komponen reusable
│   ├── stores/         # Svelte stores (cart, auth, etc.)
│   ├── api/            # Fetch wrappers untuk API calls
│   └── utils/          # Helper functions
└── app.html
```

**Rendering strategy:**
- `+page.server.ts` → SSR (halaman produk, homepage — untuk SEO)
- `+page.ts` dengan `export const ssr = false` → CSR (dashboard, cart)

---

## 6. Database Quick Reference

- **Prisma schema:** `packages/db/prisma/schema.prisma`
- **ERD lengkap:** `docs/ERD.md`
- **Pola penting:**
  - `order_items.product_snapshot` → JSONB, snapshot harga/nama produk saat checkout (immutable)
  - `payments.gateway_response` → JSONB, raw response dari Xendit webhook
  - `order_shops` → sub-order per toko dalam satu order multi-seller
  - Semua tabel punya `created_at`, `updated_at` (auto-managed Prisma)

---

## 7. Integrasi Third-Party (Development)

Panduan lengkap: `docs/Integration-Guide.md`

| Service | Env Var Utama | Catatan |
|---------|--------------|---------|
| Xendit | `XENDIT_SECRET_KEY`, `XENDIT_WEBHOOK_TOKEN` | Sandbox: `xnd_development_...` |
| Komerce | `KOMERCE_API_KEY` | Dari collaborator.komerce.id |
| Mailhog | `SMTP_HOST=localhost`, `SMTP_PORT=1025` | Docker, UI di :8025 |
| ngrok | - | `ngrok http 3000` — untuk webhook Xendit |

---

## 8. Dokumen Penting

| Dokumen | Isi |
|---------|-----|
| `docs/PRD-Ecommerce.md` | Daftar lengkap fitur — referensi sebelum buat endpoint baru |
| `docs/ERD.md` | Skema database + Mermaid diagram — referensi sebelum touch Prisma schema |
| `docs/API-Contract.md` | Semua endpoint REST + request/response contoh |
| `docs/Architecture.md` | Diagram sistem + alur checkout + alur upload |
| `docs/ADR.md` | Keputusan arsitektur + alasan pemilihan teknologi |
| `docs/UserStories.md` | User stories dengan acceptance criteria |
| `docs/Roadmap.md` | 4-phase roadmap — cek sebelum buat fitur baru |
| `docs/Integration-Guide.md` | Setup + kode contoh untuk Xendit, Komerce, Mailhog, ngrok |
| `docs/Design-System.md` | Color palette, tipografi, komponen UI inventory |

---

## 9. Hal yang JANGAN Dilakukan

- **Jangan** commit `.env` ke Git
- **Jangan** hardcode API key di kode — selalu pakai `process.env.XXX`
- **Jangan** ubah `product_snapshot` di `order_items` setelah order dibuat — ini intentionally immutable
- **Jangan** langsung update stok tanpa validasi concurrency (gunakan Prisma transaction + `SELECT FOR UPDATE`)
- **Jangan** pake `any` di TypeScript kecuali untuk raw Xendit/Komerce webhook body yang belum di-type
- **Jangan** tambah fitur yang tidak ada di PRD tanpa diskusi terlebih dahulu
- **Jangan** deploy ke production — scope ini development saja

---

## 10. Alur Development Baru (Cara Buat Fitur)

```
1. Cek PRD (docs/PRD-Ecommerce.md) → apakah fitur ada di scope?
2. Cek ERD (docs/ERD.md)          → apakah perlu tabel baru?
3. Cek API Contract (docs/API-Contract.md) → apakah endpoint sudah didefinisikan?
4. Tulis Prisma migration jika perlu perubahan skema
5. Buat Zod schema di packages/shared
6. Buat route + service di apps/api/src/modules/<domain>/
7. Buat UI di apps/web/src/routes/
8. Test manual dengan Mailhog, Xendit sandbox, ngrok jika perlu
```
