# Feature Roadmap
## BeliBeli — Multi-Seller Marketplace

**Versi:** 1.0  
**Tanggal:** 4 Mei 2026  

---

## Ringkasan Fase

| Fase | Nama | Durasi Est. | Fokus |
|------|------|-------------|-------|
| **MVP** | Core Commerce | ~3 bulan | Transaksi end-to-end bisa berjalan |
| **v1.1** | Commerce Plus | ~2 bulan | Fitur kepercayaan & kematangan |
| **v2.0** | Growth | ~2 bulan | Konversi, retensi, dan skala |
| **v3.0** | Scale | Ongoing | Fitur lanjutan & ekspansi |

---

## Matriks Prioritas

```
DAMPAK TINGGI ──────────────────────────────────┐
                                                  │
  [MVP] Auth          [MVP] Pembayaran            │
  [MVP] Produk        [v1.1] Review & Rating      │
  [MVP] Checkout      [v1.1] Notifikasi           │
  [MVP] Orders        [v2.0] Voucher/Promo        │
                                                  │
KOMPLEKSITAS         ─────────────────────────── │
RENDAH                                   TINGGI   │
                                                  │
  [v1.1] Wishlist    [v2.0] Chat                  │
  [v1.1] Follow Shop [v3.0] Flash Sale            │
                     [v3.0] Top Up & Tagihan      │
                                                  │
DAMPAK RENDAH ──────────────────────────────────┘

Rekomendasi:
→ Kerjakan dulu: Dampak Tinggi + Kompleksitas Rendah (MVP)
→ Kerjakan berikutnya: Dampak Tinggi + Kompleksitas Tinggi (v1.1)
→ Tunda: Dampak Rendah atau Sangat Kompleks (v2.0 - v3.0)
```

---

## Fase MVP — Core Commerce (~3 Bulan)

> **Tujuan:** Platform dapat digunakan untuk transaksi end-to-end dari mendaftar → membuka toko → upload produk → beli → bayar → terima barang.

### Sprint 1–2: Foundation (Minggu 1–4)

**Setup & Infrastructure**
- [ ] Inisialisasi monorepo pnpm workspaces
- [ ] Setup package `packages/db` (Prisma + PostgreSQL schema lengkap)
- [ ] Setup Fastify API dengan TypeScript + plugin dasar
- [ ] Setup SvelteKit + Tailwind CSS + shadcn-svelte
- [ ] Setup Docker Compose (PostgreSQL + Redis)
- [ ] Setup Cloudflare R2 untuk file storage
- [ ] CI/CD pipeline dasar

**Auth Module**
- [ ] POST `/auth/register` — registrasi + kirim email verifikasi
- [ ] GET `/auth/verify-email` — verifikasi via token
- [ ] POST `/auth/login` — login + JWT + refresh token
- [ ] POST `/auth/logout`
- [ ] POST `/auth/refresh`
- [ ] POST `/auth/forgot-password` + `/auth/reset-password`

**User Module**
- [ ] GET/PATCH `/users/me` — profil pengguna
- [ ] POST `/users/me/avatar` — upload foto profil
- [ ] CRUD `/users/me/addresses` — manajemen alamat

**UI Pages**
- [ ] Halaman Register & Login
- [ ] Halaman Verifikasi Email
- [ ] Halaman Profil & Edit Profil
- [ ] Halaman Kelola Alamat

---

### Sprint 3–4: Catalog (Minggu 5–8)

**Category Module (Admin)**
- [ ] CRUD `/admin/categories` — manajemen kategori hierarkis
- [ ] GET `/categories` — tampil publik

**Shop Module**
- [ ] POST `/shops` — buka toko
- [ ] GET `/shops/:slug` — profil publik toko
- [ ] PATCH `/shops/me` + upload logo/banner

**Product Module**
- [ ] POST `/products` — tambah produk + varian + gambar
- [ ] GET `/products` — list produk dengan search (PostgreSQL FTS) + filter + sort
- [ ] GET `/products/:id` — detail produk
- [ ] PATCH `/products/:id` — update produk
- [ ] DELETE `/products/:id` — soft delete

**Upload**
- [ ] POST `/upload/image` — upload ke Cloudflare R2

**UI Pages**
- [ ] Homepage dengan produk unggulan
- [ ] Halaman Search & Filter hasil produk
- [ ] Halaman Detail Produk (foto carousel, varian, info toko)
- [ ] Halaman Profil Toko + daftar produk
- [ ] Dashboard Seller: halaman tambah/edit produk

