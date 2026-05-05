# User Stories & Use Cases
## BeliBeli — Multi-Seller Marketplace

**Versi:** 1.0  
**Tanggal:** 4 Mei 2026  

---

## Format User Story

> **Sebagai** [tipe pengguna],  
> **Saya ingin** [aksi],  
> **Agar** [manfaat/tujuan].

---

## Epic 1: Autentikasi & Manajemen Akun

### US-001: Registrasi Akun Baru
**Sebagai** calon pengguna,  
**Saya ingin** mendaftar dengan nama, email, dan password,  
**Agar** saya dapat menggunakan platform BeliBeli.

**Acceptance Criteria:**
- [ ] Form registrasi meminta: nama lengkap, email, password, konfirmasi password
- [ ] Email harus unik — jika sudah terdaftar, tampilkan pesan error
- [ ] Password minimal 8 karakter, mengandung huruf dan angka
- [ ] Setelah registrasi berhasil, email verifikasi dikirim
- [ ] Akun belum dapat login sebelum email diverifikasi
- [ ] Terdapat link "Kirim Ulang Email" jika email tidak masuk

---

### US-002: Login dengan Email & Password
**Sebagai** pengguna terdaftar,  
**Saya ingin** login menggunakan email dan password,  
**Agar** saya dapat mengakses akun saya.

**Acceptance Criteria:**
- [ ] Login berhasil jika email & password benar dan email sudah diverifikasi
- [ ] Pesan error jelas jika email/password salah (tidak mengungkap mana yang salah)
- [ ] Session tersimpan via JWT (access token 15 menit, refresh token 7 hari di httpOnly cookie)
- [ ] Setelah login, diarahkan ke halaman sebelumnya atau homepage
- [ ] Maksimal 5 percobaan gagal → akun dilock sementara 15 menit

---

### US-003: Reset Password
**Sebagai** pengguna yang lupa password,  
**Saya ingin** mereset password melalui email,  
**Agar** saya dapat kembali mengakses akun saya.

**Acceptance Criteria:**
- [ ] Input email → sistem kirim link reset (valid 1 jam)
- [ ] Jika email tidak terdaftar, tetap tampilkan pesan "Link dikirim jika email terdaftar" (mencegah email enumeration)
- [ ] Link reset hanya bisa digunakan sekali
- [ ] Password baru minimal 8 karakter

---

### US-004: Kelola Profil Pengguna
**Sebagai** pengguna,  
**Saya ingin** mengubah data profil saya (nama, foto, bio, nomor HP),  
**Agar** profil saya mencerminkan identitas saya.

**Acceptance Criteria:**
- [ ] Dapat upload foto profil (maks 2MB, JPG/PNG)
- [ ] Perubahan nama, bio, nomor HP dapat disimpan
- [ ] Perubahan email memerlukan verifikasi ulang ke email baru

---

### US-005: Kelola Alamat Pengiriman
**Sebagai** buyer,  
**Saya ingin** menyimpan dan mengelola beberapa alamat pengiriman,  
**Agar** saya tidak perlu mengisi ulang alamat saat checkout.

**Acceptance Criteria:**
- [ ] Dapat menambah, mengubah, dan menghapus alamat
- [ ] Maksimal 5 alamat tersimpan per akun
- [ ] Dapat menetapkan satu alamat sebagai alamat default
- [ ] Form alamat mencakup: label, nama penerima, nomor HP, provinsi, kota, kecamatan, kode pos, detail

---

## Epic 2: Manajemen Toko (Seller)

### US-006: Membuka Toko
**Sebagai** pengguna,  
**Saya ingin** membuka toko di BeliBeli,  
**Agar** saya dapat mulai menjual produk.

**Acceptance Criteria:**
- [ ] Satu akun hanya bisa memiliki satu toko
- [ ] Form buka toko: nama toko (unik), deskripsi, kota
- [ ] Nama toko tidak boleh mengandung kata terlarang
- [ ] Toko langsung aktif setelah dibuat (tidak perlu approval)
- [ ] Akun otomatis upgrade role menjadi `seller`

