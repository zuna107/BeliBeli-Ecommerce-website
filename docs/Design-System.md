# Design System — BeliBeli

**Versi:** 1.0  
**Referensi UI:** Tokopedia (tata letak & pola komponen)  
**Referensi Warna:** Blibli (biru `#0095DA`)  

---

## 1. Color Palette

### Primary Blue (BeliBeli Blue)

Diambil dari Blibli (`#0095DA`) sebagai base. Skala dibuat untuk Tailwind CSS.

| Token | Hex | Preview | Penggunaan |
|-------|-----|---------|-----------|
| `primary-50` | `#E6F6FD` | 🔵 (sangat terang) | Background hover, highlight ringan |
| `primary-100` | `#CCEcFB` | 🔵 | Background badge, chip |
| `primary-200` | `#99D9F7` | 🔵 | Border focus |
| `primary-300` | `#66C5F3` | 🔵 | Icon dekoratif |
| `primary-400` | `#33B0EF` | 🔵 | Link hover |
| `primary-500` | `#009CEB` | 🔵 | Link default |
| **`primary-600`** | **`#0095DA`** | 🔵 | **CTA Button, Icon aktif** ← BASE |
| `primary-700` | `#007AB3` | 🔵 | Button hover/pressed |
| `primary-800` | `#005F8C` | 🔵 | Button active, text link gelap |
| `primary-900` | `#004466` | 🔵 | Navbar background (opsional) |
| `primary-950` | `#002233` | 🔵 | Deep dark blue |

> **Aturan penggunaan primary:**  
> - CTA button utama → `primary-600` bg + white text  
> - Hover → `primary-700`  
> - Outline button → `primary-600` border + `primary-600` text + transparent bg  
> - Link → `primary-600`, hover `primary-800`  

---

### Semantic Colors

| Fungsi | Nama | Hex | Contoh Penggunaan |
|--------|------|-----|--------------------|
| **Danger / Error** | `red-600` | `#DC2626` | Form error, hapus akun, stok habis |
| **Warning** | `orange-500` | `#F97316` | Flash sale badge, low stock |
| **Success** | `green-600` | `#16A34A` | Pembayaran sukses, order selesai |
| **Info** | `primary-600` | `#0095DA` | Info tooltip, notifikasi info |
| **Rating** | `yellow-400` | `#FACC15` | Bintang rating produk |
| **Flash Sale** | `red-500` | `#EF4444` | Badge flash sale, countdown |
| **Promo/Diskon** | `red-500` | `#EF4444` | Badge % diskon di product card |
| **Terlaris** | `orange-500` | `#F97316` | Badge "Terlaris" |
| **Baru** | `blue-500` | `#3B82F6` | Badge "Baru" |
| **Cashback** | `green-500` | `#22C55E` | Badge cashback/voucher |

---

### Neutral / Gray Scale

Dipakai untuk teks, border, background.

| Token | Hex | Penggunaan |
|-------|-----|-----------|
| `white` | `#FFFFFF` | Background card, input |
| `gray-50` | `#F9FAFB` | Background halaman (body) |
| `gray-100` | `#F3F4F6` | Background section, skeleton loader |
| `gray-200` | `#E5E7EB` | Border card, divider |
| `gray-300` | `#D1D5DB` | Border input, placeholder border |
| `gray-400` | `#9CA3AF` | Placeholder text, icon nonaktif |
| `gray-500` | `#6B7280` | Teks sekunder (label, subtext) |
| `gray-700` | `#374151` | Teks body |
| `gray-900` | `#111827` | Judul, teks utama |
| `black` | `#000000` | Gunakan jarang — prefer gray-900 |

---