---

### Sprint 5–6: Transaction (Minggu 9–12)

**Cart Module**
- [ ] GET/POST/PATCH/DELETE `/cart` + `/cart/items`

**Order Module**
- [ ] POST `/orders` — buat pesanan multi-toko
- [ ] GET `/orders` — daftar pesanan buyer
- [ ] GET `/orders/:id` — detail pesanan + timeline
- [ ] POST `/orders/:id/confirm-received`
- [ ] POST `/orders/:id/cancel`

**Seller Order Module**
- [ ] GET `/seller/orders` — daftar pesanan masuk
- [ ] PATCH `/seller/orders/:id/status` — update status + nomor resi

**Payment Module**
- [ ] Integrasi Midtrans Snap API
- [ ] POST `/payments/webhook` — terima callback Midtrans + verifikasi signature
- [ ] Update status order otomatis setelah pembayaran

**Admin Panel**
- [ ] GET `/admin/dashboard` — statistik platform
- [ ] GET/PATCH `/admin/users` — manajemen pengguna
- [ ] GET/DELETE `/admin/products` — moderasi produk

**UI Pages**
- [ ] Halaman Keranjang
- [ ] Halaman Checkout (pilih alamat, pilih kurir, ringkasan)
- [ ] Halaman Daftar Pesanan buyer (semua status)
- [ ] Halaman Detail Pesanan + timeline status
- [ ] Dashboard Seller: daftar pesanan masuk + update status
- [ ] Admin Panel: dashboard + user management

**Deliverable MVP:**
> Platform berjalan penuh. Buyer bisa mendaftar, mencari produk, checkout, bayar via Midtrans, dan lacak pesanan. Seller bisa membuka toko, upload produk, dan proses pesanan.

---

## Fase v1.1 — Commerce Plus (~2 Bulan)

> **Tujuan:** Mematangkan platform dengan fitur kepercayaan (review) dan engagement (notifikasi, wishlist) untuk siap soft launch ke pengguna nyata.

### Sprint 7–8: Trust & Engagement (Minggu 13–16)

**Review & Rating**
- [ ] POST `/reviews` — tulis review setelah pesanan selesai
- [ ] GET `/products/:id/reviews` — tampil review dengan filter
- [ ] POST `/reviews/:id/reply` — seller balas review
- [ ] Hitung dan update `avg_rating` produk dan toko otomatis

**Wishlist & Follow**
- [ ] CRUD `/wishlist` — tambah/hapus produk ke wishlist
- [ ] GET `/wishlist` — halaman wishlist
- [ ] POST/DELETE `/shops/:slug/follow` — follow/unfollow toko
- [ ] Halaman "Toko Favorit" (lihat toko yang diikuti)

**UI Pages**
- [ ] Komponen review di halaman detail produk
- [ ] Form tulis review (setelah pesanan selesai)
- [ ] Halaman Wishlist
- [ ] Halaman Toko Favorit

---

### Sprint 9–10: Notifications & Operations (Minggu 17–20)

**Notification Module**
- [ ] GET `/notifications` — daftar notifikasi
- [ ] PATCH `/notifications/read-all` + `/notifications/:id/read`
- [ ] GET `/notifications/stream` — SSE untuk real-time notification
- [ ] Email notification via Resend: konfirmasi bayar, order dikirim

**Notifikasi In-App yang diimplementasikan:**
| Event | Penerima |
|-------|----------|
| Pembayaran berhasil | Buyer |
| Pesanan diproses | Buyer |
| Pesanan dikirim (+ nomor resi) | Buyer |
| Pesanan selesai | Buyer |
| Pesanan baru masuk | Seller |
| Ada review baru | Seller |

**Operational Improvements**
- [ ] Auto-complete pesanan setelah 7 hari (cron job / background task)
- [ ] Dashboard Seller: statistik (revenue, pesanan, produk terlaris) dengan filter periode
- [ ] Halaman Detail Pesanan: tombol "Beri Ulasan" muncul setelah selesai

**Deliverable v1.1:**
> Platform siap untuk soft launch. Pengguna dapat memberi review, menyimpan wishlist, follow toko, dan menerima notifikasi.

---

## Fase v2.0 — Growth (~2 Bulan)

> **Tujuan:** Menambahkan fitur growth untuk meningkatkan konversi (voucher/promo) dan retensi (chat, rekomendasi, login social).

### Sprint 11–12: Promotion System (Minggu 21–24)

