# Architecture Decision Records (ADR)
## BeliBeli — Multi-Seller Marketplace

**Versi:** 1.0  
**Tanggal:** 4 Mei 2026  

---

## Format ADR

Setiap ADR mencakup:
- **Konteks** — masalah yang perlu diselesaikan
- **Keputusan** — pilihan yang diambil
- **Alasan** — mengapa pilihan ini dipilih
- **Alternatif** — apa yang dipertimbangkan tapi tidak dipilih
- **Konsekuensi** — dampak positif & negatif dari keputusan ini

---

## ADR-001: SvelteKit sebagai Frontend Framework

**Status:** Diterima  
**Tanggal:** 4 Mei 2026

### Konteks
Diperlukan frontend framework untuk marketplace yang memiliki dua karakteristik berbeda:
1. **Halaman publik** (produk, kategori, toko) — membutuhkan SEO dan first load yang cepat
2. **Halaman interaktif** (dashboard, cart, checkout) — membutuhkan SPA experience

### Keputusan
Menggunakan **SvelteKit 2.x** sebagai satu-satunya frontend framework.

### Alasan
- **Performa unggul**: Svelte dikompilasi ke vanilla JavaScript — tidak ada Virtual DOM runtime, bundle size lebih kecil dibanding React/Vue. Ini menjadi alasan utama Tokopedia memilih Svelte
- **SSR + CSR hybrid built-in**: SvelteKit mendukung SSR per-route secara native, tanpa konfigurasi rumit
- **Reactivity tanpa boilerplate**: Tidak perlu `useState`, `useEffect`, Vuex, dll — reactive declarations cukup sederhana
- **Adapter fleksibel**: Dapat di-deploy ke Vercel, Cloudflare Pages, atau Node.js dengan adapter yang sesuai
- **Ekosistem shadcn-svelte**: Tersedia komponen UI berkualitas tinggi

### Alternatif yang Dipertimbangkan
| Framework | Alasan Tidak Dipilih |
|-----------|---------------------|
| **Next.js (React)** | Bundle lebih besar (React runtime ~130KB), Virtual DOM overhead, lebih boros untuk solo dev |
| **Nuxt (Vue)** | Mirip SvelteKit tapi ekosistem lebih kecil dan performa sedikit di bawah Svelte |
| **Astro** | Sangat baik untuk static/content site, tapi kurang optimal untuk highly-interactive pages (cart, dashboard seller) |

### Konsekuensi
- (+) Bundle size lebih kecil → load time lebih cepat
- (+) Less boilerplate → produktivitas lebih tinggi untuk solo dev
- (-) Ekosistem komponen UI lebih kecil dari React (mitigasi: shadcn-svelte)
- (-) Developer baru perlu belajar Svelte syntax (tapi kurvanya pendek)

---

## ADR-002: Fastify sebagai Backend API Framework

**Status:** Diterima  
**Tanggal:** 4 Mei 2026

### Konteks
Diperlukan backend framework TypeScript yang performan untuk menangani request dari frontend SvelteKit, dengan kebutuhan:
- Type safety yang baik
- Ekosistem plugin yang cukup (JWT, multipart, rate-limit)
- Dokumentasi API otomatis
- Mudah di-maintain oleh solo developer

### Keputusan
Menggunakan **Fastify 5.x** dengan TypeScript.

### Alasan
- **Performa**: Fastify secara konsisten ~2x lebih cepat dari Express dalam benchmark resmi (~30.000 req/s vs ~15.000 req/s)
- **TypeScript-first**: Dukungan TypeScript jauh lebih native dari Express
- **Plugin ecosystem resmi**: `@fastify/jwt`, `@fastify/multipart`, `@fastify/swagger`, `@fastify/cors`, `@fastify/rate-limit`
- **JSON Schema validation built-in**: Request/response validation tanpa library tambahan (atau dengan Zod via plugin)
- **Auto-generated API docs**: `@fastify/swagger` + `@fastify/swagger-ui` gratis
- **Lifecycle hooks**: Sangat mudah menambah logic di `preHandler`, `onRequest`, dsb