### Tailwind CSS Config

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#E6F6FD',
          100: '#CCEcFB',
          200: '#99D9F7',
          300: '#66C5F3',
          400: '#33B0EF',
          500: '#009CEB',
          600: '#0095DA',  // ← PRIMARY COLOR (Blibli-inspired)
          700: '#007AB3',
          800: '#005F8C',
          900: '#004466',
          950: '#002233',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
} satisfies Config
```

---

## 2. Tipografi

### Font

| Penggunaan | Font | Weight | Keterangan |
|-----------|------|--------|-----------|
| Judul utama (H1, H2) | Plus Jakarta Sans | 700 (Bold) | Heading halaman |
| Sub-judul (H3, H4) | Plus Jakarta Sans | 600 (SemiBold) | Section title |
| Body text | Plus Jakarta Sans | 400 (Regular) | Konten paragraf |
| Harga produk | Plus Jakarta Sans | 700 (Bold) | Selalu bold, warna `gray-900` |
| Harga coret | Plus Jakarta Sans | 400 | `line-through`, warna `gray-400` |
| Label/badge | Plus Jakarta Sans | 500 (Medium) | Badge, chip, tag |
| Kode / monospace | JetBrains Mono | 400 | No. order, invoice ID |

> Fallback: `Inter → system-ui → sans-serif`

### Ukuran Teks (Tailwind classes)

| Elemen | Class | Size | Leading |
|--------|-------|------|---------|
| Page title | `text-2xl font-bold` | 24px | 32px |
| Section title | `text-xl font-semibold` | 20px | 28px |
| Product name (card) | `text-sm font-medium` | 14px | 20px |
| Product name (detail) | `text-lg font-semibold` | 18px | 28px |
| Harga (card) | `text-base font-bold` | 16px | 24px |
| Harga (detail) | `text-2xl font-bold` | 24px | 32px |
| Body / deskripsi | `text-sm text-gray-700` | 14px | 20px |
| Label form | `text-sm font-medium text-gray-700` | 14px | — |
| Helper / error | `text-xs text-red-600` | 12px | — |
| Badge | `text-xs font-medium` | 12px | — |

---

## 3. Spacing & Layout

### Grid System

```
Mobile  (<640px)   : 1 kolom
Tablet  (640-1024) : 2-3 kolom
Desktop (>1024px)  : 4-6 kolom (product grid)
```

### Container Width

```
Max width : 1280px (Tailwind: max-w-7xl)
Padding   : 16px mobile / 24px tablet / 32px desktop
```

### Product Grid

| Breakpoint | Kolom |
|-----------|-------|
| Mobile | 2 kolom |
| Tablet (md) | 3 kolom |
| Desktop (lg) | 4 kolom |
| Wide (xl) | 5 kolom |

```html
<!-- Product grid class -->
<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
```

---

## 4. Komponen UI — Inventory dari Referensi Tokopedia

### 4.1 Navbar / Header

**Referensi:** Tokopedia sticky top navbar  
**Adaptasi BeliBeli:** Background `primary-600` (#0095DA) → teks putih

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]  [Search Bar ─────────────────── 🔍]  [Cart] [User]     │
└─────────────────────────────────────────────────────────────────┘
```

- Background: `primary-600` (`#0095DA`)
- Logo: teks putih "BeliBeli" dengan font bold
- Search bar: background putih, border-radius `rounded-full`, placeholder "Cari produk..."
- Icon cart + notifikasi: putih
- Avatar user: circular, 32px
- **Sticky**: `position: sticky; top: 0; z-index: 50`
- Tinggi: `h-16` (64px)

---

### 4.2 Category Navigation Bar

**Referensi:** Baris kategori di bawah navbar Tokopedia  

```
[Semua] [Elektronik] [Fashion] [Rumah Tangga] [Kecantikan] [Olahraga] ...
```

- Background: putih
- Border bottom: `border-b border-gray-200`
- Item aktif: teks `primary-600`, border bottom `primary-600`
- Item non-aktif: teks `gray-600`, hover `gray-900`
- Scrollable horizontal di mobile

---

### 4.3 Product Card

**Referensi:** Tokopedia product card  
**Komponen paling kritis** — konsistensi sangat penting.

```
┌───────────────┐
│               │
│   [Gambar]    │  ← aspect-ratio: 1/1 (square)
│               │
│ [Badge Diskon]│  ← pojok kiri atas (opsional)
├───────────────┤
│ Nama Produk   │  ← 2 baris max, text-sm
│ Rp 150.000    │  ← font-bold
│ ~~Rp 200.000~~│  ← line-through gray-400 (opsional)
│ ⭐ 4.8 (234)  │  ← text-xs gray-500
│ Kota · Terlaris│  ← text-xs gray-400
└───────────────┘
```

