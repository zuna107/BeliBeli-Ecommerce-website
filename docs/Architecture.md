# System Architecture Document
## BeliBeli — Multi-Seller Marketplace

**Versi:** 1.0  
**Tanggal:** 4 Mei 2026  

---

## 1. Gambaran Umum

BeliBeli menggunakan arsitektur **Monolith Modular** dengan pemisahan domain yang jelas antara frontend, backend, dan data layer. Pendekatan ini dipilih untuk efisiensi pengembangan solo developer sekaligus memudahkan transisi ke microservice di masa depan jika diperlukan.

**Prinsip desain:**
- **Separation of Concerns** — setiap modul bertanggung jawab atas domain-nya sendiri
- **API-first** — frontend dan backend berkomunikasi via REST API (memungkinkan mobile app di masa depan)
- **Performance by default** — SSR untuk halaman publik (SEO), CSR untuk halaman interaktif

---

## 2. Diagram Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                              │
│                                                                     │
│  ┌──────────────────────────┐    ┌─────────────────────────────┐   │
│  │   SvelteKit Web App      │    │   Admin Panel               │   │
│  │   (SSR + CSR)            │    │   SvelteKit /admin/*        │   │
│  │                          │    │                             │   │
│  │  - Halaman publik (SSR)  │    │  - Dashboard statistik      │   │
│  │  - Dashboard buyer       │    │  - Manajemen user/produk    │   │
│  │  - Dashboard seller      │    │  - Moderasi konten          │   │
│  └────────────┬─────────────┘    └────────────┬────────────────┘   │
└───────────────┼──────────────────────────────┼─────────────────────┘
                │ HTTPS                         │ HTTPS
┌───────────────▼──────────────────────────────▼─────────────────────┐
│                     CDN / REVERSE PROXY                             │
│                  (Cloudflare + Nginx)                               │
│                                                                     │
│  - TLS termination           - Static asset caching                │
│  - DDoS protection           - Rate limiting (edge)                │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                          API LAYER                                  │
│                    Fastify 5.x (TypeScript)                         │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │  /auth   │ │  /users  │ │  /shops  │ │/products │ │  /cart   │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ /orders  │ │/payments │ │ /reviews │ │  /notif  │ │  /admin  │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│                                                                     │
│  Plugins: @fastify/jwt | @fastify/multipart | @fastify/swagger      │
│           @fastify/cors | @fastify/rate-limit                       │
└───┬───────────────────────────────────────┬───────────────────────┘
    │                                       │
┌───▼──────────────────┐    ┌──────────────▼────────────────────────┐
│    Redis Cache        │    │         External Services             │
│                       │    │                                       │
│  - OTP codes (10m TTL)│    │  ┌──────────┐  ┌──────────────────┐  │
│  - Rate limit counter │    │  │  Xendit  │  │  Nodemailer      │  │
│  - Cart cache         │    │  │ Sandbox  │  │  (SMTP/Mailhog)  │  │
│  - Session metadata   │    │  └──────────┘  └──────────────────┘  │
└───────────────────────┘    │  ┌──────────┐  ┌──────────────────┐  │
                             │  │  Local   │  │  Komerce API     │  │
┌──────────────────────┐     │  │ /uploads │  │  (Ongkir API)    │  │
│   PostgreSQL 16       │     │  └──────────┘  └──────────────────┘  │
│                       │     └───────────────────────────────────────┘
│  - Main data store    │
│  - Full-Text Search   │
│  - JSONB (snapshots)  │
│  Prisma ORM           │
└──────────────────────┘
```

---

## 3. Tech Stack

| Layer | Teknologi | Versi | Alasan |
|-------|-----------|-------|--------|
| **Frontend** | SvelteKit | 2.x | SSR + CSR, bundle kecil, performa tinggi |
| **UI Library** | shadcn-svelte + Tailwind CSS | latest | Komponen siap pakai, design system |
| **Backend** | Fastify | 5.x | ~2x lebih cepat dari Express, TypeScript-first |
| **Language** | TypeScript | 5.x | Type safety end-to-end |
| **ORM** | Prisma | 6.x | Type-safe, migration bagus, Prisma Studio |
| **Database** | PostgreSQL | 16 | ACID, Full-Text Search, JSONB |
| **Cache** | Redis (Docker) | 7.x | Sessions, rate limiting, cart cache |
| **File Storage** | Local Disk (`/uploads`) | - | Zero setup untuk development, abstrak ke R2/S3 saat production |
| **Payment** | Xendit **(Sandbox mode)** | - | Dev-friendly, sandbox tanpa verifikasi bisnis, akun sudah ada |
| **Shipping API** | Komerce API **(Sandbox)** | - | Ongkos kirim multi-kurir, akun sudah ada |
| **Email (dev)** | Mailhog (Docker) | - | Email catcher lokal — tidak perlu akun email eksternal |
| **Monorepo** | pnpm workspaces | 9.x | Efisien, tidak butuh Turborepo untuk solo dev |
| **Validation** | Zod | 3.x | Type-safe schema, dipakai di FE + BE |

---

## 4. Struktur Direktori Proyek

```
beibeli/
├── apps/
│   ├── web/                          # SvelteKit frontend
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── components/       # UI komponen reusable
│   │   │   │   │   ├── ui/           # shadcn-svelte base components
│   │   │   │   │   ├── product/      # ProductCard, ProductGrid, dsb
│   │   │   │   │   ├── order/        # OrderCard, StatusTimeline, dsb
│   │   │   │   │   └── layout/       # Navbar, Footer, Sidebar
│   │   │   │   ├── stores/           # Svelte stores
│   │   │   │   │   ├── auth.ts       # User session store
│   │   │   │   │   ├── cart.ts       # Cart state
│   │   │   │   │   └── notification.ts
│   │   │   │   ├── api/              # API client functions
│   │   │   │   │   ├── client.ts     # Base fetch wrapper
│   │   │   │   │   ├── auth.ts
│   │   │   │   │   ├── products.ts
│   │   │   │   │   └── orders.ts
│   │   │   │   └── utils/            # Helpers (format currency, dsb)
│   │   │   └── routes/
│   │   │       ├── (public)/         # Halaman tanpa auth
│   │   │       │   ├── +page.svelte  # Homepage
│   │   │       │   ├── search/       # Halaman pencarian
│   │   │       │   ├── product/[id]/ # Detail produk
│   │   │       │   └── shop/[slug]/  # Halaman toko
│   │   │       ├── (auth)/           # Halaman auth
│   │   │       │   ├── login/
│   │   │       │   └── register/
│   │   │       ├── (buyer)/          # Halaman buyer (perlu login)
│   │   │       │   ├── cart/
│   │   │       │   ├── checkout/
│   │   │       │   ├── orders/
│   │   │       │   ├── wishlist/
│   │   │       │   └── profile/
│   │   │       ├── (seller)/         # Dashboard seller
│   │   │       │   ├── seller/
│   │   │       │   │   ├── dashboard/
│   │   │       │   │   ├── products/
│   │   │       │   │   └── orders/
│   │   │       └── admin/            # Admin panel
│   │   └── package.json
│   │
│   └── api/                          # Fastify backend
│       ├── src/
│       │   ├── modules/              # Domain modules
│       │   │   ├── auth/
│       │   │   │   ├── auth.routes.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   └── auth.schema.ts
│       │   │   ├── users/
│       │   │   ├── shops/
│       │   │   ├── products/
│       │   │   ├── cart/
│       │   │   ├── orders/
│       │   │   ├── payments/
│       │   │   ├── reviews/
│       │   │   ├── notifications/
│       │   │   └── admin/
│       │   ├── plugins/              # Fastify plugins
│       │   │   ├── auth.plugin.ts    # JWT verify hook
│       │   │   ├── mailer.plugin.ts  # Resend integration
│       │   │   └── storage.plugin.ts # R2/S3 upload
│       │   ├── middleware/
│       │   │   └── role-guard.ts     # Role-based access
│       │   └── app.ts                # Bootstrap Fastify
│       └── package.json
│
├── packages/
│   ├── db/                           # Prisma schema + migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   └── index.ts              # Export PrismaClient
│   │   └── package.json
│   │
│   └── shared/                       # Types & utils bersama
│       ├── src/
│       │   ├── types/                # Shared TypeScript types
│       │   └── constants/            # Shared constants
│       └── package.json
│
├── pnpm-workspace.yaml
├── package.json
└── docker-compose.yml
```

---

## 5. Alur Data Utama

### 5.1 Alur Registrasi & Verifikasi Email
```
1. Buyer POST /auth/register { name, email, password }
2. API: hash password (bcrypt cost 12)
3. API: simpan user (email_verified=false)
4. API: generate token verifikasi → simpan di Redis (TTL 24 jam)
5. API: kirim email via Resend dengan link verifikasi
6. Buyer klik link → GET /auth/verify-email?token=...
7. API: validasi token dari Redis → update email_verified=true
8. User dapat login
```

### 5.2 Alur Checkout & Pembayaran
```
1. Buyer pilih item di keranjang → POST /orders
2. API: validasi stok semua varian
3. API: hitung total (subtotal + ongkir − voucher)
4. API: buat record orders (status: unpaid)
5. API: buat record order_shops + order_items per toko
6. API: kurangi stok product_variants (pessimistic locking)
7. API: buat payment record (status: pending)
8. API: request ke Xendit → buat Invoice atau VA
   - Response: { invoice_url, invoice_id, expiry_date }
9. API: kembalikan { order_id, order_number, invoice_url } ke FE
10. FE: redirect ke Xendit Invoice/payment page
11. User bayar via metode yang dipilih (VA, e-wallet, QRIS, dsb)
12. Xendit: kirim webhook POST ke /payments/webhook
    - Header: x-callback-token (untuk verifikasi)
13. API: verifikasi x-callback-token == XENDIT_WEBHOOK_TOKEN
14. API: cek status di body: "status": "PAID"
15. API: update payment (status: success, xendit_invoice_id)
16. API: update orders (payment_status: paid)
17. API: update order_shops (status: processing)
18. API: kirim notifikasi ke buyer (email + in-app)
19. API: kirim notifikasi ke seller (in-app)
```

### 5.3 Alur Upload Gambar Produk
```
1. Seller pilih file di form
2. FE: POST /upload/image (multipart/form-data)
3. API: validasi MIME type (hanya jpg/png/webp)
4. API: validasi ukuran (maks 5MB)
5. API: generate nama file unik (UUID + ext) → simpan ke /uploads/<type>/<filename>
6. API: kembalikan { url: "http://localhost:3000/uploads/<type>/<filename>", key }
7. FE: simpan URL di state form, tampilkan preview (URL langsung dapat diakses)
8. Saat submit produk → kirim array image_ids

Note: Di production, langkah 5 diganti: upload ke Cloudflare R2 via StorageService
```

### 5.4 Alur Seller Update Status Pesanan
```
1. Seller PATCH /seller/orders/:order_shop_id/status
   { status: "shipped", tracking_number: "JNE123", courier_name: "jne" }
2. API: verifikasi seller adalah pemilik order_shop
3. API: update order_shop (status, tracking_number, courier_name)
4. API: insert order_status_logs
5. API: kirim notifikasi ke buyer (email + in-app)
```

---

## 6. Strategi Autentikasi & Otorisasi

### Authentication Flow (JWT + Refresh Token)
```
Login → access_token (JWT, 15 menit, di memory/header)
      + refresh_token (opaque, 7 hari, di httpOnly cookie)

Request API → kirim access_token di Authorization: Bearer ...
API → verifikasi JWT signature + expiry

Saat access_token expired:
→ POST /auth/refresh (otomatis dari FE)
→ API validasi refresh_token dari cookie
→ Kembalikan access_token baru
```

### Authorization (Role-Based)
| Role | Akses |
|------|-------|
| `buyer` | Browsing, cart, checkout, orders milik sendiri |
| `seller` | + Semua fitur buyer + manajemen toko & produk milik sendiri |
| `admin` | Akses penuh ke semua resource |

---

## 7. Strategi Pencarian Produk

### Fase MVP: PostgreSQL Full-Text Search
```sql
-- Auto-update search_vector via trigger
UPDATE products SET search_vector = 
  to_tsvector('indonesian', name || ' ' || description)

-- Query pencarian
SELECT * FROM products
WHERE search_vector @@ plainto_tsquery('indonesian', $1)
  AND status = 'active'
ORDER BY ts_rank(search_vector, plainto_tsquery('indonesian', $1)) DESC
```

### Fase v2 (Opsional): Upgrade ke Meilisearch
- Lebih relevan untuk fuzzy search, typo tolerance
- Sync dari PostgreSQL via CDC atau background job

---

## 8. Deployment

### Development
```bash
# Jalankan semua services secara concurrent
pnpm dev
# Jalankan Docker services (DB + Redis)
docker compose up -d
```

### Development Stack (Fokus Saat Ini)

> Semua service berjalan lokal. Tidak memerlukan akun cloud apapun kecuali yang sudah dimiliki.

| Service | Tool | Akses |
|---------|------|-------|
| Frontend (SvelteKit) | `pnpm dev` | http://localhost:5173 |
| Backend API (Fastify) | `pnpm dev` | http://localhost:3000 |
| Database (PostgreSQL) | Docker | localhost:5432 |
| Cache (Redis) | Docker | localhost:6379 |
| File Storage | Disk lokal `/uploads` | http://localhost:3000/uploads/... |
| Email (catcher) | Mailhog (Docker) | http://localhost:8025 (UI) |
| Payment | Xendit Sandbox | dashboard.xendit.co |
| Shipping API | Komerce API Sandbox | collaborator.komerce.id |
| Webhook (lokal) | ngrok | ngrok http 3000 |

### Docker Compose (Development)
```yaml
services:
  api:
    build: ./apps/api
    ports: ["3000:3000"]
    env_file: .env
    volumes:
      - ./apps/api/uploads:/app/uploads   # persist uploads
    depends_on: [db, redis]

  web:
    build: ./apps/web
    ports: ["5173:5173"]

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: beibeli_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports: ["5432:5432"]  # expose untuk Prisma Studio

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"  # SMTP (kirim email ke sini)
      - "8025:8025"  # Web UI (lihat email masuk)

volumes:
  pgdata:
```

> **Production stack** (untuk referensi masa depan, belum perlu sekarang):
> Frontend → Cloudflare Pages, API → Railway/Fly.io, DB → Neon, Redis → Upstash, Storage → Cloudflare R2, Email → Resend

---

## 9. Keamanan

| Aspek | Implementasi |
|-------|-------------|
| Autentikasi | JWT (15m) + Refresh Token (7d) di httpOnly cookie |
| Password | bcrypt cost factor 12 |
| Rate Limiting | Auth: 5 req/15min; Global: 100 req/15min |
| Input Validation | Zod schema di semua API endpoint |
| File Upload | Whitelist MIME type + max 5MB per file |
| CORS | Whitelist domain frontend saja |
| SQL Injection | Prisma parameterized queries |
| XSS | SvelteKit auto-escape + DOMPurify untuk rich text |
| Webhook Security | Validasi `x-callback-token` Xendit di setiap webhook request |
| Secrets | Environment variables, tidak pernah commit ke repo |