### Alternatif yang Dipertimbangkan
| Framework | Alasan Tidak Dipilih |
|-----------|---------------------|
| **Express.js** | Paling populer, tapi TypeScript support tidak native, lebih lambat, tidak ada schema validation bawaan, arsitektur lama (2010) |
| **Hono** | Ultra-fast, TypeScript-first, edge-compatible — tapi ekosistem lebih kecil, jumlah plugin resmi lebih sedikit, lebih cocok untuk edge functions daripada API server penuh |
| **NestJS** | Full-featured, Angular-like, bagus untuk tim besar — tapi *over-engineered* untuk solo dev, steep learning curve, boilerplate tinggi |
| **Elysia (Bun)** | Sangat cepat, tapi memerlukan Bun runtime yang belum sebattle-tested Node.js untuk produksi |

### Konsekuensi
- (+) Response time lebih cepat untuk operasi bervolume tinggi
- (+) Type safety end-to-end dengan TypeScript
- (+) Plugin system yang bersih dan testable
- (-) Dokumentasi Fastify lebih sedikit dari Express (tapi berkualitas)
- (-) Beberapa library third-party dibuat khusus untuk Express dan perlu adapter

---

## ADR-003: Prisma sebagai ORM

**Status:** Diterima  
**Tanggal:** 4 Mei 2026

### Konteks
Diperlukan cara untuk berinteraksi dengan PostgreSQL yang type-safe, mudah di-maintain, dan memiliki tooling migrasi yang baik.

### Keputusan
Menggunakan **Prisma 6.x**.

### Alasan
- **Type-safe auto-generated client**: Setiap query di-infer tipe dari schema — error database tertangkap saat compile-time
- **Declarative schema**: `schema.prisma` mudah dibaca, menjadi "sumber kebenaran" untuk database
- **Migration CLI yang intuitif**: `prisma migrate dev` dan `prisma migrate deploy` — simple dan reliable
- **Prisma Studio**: GUI visual untuk inspect dan edit data selama development
- **Relasi otomatis**: Relasi tabel tergenerate otomatis di tipe TypeScript
- **Paling cocok untuk solo dev** karena DX (Developer Experience) yang sangat baik

### Alternatif yang Dipertimbangkan
| ORM | Alasan Tidak Dipilih |
|-----|---------------------|
| **Drizzle ORM** | Lebih ringan dan lebih cepat dari Prisma, type-safe, SQL-like API — tapi DX lebih rendah, ekosistem lebih baru, migrasi kurang mature. Kandidat kuat untuk v2 jika Prisma terasa lambat |
| **TypeORM** | Mature tapi dekorator-based (experimental di TypeScript), banyak issue di TypeScript strict mode, kurang reliable untuk relasi kompleks |
| **Kysely** | Query builder type-safe yang sangat baik, tapi tidak ada ORM layer (perlu tulis migration manual) |
| **Raw SQL (postgres.js)** | Performa maksimal, tapi tidak type-safe, verbose, dan tidak ada migration tooling built-in |

### Konsekuensi
- (+) Produktivitas tinggi — type safety + Prisma Studio
- (+) Migrasi database terkelola dengan baik
- (-) Prisma Client sedikit lebih lambat dari raw query untuk operasi sangat kompleks
- (-) N+1 problem bisa terjadi jika tidak hati-hati (mitigasi: gunakan `include` dan `select` dengan bijak)
- **Catatan**: Untuk query agregasi kompleks, gunakan `prisma.$queryRaw` atau `prisma.$executeRaw`

---

## ADR-004: PostgreSQL 16 sebagai Database Utama

**Status:** Diterima  
**Tanggal:** 4 Mei 2026

### Konteks
E-commerce marketplace membutuhkan database yang:
- Mendukung transaksi ACID (pesanan, pembayaran, stok)
- Mampu menangani relasi kompleks (order → order_shops → items)
- Memiliki kemampuan pencarian teks yang cukup untuk MVP