**Spesifikasi:**
- Card border: `border border-gray-200 rounded-xl`
- Hover: `hover:shadow-md transition-shadow`
- Gambar: `object-cover aspect-square rounded-t-xl`
- Badge diskon: `bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded absolute top-2 left-2`
- Nama produk: `text-sm text-gray-700 line-clamp-2`
- Harga: `text-base font-bold text-gray-900`
- Harga coret: `text-xs line-through text-gray-400`
- Rating: ⭐ `text-yellow-400` + `text-xs text-gray-500`
- Lokasi: `text-xs text-gray-400`

---

### 4.4 Banner / Hero Carousel

**Referensi:** Banner slider Tokopedia di atas homepage  

- Rasio: `16:5` di desktop, `16:7` di mobile
- Auto-play: 5 detik
- Dots indicator di bawah
- Border radius: `rounded-xl`

---

### 4.5 Category Icon Grid

**Referensi:** Grid ikon kategori Tokopedia (8-10 kolom di desktop)

```
[Icon] [Icon] [Icon] [Icon] [Icon] [Icon] [Icon] [Icon]
 Elek  Fash   Rumah  Kecan  Olahr  Makan  Buku   Semua
```

- Grid: `grid-cols-5 md:grid-cols-8 lg:grid-cols-10`
- Icon: SVG atau gambar, ukuran 48x48px
- Label: `text-xs text-center text-gray-600`
- Hover: background `primary-50`, border-radius `rounded-lg`

---

### 4.6 Buttons

```
Primary   : bg-primary-600 text-white hover:bg-primary-700 rounded-lg px-4 py-2
Secondary : border border-primary-600 text-primary-600 hover:bg-primary-50 rounded-lg px-4 py-2
Danger    : bg-red-600 text-white hover:bg-red-700 rounded-lg px-4 py-2
Ghost     : text-gray-600 hover:bg-gray-100 rounded-lg px-4 py-2
Link      : text-primary-600 hover:text-primary-800 underline
```

**Ukuran button:**
- `sm`: `text-sm px-3 py-1.5`
- `md` (default): `text-base px-4 py-2`
- `lg`: `text-lg px-6 py-3`

**Tombol "Beli Sekarang":** Full width, `bg-primary-600`, ukuran `lg`  
**Tombol "+ Keranjang":** Full width, outline `primary-600`, ukuran `lg`

---

### 4.7 Input & Form

```
Label  : text-sm font-medium text-gray-700 mb-1
Input  : w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
         focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-600
Error  : border-red-500 focus:ring-red-200
Hint   : text-xs text-gray-500 mt-1
Pesan error : text-xs text-red-600 mt-1
```

---

### 4.8 Badge / Label

| Tipe | Class |
|------|-------|
| Diskon | `bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded` |
| Terlaris | `bg-orange-100 text-orange-600 text-xs font-medium px-2 py-0.5 rounded-full` |
| Baru | `bg-blue-100 text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full` |
| Gratis Ongkir | `bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full` |
| Promo | `bg-primary-100 text-primary-700 text-xs font-medium px-2 py-0.5 rounded-full` |
| Status Order | Lihat tabel di bawah |

**Status badge order:**
| Status | Class |
|--------|-------|
| Menunggu Pembayaran | `bg-yellow-100 text-yellow-700` |
| Diproses | `bg-blue-100 text-blue-700` |
| Dikirim | `bg-indigo-100 text-indigo-700` |
| Selesai | `bg-green-100 text-green-700` |
| Dibatalkan | `bg-gray-100 text-gray-600` |
| Dikembalikan | `bg-red-100 text-red-700` |

---

### 4.9 Rating Stars

```
⭐⭐⭐⭐⭐  4.8  (2.4rb penilaian)
```

- Bintang penuh: `text-yellow-400` ★
- Bintang kosong: `text-gray-300` ☆
- Bintang setengah: `text-yellow-400` half-icon
- Angka rating: `text-sm font-semibold text-gray-900`
- Jumlah ulasan: `text-sm text-gray-500`

---

### 4.10 Navigation Tabs

**Referensi:** Tabs di halaman toko / detail produk Tokopedia

