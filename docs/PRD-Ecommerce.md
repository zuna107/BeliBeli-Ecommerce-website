# Product Requirements Document (PRD)
## BeliBeli — Platform E-Commerce Multi-Seller

**Versi:** 1.0  
**Tanggal:** 4 Mei 2026  
**Status:** Draft  
**Pengembang:** Solo Developer  

---

## 1. Ringkasan Proyek

BeliBeli adalah platform e-commerce **multi-seller** berbasis web yang memungkinkan banyak penjual (seller) membuka toko online dan pembeli (buyer) berbelanja produk dari berbagai toko dalam satu platform. Platform ini terinspirasi dari Tokopedia dengan fokus pada pengalaman pengguna yang **ringan dan cepat** menggunakan teknologi modern (SvelteKit).

---

## 2. Tujuan & Sasaran

### 2.1 Tujuan Bisnis
- Menyediakan platform marketplace yang menghubungkan seller dan buyer di Indonesia
- Menghasilkan pendapatan melalui komisi transaksi dan promo berbayar
- Membangun ekosistem perdagangan digital yang aman dan terpercaya

### 2.2 Sasaran Utama
- **Buyer**: Kemudahan menemukan produk, berbelanja, dan melacak pesanan
- **Seller**: Kemudahan membuka toko, mengelola produk dan pesanan
- **Admin**: Kemudahan moderasi konten, monitoring platform

---

## 3. Target Pengguna

### 3.1 Pembeli (Buyer)
- Individu yang ingin membeli produk secara online
- Segmen usia 17–45 tahun, familiar dengan e-commerce Indonesia

### 3.2 Penjual (Seller)
- UMKM dan individu yang ingin berjualan online
- Memiliki produk fisik yang dapat dikirim
- Tidak memerlukan keahlian teknis untuk mengelola toko

### 3.3 Administrator
- Tim internal yang mengelola platform
- Bertanggung jawab atas moderasi produk, pengguna, dan transaksi

---

## 4. Fitur Utama

### 4.1 Modul Autentikasi & Pengguna

| Fitur | Prioritas | Fase |
|-------|-----------|------|
| Registrasi via Email | Wajib | MVP |
| Login Email + Password | Wajib | MVP |
| Verifikasi Email (OTP/link) | Wajib | MVP |
| Reset Password | Wajib | MVP |
| Login via Google OAuth | Nice-to-have | v2 |
| Profil Pengguna (nama, foto, bio) | Wajib | MVP |
| Kelola Alamat Pengiriman (multiple) | Wajib | MVP |
| Pengaturan Notifikasi | Wajib | v1.1 |
| Tutup Akun | Wajib | v1.1 |

### 4.2 Modul Toko (Shop)

| Fitur | Prioritas | Fase |
|-------|-----------|------|
| Buka Toko (1 akun = 1 toko) | Wajib | MVP |
| Profil Toko (nama, logo, deskripsi, lokasi) | Wajib | MVP |
| Dashboard Seller (ringkasan penjualan) | Wajib | MVP |
| Kelola Produk (CRUD) | Wajib | MVP |
| Kelola Pesanan Masuk | Wajib | MVP |
| Pengaturan Ongkir (flat rate / per berat) | Wajib | MVP |
| Statistik Toko (pendapatan, produk terlaris) | Wajib | v1.1 |
| Toko Favorit (follow shop) | Wajib | v1.1 |

### 4.3 Modul Produk & Katalog

| Fitur | Prioritas | Fase |
|-------|-----------|------|
| Daftar Produk dengan Pagination | Wajib | MVP |
| Detail Produk (deskripsi, gambar, spesifikasi) | Wajib | MVP |
| Kategori Produk (hierarkis) | Wajib | MVP |
| Varian Produk (ukuran, warna, dst) | Wajib | MVP |
| Upload Foto Produk (maks 5 foto) | Wajib | MVP |
| Pencarian Produk (keyword) | Wajib | MVP |
| Filter & Sorting (harga, rating, lokasi) | Wajib | MVP |
| Stok Produk & Manajemen Stok | Wajib | MVP |
| Produk Terkait (rekomendasi) | Nice-to-have | v2 |

### 4.4 Modul Keranjang & Checkout

| Fitur | Prioritas | Fase |
|-------|-----------|------|
| Tambah ke Keranjang | Wajib | MVP |
| Kelola Keranjang (update qty, hapus) | Wajib | MVP |
| Checkout Multi-toko dalam 1 Transaksi | Wajib | MVP |
| Pilih Alamat Pengiriman | Wajib | MVP |
| Pilih Metode Pengiriman | Wajib | MVP |
| Ringkasan Order Sebelum Bayar | Wajib | MVP |
| Aplikasi Voucher/Kupon | Wajib | v1.1 |

### 4.5 Modul Pembayaran

| Fitur | Prioritas | Fase |
|-------|-----------|------|
| Integrasi Midtrans Payment Gateway | Wajib | MVP |
| Transfer Bank (Virtual Account) | Wajib | MVP |
| E-Wallet (GoPay, OVO, DANA) | Wajib | MVP |
| Kartu Kredit/Debit | Wajib | MVP |
| COD (Cash on Delivery) | Nice-to-have | v2 |
| Konfirmasi Pembayaran Otomatis (Webhook) | Wajib | MVP |
| Rekap Pembayaran / Invoice | Wajib | MVP |

### 4.6 Modul Pesanan (Order Management)