### Keputusan
Menggunakan **PostgreSQL 16** sebagai satu-satunya database.

### Alasan
- **ACID Compliance**: Transaksi finansial memerlukan jaminan konsistensi penuh — PostgreSQL menyediakan ini secara native
- **Full-Text Search bawaan**: `tsvector` + `tsquery` sudah cukup untuk MVP tanpa perlu Elasticsearch
- **JSONB**: Untuk data semi-structured (`product_snapshot` di order_items, `gateway_response` di payments) tanpa perlu database terpisah
- **Window Functions & CTEs**: Query analitik untuk dashboard seller/admin
- **Dukungan hosting luas**: Supabase, Neon, Railway, Render, AWS RDS — semua tersedia
- **Battle-tested**: Digunakan oleh Shopify, Instagram, dan ribuan platform e-commerce

### Alternatif yang Dipertimbangkan
| Database | Alasan Tidak Dipilih |
|----------|---------------------|
| **MySQL 8** | Kurang powerful (FTS lebih lemah, JSON support lebih terbatas, window functions lebih lambat) |
| **MongoDB** | NoSQL tidak ideal untuk data relasional e-commerce yang memerlukan ACID; relasi many-to-many menjadi kompleks |
| **SQLite** | Sangat bagus untuk development/testing, tapi tidak cocok untuk multi-user production dengan concurrent writes |

### Konsekuensi
- (+) Satu database untuk semua — tidak perlu setup Elasticsearch untuk fase awal
- (+) ACID transactions untuk keamanan transaksi finansial
- (-) Untuk pencarian yang lebih canggih (fuzzy, typo-tolerance), perlu upgrade ke Meilisearch atau Elasticsearch di v2+

---

## ADR-005: Xendit sebagai Payment Gateway (Development/Sandbox)

**Status:** Diterima  
**Tanggal:** 5 Mei 2026  
**Scope:** Development & testing only. Untuk production, review ulang kebutuhan verifikasi bisnis.

### Konteks
Proyek ini berada di fase **development/testing** sehingga memerlukan payment gateway yang:
- Dapat digunakan tanpa verifikasi dokumen bisnis (NPWP, SIUP, dsb) untuk mode sandbox
- Memiliki sandbox environment yang realistis untuk simulate alur pembayaran lengkap
- Developer-friendly dengan dokumentasi yang jelas
- API key sudah tersedia dan aktif

### Keputusan
Menggunakan **Xendit** dalam mode **Sandbox/Development**.

### Alasan
- **Sandbox tanpa verifikasi bisnis**: Akun Xendit sandbox dapat dibuat dan langsung digunakan untuk development tanpa perlu upload dokumen legal perusahaan
- **API key sudah tersedia** di dashboard `dashboard.xendit.co` dengan prefix `xnd_development_...`
- **DX (Developer Experience) terbaik di Indonesia**: API design RESTful yang clean, dokumentasi lengkap dan mudah dipahami, error message yang informatif
- **Coverage metode bayar lengkap di sandbox**: Virtual Account (semua bank utama), e-wallet (OVO, DANA, ShopeePay, LinkAja), QRIS, kartu kredit
- **Webhook mudah di-test**: Xendit menyediakan simulasi notifikasi langsung dari dashboard
- **SDK Node.js resmi**: `xendit-node` mendukung TypeScript secara native
- **Sudah punya akun aktif**: Mempercepat proses development

### Catatan Penting: Sandbox vs Production
| Aspek | Sandbox (Development) | Production |
|-------|----------------------|------------|
| Prefix API Key | `xnd_development_...` | `xnd_production_...` |
| Transaksi nyata | Tidak (simulasi) | Ya |
| Verifikasi bisnis | Tidak perlu | Diperlukan (NPWP, rekening bank, dsb) |
| Webhook URL | Bisa pakai localhost (ngrok) | Harus HTTPS publik |
| Uang masuk | Tidak ada | Dana masuk ke rekening |