---

### US-007: Menambah Produk ke Toko
**Sebagai** seller,  
**Saya ingin** menambahkan produk ke toko saya,  
**Agar** pembeli dapat menemukan dan membeli produk saya.

**Acceptance Criteria:**
- [ ] Form produk mencakup: nama, deskripsi, kategori, harga dasar, berat (gram), kondisi
- [ ] Dapat menambah varian produk (misal: warna + ukuran) dengan harga & stok per varian
- [ ] Jika tidak ada varian, tetap dibuat 1 varian default
- [ ] Dapat upload 1–5 foto produk (maks 5MB per foto, format JPG/PNG/WebP)
- [ ] 1 foto ditandai sebagai foto utama
- [ ] Produk muncul di hasil pencarian setelah disimpan dan status `active`

---

### US-008: Mengelola Produk
**Sebagai** seller,  
**Saya ingin** mengubah atau menonaktifkan produk saya,  
**Agar** informasi produk selalu akurat.

**Acceptance Criteria:**
- [ ] Dapat mengubah semua field produk
- [ ] Dapat mengubah stok per varian
- [ ] Produk dapat dinonaktifkan (tidak muncul di pencarian) tanpa dihapus
- [ ] Produk yang dihapus (soft delete) tidak muncul di mana pun

---

### US-009: Mengelola Pesanan Masuk (Seller)
**Sebagai** seller,  
**Saya ingin** melihat, memproses, dan mengirimkan pesanan masuk,  
**Agar** pembeli dapat menerima produk yang mereka beli.

**Acceptance Criteria:**
- [ ] Dashboard seller menampilkan daftar pesanan baru dengan notifikasi
- [ ] Seller dapat mengubah status: `pending` → `processing` → `shipped` (dengan input nomor resi)
- [ ] Seller dapat membatalkan pesanan dengan alasan (hanya saat status `pending`)
- [ ] Setiap perubahan status muncul di timeline pesanan buyer

---

### US-010: Melihat Statistik Toko
**Sebagai** seller,  
**Saya ingin** melihat statistik penjualan toko saya,  
**Agar** saya dapat mengambil keputusan bisnis yang lebih baik.

**Acceptance Criteria:**
- [ ] Menampilkan: total pendapatan, total pesanan, produk terlaris, dan jumlah rating
- [ ] Data dapat difilter berdasarkan periode (7 hari, 30 hari, 3 bulan)
- [ ] *(Fase v1.1)*

---

## Epic 3: Belanja (Buyer)

### US-011: Mencari Produk
**Sebagai** buyer,  
**Saya ingin** mencari produk menggunakan kata kunci,  
**Agar** saya dapat menemukan produk yang saya inginkan dengan cepat.

**Acceptance Criteria:**
- [ ] Hasil pencarian relevan berdasarkan nama dan deskripsi produk
- [ ] Search suggestion muncul saat mengetik (minimal 2 karakter)
- [ ] Dapat filter hasil: kategori, rentang harga, rating minimal, kota seller
- [ ] Dapat sort: relevansi, harga terendah, harga tertinggi, terbaru, terlaris
- [ ] Menampilkan jumlah total hasil dan pagination

---

### US-012: Melihat Detail Produk
**Sebagai** buyer,  
**Saya ingin** melihat informasi lengkap tentang sebuah produk,  
**Agar** saya dapat membuat keputusan pembelian yang tepat.

**Acceptance Criteria:**
- [ ] Menampilkan: carousel foto, nama produk, harga, stok tersedia, deskripsi
- [ ] Pilih varian (warna/ukuran) jika tersedia — harga & stok terupdate dinamis
- [ ] Informasi toko: nama, rating, kota, jumlah produk
- [ ] Estimasi ongkir berdasarkan lokasi pengguna
- [ ] Daftar review & rating produk
- [ ] Tombol "Beli Sekarang" (langsung ke checkout) dan "Tambah ke Keranjang"