| Fitur | Prioritas | Fase |
|-------|-----------|------|
| Daftar Pesanan Buyer (semua status) | Wajib | MVP |
| Detail Pesanan dengan Timeline Status | Wajib | MVP |
| Status: Menunggu → Dibayar → Diproses → Dikirim → Selesai | Wajib | MVP |
| Update Status oleh Seller (Proses → Kirim) | Wajib | MVP |
| Input Nomor Resi | Wajib | MVP |
| Konfirmasi Terima Barang oleh Buyer | Wajib | MVP |
| Pembatalan Pesanan (buyer & seller) | Wajib | MVP |
| Auto-complete pesanan (7 hari setelah dikirim) | Nice-to-have | v1.1 |

### 4.7 Modul Review & Rating

| Fitur | Prioritas | Fase |
|-------|-----------|------|
| Review & Rating Produk (1–5 bintang) | Wajib | v1.1 |
| Foto di Review (maks 3 foto) | Wajib | v1.1 |
| Balasan Seller terhadap Review | Wajib | v1.1 |
| Rata-rata Rating Produk & Toko | Wajib | v1.1 |
| Filter Review (bintang, ada foto) | Nice-to-have | v2 |

### 4.8 Modul Wishlist

| Fitur | Prioritas | Fase |
|-------|-----------|------|
| Tambah Produk ke Wishlist | Wajib | v1.1 |
| Lihat Daftar Wishlist | Wajib | v1.1 |
| Follow Toko Favorit | Wajib | v1.1 |
| Notifikasi Produk Wishlist ada Diskon | Nice-to-have | v2 |

### 4.9 Modul Promo & Voucher

| Fitur | Prioritas | Fase |
|-------|-----------|------|
| Voucher Platform (dibuat admin) | Wajib | v2 |
| Voucher Toko (dibuat seller) | Wajib | v2 |
| Flash Sale | Nice-to-have | v3 |
| Sistem Poin/Cashback | Nice-to-have | v3 |

### 4.10 Modul Notifikasi

| Fitur | Prioritas | Fase |
|-------|-----------|------|
| Notifikasi In-App (bell icon) | Wajib | v1.1 |
| Notifikasi Email (pembayaran, status pesanan) | Wajib | v1.1 |
| Notifikasi Real-time (SSE/WebSocket) | Nice-to-have | v2 |
| Push Notification Browser | Nice-to-have | v3 |

### 4.11 Modul Chat

| Fitur | Prioritas | Fase |
|-------|-----------|------|
| Chat Buyer–Seller | Wajib | v2 |
| Kirim Gambar di Chat | Nice-to-have | v3 |

### 4.12 Modul Admin Panel

| Fitur | Prioritas | Fase |
|-------|-----------|------|
| Dashboard Admin (overview platform) | Wajib | MVP |
| Manajemen Pengguna (suspend, ban) | Wajib | MVP |
| Manajemen Produk (moderasi, hapus) | Wajib | MVP |
| Manajemen Kategori | Wajib | MVP |
| Manajemen Toko | Wajib | v1.1 |
| Laporan Transaksi | Wajib | v1.1 |

---

## 5. Kebutuhan Non-Fungsional

### 5.1 Performa
- Halaman utama harus load < 2 detik (LCP)
- API response time < 200ms untuk operasi CRUD biasa
- Support minimal 100 concurrent users di awal (dapat di-scale)

### 5.2 Keamanan
- Semua komunikasi via HTTPS
- Password di-hash dengan bcrypt (cost factor ≥ 12)
- JWT dengan refresh token (access token TTL: 15 menit, refresh: 7 hari di httpOnly cookie)
- Rate limiting pada endpoint auth (5 req/15 min) dan global (100 req/15 min)
- Input validation di semua endpoint menggunakan Zod
- SQL Injection prevention via ORM (Prisma parameterized queries)
- XSS prevention: SvelteKit escapes HTML by default; DOMPurify untuk rich text
- CORS dikonfigurasi ketat (whitelist domain frontend saja)

### 5.3 Skalabilitas
- Arsitektur Monolith Modular yang dapat dipecah ke microservice jika diperlukan
- Database connection pooling
- CDN untuk aset statis dan gambar produk

### 5.4 Ketersediaan
- Target uptime 99.5% (fase awal)
- Backup database harian

### 5.5 Aksesibilitas & UX
- Responsive design (mobile-first)
- Support browser modern (Chrome, Firefox, Safari, Edge)
- WCAG 2.1 Level AA untuk elemen interaktif utama

---

## 6. Batasan & Asumsi

### 6.1 Batasan
- Dikembangkan oleh **solo developer** → fitur kompleks (chat, flash sale, top-up tagihan) ditunda ke fase akhir
- Top Up & Tagihan (pulsa, listrik, BPJS) dikecualikan dari scope awal karena memerlukan integrasi operator pihak ketiga yang kompleks
- Tidak ada aplikasi mobile native di fase awal (web-only, mobile-responsive)

### 6.2 Asumsi
- Platform menargetkan pasar Indonesia (mata uang IDR, bahasa Indonesia)
- Pengiriman menggunakan jasa kurir pihak ketiga (JNE, J&T, Sicepat) — integrasi API ongkir (RajaOngkir/Shipper.id) opsional
- Midtrans digunakan sebagai payment gateway utama

---

## 7. Kriteria Sukses (KPI)

| Metrik | Target MVP | Target v1.1 |
|--------|-----------|------------|
| Registrasi Pengguna | 100 akun | 1.000 akun |
| Produk Terdaftar | 500 produk | 5.000 produk |
| Transaksi Berhasil/Bulan | 50 | 500 |
| Conversion Rate | 1% | 2.5% |
| Avg. Page Load Time (LCP) | < 2 detik | < 1.5 detik |
| API Error Rate | < 1% | < 0.5% |