```
[Deskripsi]  [Spesifikasi]  [Ulasan (123)]
──────────── ───────────── ──────────────
             ═════════════   ← border bawah primary-600
```

- Border bottom active: `border-b-2 border-primary-600 text-primary-600 font-semibold`
- Non-active: `text-gray-500 hover:text-gray-900`

---

### 4.11 Halaman-Halaman Utama (Peta Komponen)

| Halaman | Route SvelteKit | Komponen Kunci |
|---------|----------------|----------------|
| Homepage | `/` | Navbar, Banner, CategoryGrid, ProductCarousel (horizontal scroll), ProductGrid |
| Halaman Kategori | `/c/[slug]` | FilterSidebar, ProductGrid, Pagination, SortDropdown |
| Halaman Pencarian | `/search?q=` | Sama dengan kategori |
| Detail Produk | `/p/[slug]` | ProductImages, ProductInfo, VariantSelector, AddToCart, ShippingEstimator, ReviewList |
| Halaman Toko | `/shop/[slug]` | ShopHeader, ShopProductGrid, ShopTabs |
| Keranjang | `/cart` | CartItemList, OrderSummary, CheckoutButton |
| Checkout | `/checkout` | AddressSelector, ShippingSelector, PaymentMethod, OrderSummary |
| Daftar Order | `/orders` | OrderCard, StatusBadge, FilterTabs |
| Detail Order | `/orders/[id]` | OrderTimeline, OrderItems, PaymentInfo, ShippingTracking |
| Profil | `/account` | ProfileForm, AddressList, SecuritySettings |
| Dashboard Seller | `/seller` | StatCard, RecentOrders, LowStockAlert |
| Kelola Produk | `/seller/products` | ProductTable, AddProductModal |
| Admin | `/admin` | UserTable, ShopTable, ReportCards |

---

## 5. Spacing Reference (Tailwind)

| Elemen | Padding/Margin |
|--------|---------------|
| Card padding | `p-3` (12px) |
| Section gap | `gap-3` atau `gap-4` |
| Section margin | `mb-6` atau `mb-8` |
| Horizontal container | `px-4 md:px-6 lg:px-8` |
| Navbar height | `h-16` (64px) |
| Sidebar width | `w-60` (240px) |
| Product card min-width | `min-w-[160px]` (horizontal scroll) |

---

## 6. Dark Mode

**Tidak ada dark mode** di scope development ini. Fokus ke light mode dulu. Dark mode bisa ditambah di v2.0+ sebagai enhancement.

---

## 7. Icon Set

Gunakan **Lucide Icons** (sudah di-bundle dengan shadcn-svelte):

```bash
# Sudah include di shadcn-svelte, tidak perlu install terpisah
```

Icon yang sering dipakai:
- `ShoppingCart` — keranjang
- `Heart` — wishlist
- `Star` — rating  
- `Search` — pencarian
- `Bell` — notifikasi
- `Store` — toko
- `Package` — produk
- `Truck` — pengiriman
- `ChevronRight`, `ChevronDown` — navigasi
- `X` — close/hapus
- `Check` — sukses
- `AlertCircle` — error/warning
- `MapPin` — alamat
- `Camera` — upload foto
- `Edit` — edit
- `Trash2` — hapus

---

## 8. Animasi & Transisi

Gunakan Tailwind utilities secara konsisten:

```
Hover card      : hover:shadow-md transition-shadow duration-200
Button click    : active:scale-95 transition-transform duration-100
Skeleton loader : animate-pulse bg-gray-200
Fade in         : animate-fade-in (custom, di tailwind config)
Slide modal     : animate-slide-up (custom)
```

Prinsip: **cepat dan tidak mengganggu**. Max durasi 300ms untuk interaksi UI, 200ms untuk hover.

---

## 9. Responsive Breakpoints (Tailwind Default)

| Prefix | Min Width | Target |
|--------|-----------|--------|
| (default) | 0px | Mobile |
| `sm:` | 640px | Mobile landscape / small tablet |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Laptop |
| `xl:` | 1280px | Desktop |
| `2xl:` | 1536px | Wide desktop |

**Mobile-first approach**: Tulis style default untuk mobile, tambah breakpoint ke atas.