---

### US-013: Menggunakan Keranjang Belanja
**Sebagai** buyer,  
**Saya ingin** mengumpulkan produk dari berbagai toko di keranjang belanja,  
**Agar** saya dapat membeli semuanya sekaligus.

**Acceptance Criteria:**
- [ ] Dapat tambah produk ke keranjang dengan varian dan jumlah yang dipilih
- [ ] Keranjang tersimpan meskipun browser ditutup (persistent)
- [ ] Dapat mengubah jumlah atau menghapus item
- [ ] Total harga terupdate otomatis
- [ ] Produk dari berbagai toko tampil berkelompok per toko
- [ ] Peringatan jika stok produk berubah sejak ditambahkan

---

### US-014: Checkout
**Sebagai** buyer,  
**Saya ingin** melakukan checkout dari keranjang belanja,  
**Agar** pesanan saya diproses dan saya dapat melakukan pembayaran.

**Acceptance Criteria:**
- [ ] Pilih alamat pengiriman (dari tersimpan atau tambah baru saat itu)
- [ ] Pilih metode pengiriman per toko (dengan estimasi ongkir dan estimasi tiba)
- [ ] Ringkasan order: item, subtotal per toko, ongkir, total sebelum dan sesudah diskon
- [ ] Tampil tombol konfirmasi sebelum diarahkan ke halaman pembayaran Midtrans
- [ ] Setelah pembayaran berhasil, diarahkan ke halaman status pesanan

---

### US-015: Melacak Status Pesanan
**Sebagai** buyer,  
**Saya ingin** melihat status dan riwayat pesanan saya,  
**Agar** saya tahu perkembangan pengiriman barang yang saya beli.

**Acceptance Criteria:**
- [ ] Daftar semua pesanan dengan status terkini dan filter berdasarkan status
- [ ] Detail pesanan menampilkan: item yang dibeli, harga, alamat kirim, status timeline per toko
- [ ] Nomor resi tersedia dan dapat disalin
- [ ] Tombol "Konfirmasi Terima Barang" muncul saat status `shipped`
- [ ] Pesanan otomatis selesai 7 hari setelah dikirim jika buyer tidak konfirmasi

---

## Epic 4: Review & Rating

### US-016: Memberikan Review Produk
**Sebagai** buyer yang sudah menerima barang,  
**Saya ingin** memberikan penilaian dan ulasan untuk produk yang saya beli,  
**Agar** pembeli lain mendapatkan informasi yang lebih objektif.

**Acceptance Criteria:**
- [ ] Tombol "Beri Ulasan" hanya muncul setelah order status `completed`
- [ ] Satu order item hanya bisa direviw satu kali
- [ ] Rating 1–5 bintang wajib; komentar teks opsional
- [ ] Dapat upload maks 3 foto (maks 2MB per foto)
- [ ] Review tampil di halaman produk dan memperbarui rata-rata rating

---

### US-017: Membalas Review (Seller)
**Sebagai** seller,  
**Saya ingin** membalas review yang diberikan pembeli,  
**Agar** saya dapat memberikan klarifikasi atau mengucapkan terima kasih.

**Acceptance Criteria:**
- [ ] Seller hanya bisa membalas review untuk produk milik tokonya
- [ ] Setiap review hanya bisa dibalas sekali
- [ ] Balasan muncul di bawah review pembeli

---

## Epic 5: Wishlist & Toko Favorit

### US-018: Menyimpan Produk ke Wishlist
**Sebagai** buyer,  
**Saya ingin** menyimpan produk yang saya minati ke wishlist,  
**Agar** saya bisa dengan mudah menemukannya kembali nanti.

**Acceptance Criteria:**
- [ ] Tombol ikon hati di kartu produk dan halaman detail
- [ ] Produk yang sudah di-wishlist tampil dengan ikon hati terisi
- [ ] Halaman wishlist menampilkan semua produk yang disimpan
- [ ] Dapat menghapus produk dari wishlist
- [ ] Tampilkan info jika produk sudah habis stok atau tidak aktif