**Voucher Module**
- [ ] CRUD voucher platform oleh admin
- [ ] CRUD voucher toko oleh seller
- [ ] GET `/vouchers/check?code=` — validasi voucher
- [ ] Aplikasi voucher saat checkout
- [ ] Tampil promo/voucher di homepage

**UI Pages**
- [ ] Halaman Daftar Promo
- [ ] Komponen input voucher di checkout
- [ ] Dashboard Seller: halaman buat/kelola voucher

---

### Sprint 13–14: Advanced Features (Minggu 25–28)

**Chat Module**
- [ ] Infrastruktur WebSocket (Fastify WebSocket plugin)
- [ ] POST/GET pesan chat buyer–seller
- [ ] Badge pesan belum dibaca

**Enhancements**
- [ ] Login via Google OAuth
- [ ] Rekomendasi "Produk Terkait" di halaman detail produk
- [ ] Perbaikan search: highlight keyword, spellcheck suggestion
- [ ] Caching API response di Redis (produk populer, kategori)
- [ ] Sitemap.xml dinamis + meta tags SEO optimal per halaman

**Deliverable v2.0:**
> Platform kompetitif. Seller bisa buat promo, buyer bisa chat seller, dan konversi meningkat dengan voucher.

---

## Fase v3.0 — Scale (Ongoing)

> **Tujuan:** Fitur lanjutan setelah platform stabil dan ada traction nyata.

### Kandidat Fitur v3.0

**Fitur Penjualan Lanjutan**
- [ ] **Flash Sale** — produk berharga khusus dengan countdown timer dan kuota terbatas
- [ ] **Program Poin/Cashback** — reward untuk buyer yang sering berbelanja
- [ ] **Sponsored Listings** — seller bisa bayar untuk produk tampil di posisi atas

**Ekspansi Platform**
- [ ] **Top Up & Tagihan** — integrasi operator (pulsa, data), PLN, BPJS (sangat kompleks, butuh partner aggregator)
- [ ] **Tokopedia-style Live Shopping** (streaming produk)
- [ ] **Affiliate Program** — komisi untuk referral

**Technical Scaling**
- [ ] **Meilisearch** untuk pencarian yang lebih relevan (fuzzy, typo-tolerance)
- [ ] **Background Job Queue** (BullMQ) untuk task berat (kirim email massal, sinkronisasi stok)
- [ ] **Monitoring & Observability** (Sentry untuk error, Grafana untuk metrics)
- [ ] **Performance**: Database read replicas, Redis caching yang lebih agresif

**Multi-Platform**
- [ ] **Mobile App** — React Native atau Capacitor (reuse SvelteKit code)
- [ ] **Push Notification** — Service Worker + Web Push API
- [ ] **Multi-language** — Indonesia + English

---

## Estimasi Effort per Fase

| Fase | Total Story Points | Estimasi Waktu (Solo Dev) |
|------|--------------------|---------------------------|
| MVP | ~55 points | ~3 bulan (11-12 jam/minggu) |
| v1.1 | ~25 points | ~2 bulan |
| v2.0 | ~35 points | ~2 bulan |
| v3.0 | Ongoing | — |

> **Catatan:** Estimasi berdasarkan ~11-12 jam kerja/minggu (solo developer part-time) atau ~5-6 minggu full-time untuk MVP.

---

## Urutan Pengerjaan yang Direkomendasikan

Untuk memaksimalkan produktivitas sebagai solo developer, kerjakan dalam urutan ini:

```
Week 1–2:   Setup monorepo + database schema + Fastify boilerplate
Week 3–4:   Auth module (register, login, JWT) + User profil + Alamat
Week 5–6:   Shop + Produk CRUD + Upload gambar + Kategori
Week 7–8:   Search produk (PostgreSQL FTS) + UI homepage + detail produk
Week 9:     Cart module + UI keranjang
Week 10–11: Checkout + Midtrans integration + Webhook pembayaran
Week 12:    Order management (buyer + seller) + Admin panel dasar
            ↓ RELEASE MVP ↓
Week 13–14: Review & Rating + Wishlist + Follow toko
Week 15–16: Notifikasi (in-app + email) + Statistik seller
Week 17–18: Auto-complete order + Bug fixes + Performance
            ↓ RELEASE v1.1 (Soft Launch) ↓
Week 19–20: Voucher system
Week 21–22: Chat buyer-seller
Week 23–24: Google OAuth + Rekomendasi produk + SEO
            ↓ RELEASE v2.0 ↓
```