> **Untuk fase production di masa depan:** Perlu submit dokumen bisnis ke Xendit (KTP, NPWP jika ada, nomor rekening) sebelum mengaktifkan mode production. Ini adalah proses normal untuk semua payment gateway Indonesia.

### Alternatif yang Dipertimbangkan
| Gateway | Alasan Tidak Dipilih |
|---------|---------------------|
| **Midtrans** | Sama-sama bagus, tapi DX API sedikit lebih verbose; Xendit dipilih karena akun sudah ada |
| **Doku** | Enterprise-focused, sandbox lebih terbatas |
| **Stripe** | Tidak support VA Bank dan e-wallet lokal Indonesia secara native |

### Konsekuensi
- (+) Development dapat langsung dimulai tanpa hambatan administrasi
- (+) Simulasi pembayaran yang realistis via dashboard Xendit
- (+) Abstraksi service layer memudahkan migrasi ke mode production atau gateway lain
- (-) Mode production memerlukan verifikasi bisnis sebelum dapat menerima dana nyata
- (-) Perlu ganti API key dari `development` ke `production` saat go-live (hanya perubahan environment variable)

---

## ADR-006: Local File Storage untuk Development

**Status:** Diterima  
**Tanggal:** 5 Mei 2026  
**Scope:** Development only. Akan di-replace dengan cloud storage (Cloudflare R2 atau S3) saat production.

### Konteks
Proyek berada di fase **development** — tidak diperlukan cloud storage yang membutuhkan registrasi akun external. File gambar (produk, avatar, review) perlu disimpan dan dapat diakses via URL selama development.

### Keputusan
Menggunakan **Local File Storage** — file disimpan di disk server (`/uploads/`) dan disajikan via Fastify static file plugin.

### Implementasi
```
Apps/api/
└── uploads/              ← folder storage (di-gitignore)
    ├── products/         ← gambar produk
    ├── avatars/          ← foto profil
    ├── shops/            ← logo & banner toko
    └── reviews/          ← foto review
```
- File diakses via: `http://localhost:3000/uploads/products/<filename>`
- Fastify: `@fastify/static` untuk serve file
- Fastify: `@fastify/multipart` untuk handle upload
- Nama file: UUID + ekstensi original untuk menghindari collision

### Alasan
- **Zero setup**: Tidak perlu akun cloud, API key, atau konfigurasi bucket
- **Instant feedback**: File tersedia langsung setelah upload, tidak ada network latency
- **Tidak memerlukan koneksi internet** untuk development
- **Folder uploads di-gitignore**: File tidak ikut ter-commit ke repository

### Strategi Migrasi ke Production
Karena storage logic di-abstrak ke satu service (`StorageService`), migrasi ke Cloudflare R2 hanya perlu ubah implementasi service tersebut:

```typescript
// development: LocalStorageService
// production:  R2StorageService (implements same interface)
interface StorageService {
  upload(file: Buffer, key: string, mimeType: string): Promise<string>
  delete(key: string): Promise<void>
  getPublicUrl(key: string): string
}
```

Migrasi production tidak membutuhkan perubahan di route/controller — hanya swap implementasi via dependency injection.

### Alternatif yang Dipertimbangkan
| Storage | Alasan Tidak Dipilih untuk Development |
|---------|----------------------------------------|
| **Cloudflare R2** | Memerlukan akun Cloudflare dan konfigurasi bucket — overhead tidak perlu untuk development |
| **MinIO (Docker)** | Alternatif bagus tapi menambah satu container Docker yang tidak esensial saat ini |
| **AWS S3** | Memerlukan kartu kredit untuk registrasi AWS |

### Konsekuensi
- (+) Development dapat berjalan sepenuhnya offline
- (+) Setup nol — langsung pakai
- (-) File hilang jika folder `uploads/` dihapus (ini diharapkan di development)
- (-) Tidak scalable untuk production — harus diganti sebelum go-live
- **Tidak ada dampak pada kode bisnis** berkat abstraksi `StorageService`

---

## ADR-007: Redis untuk Caching & Session

**Status:** Diterima  
**Tanggal:** 4 Mei 2026