---

### US-019: Mengikuti Toko Favorit
**Sebagai** buyer,  
**Saya ingin** mengikuti toko-toko favorit saya,  
**Agar** saya dapat melihat update produk terbaru dari toko tersebut.

**Acceptance Criteria:**
- [ ] Tombol "Ikuti" di halaman toko
- [ ] Halaman "Toko Favorit" menampilkan semua toko yang diikuti
- [ ] Menampilkan produk terbaru dari toko yang diikuti
- [ ] Jumlah pengikut tampil di profil toko

---

## Epic 6: Notifikasi

### US-020: Menerima Notifikasi Platform
**Sebagai** pengguna,  
**Saya ingin** menerima notifikasi tentang aktivitas penting,  
**Agar** saya tidak melewatkan update pesanan atau aktivitas toko.

**Acceptance Criteria:**
- [ ] Ikon bell di navbar menampilkan badge jumlah notifikasi belum dibaca
- [ ] Notifikasi in-app untuk buyer: pembayaran berhasil, pesanan diproses, pesanan dikirim, pesanan selesai
- [ ] Notifikasi in-app untuk seller: ada pesanan baru, ada review baru
- [ ] Notifikasi email untuk: konfirmasi pembayaran, pesanan dikirim (dengan nomor resi)
- [ ] Semua notifikasi dapat ditandai "sudah dibaca" (satu per satu atau semua sekaligus)

---

## Epic 7: Admin Panel

### US-021: Moderasi Produk (Admin)
**Sebagai** admin,  
**Saya ingin** mereview dan menghapus produk yang melanggar ketentuan,  
**Agar** platform tetap bersih dan aman bagi pengguna.

**Acceptance Criteria:**
- [ ] Dashboard admin menampilkan daftar semua produk dengan search & filter
- [ ] Admin dapat menghapus produk mana pun
- [ ] Admin dapat menonaktifkan atau mengaktifkan kembali toko

---

### US-022: Manajemen Pengguna (Admin)
**Sebagai** admin,  
**Saya ingin** melihat daftar pengguna dan mengelola statusnya,  
**Agar** saya dapat menangani pengguna yang melanggar aturan.

**Acceptance Criteria:**
- [ ] Tabel pengguna dengan search (nama/email) dan filter (role, status)
- [ ] Admin dapat suspend akun (user tidak bisa login)
- [ ] Admin dapat mengaktifkan kembali akun yang di-suspend
- [ ] Catatan alasan suspend tersimpan

---

## Matriks Prioritas User Stories

| User Story | Fase | Story Points (est.) |
|------------|------|---------------------|
| US-001 Registrasi | MVP | 3 |
| US-002 Login | MVP | 2 |
| US-003 Reset Password | MVP | 2 |
| US-004 Kelola Profil | MVP | 2 |
| US-005 Kelola Alamat | MVP | 3 |
| US-006 Buka Toko | MVP | 3 |
| US-007 Tambah Produk | MVP | 5 |
| US-008 Kelola Produk | MVP | 3 |
| US-009 Kelola Pesanan Seller | MVP | 5 |
| US-011 Cari Produk | MVP | 5 |
| US-012 Detail Produk | MVP | 4 |
| US-013 Keranjang | MVP | 4 |
| US-014 Checkout | MVP | 8 |
| US-015 Lacak Pesanan | MVP | 3 |
| US-021 Moderasi Admin | MVP | 3 |
| US-022 Manajemen User | MVP | 3 |
| US-010 Statistik Toko | v1.1 | 4 |
| US-016 Review Produk | v1.1 | 4 |
| US-017 Balas Review | v1.1 | 2 |
| US-018 Wishlist | v1.1 | 2 |
| US-019 Follow Toko | v1.1 | 2 |
| US-020 Notifikasi | v1.1 | 5 |