### Konteks
Beberapa data memerlukan akses cepat dengan TTL yang jelas:
- OTP / email verification token (TTL 10-60 menit)
- Rate limiting counters
- Refresh token blacklist (setelah logout)

### Keputusan
Menggunakan **Redis** (Upstash untuk produksi, Redis Docker untuk development).

### Alasan
- **In-memory, sangat cepat**: Ideal untuk operasi yang sering dilakukan
- **TTL native**: Setiap key dapat di-set expire otomatis
- **Upstash**: Serverless Redis — bayar per request, tidak ada biaya idle, setup dalam hitungan menit
- **Ekosistem luas**: Library `ioredis` dan `@upstash/redis` mature dan well-maintained

### Konsekuensi
- (+) OTP dan token validation sangat cepat
- (+) Rate limiting akurat tanpa query ke database
- (-) Menambah satu komponen infrastruktur
- (-) Data di Redis tidak persistent by default (untuk OTP ini justru diinginkan)

---

## ADR-008: pnpm Workspaces sebagai Monorepo Tool

**Status:** Diterima  
**Tanggal:** 4 Mei 2026

### Konteks
Proyek memiliki beberapa sub-package (`apps/web`, `apps/api`, `packages/db`, `packages/shared`) yang perlu di-manage dalam satu repository.

### Keputusan
Menggunakan **pnpm workspaces** native (tanpa Turborepo atau Nx).

### Alasan
- **Simplisitas**: Untuk solo dev dengan 2 apps dan 2 packages, tool build orchestration seperti Turborepo atau Nx adalah overkill
- **Efisiensi disk**: pnpm menggunakan content-addressable store + symlinks — tidak duplikasi `node_modules`
- **Cepat**: pnpm install secara konsisten 2x lebih cepat dari npm
- **Native workspace support**: Tidak butuh plugin tambahan
- **Dapat upgrade ke Turborepo** kapan saja jika build time menjadi bottleneck

### Alternatif yang Dipertimbangkan
| Tool | Alasan Tidak Dipilih |
|------|---------------------|
| **Turborepo** | Powerful untuk caching build tasks, tapi overkill untuk proyek kecil dan menambah konfigurasi |
| **Nx** | Terlalu heavy dan opinionated untuk kebutuhan ini |
| **npm/yarn workspaces** | Lebih lambat dari pnpm, lebih boros disk |

### Konsekuensi
- (+) Setup minimal, langsung bisa kerja
- (+) Efisiensi disk dan install time
- (-) Tidak ada build caching otomatis (mitigasi: tambah Turborepo nanti jika diperlukan)

---

## ADR-009: Monolith Modular sebagai Pendekatan Arsitektur

**Status:** Diterima  
**Tanggal:** 4 Mei 2026

### Konteks
Perlu memilih antara Monolith, Microservices, atau pendekatan hybrid untuk arsitektur backend.

### Keputusan
Menggunakan **Monolith Modular** — satu Fastify server dengan domain modules yang terpisah jelas.

### Alasan
- **Solo developer**: Microservices memerlukan DevOps yang signifikan (service discovery, inter-service communication, distributed tracing) — sangat tidak efisien untuk satu orang
- **Kompleksitas awal rendah**: Monolith jauh lebih mudah di-debug, deploy, dan monitor
- **Modular by design**: Dengan memisahkan kode per domain (`/modules/auth`, `/modules/orders`, dll), migrasi ke microservice di masa depan tetap feasible
- **YAGNI principle**: "You Aren't Gonna Need It" — tidak perlu microservices sebelum ada traffic yang membuktikan kebutuhan tersebut

### Konsekuensi
- (+) Deployment sederhana (satu container)
- (+) Debugging mudah (satu log stream)
- (+) Tidak ada network latency antar service
- (-) Jika skala sangat besar, satu module bisa menjadi bottleneck untuk module lain
- (-) Deploy seluruh aplikasi untuk setiap perubahan (mitigasi: CI/CD pipeline yang cepat)
