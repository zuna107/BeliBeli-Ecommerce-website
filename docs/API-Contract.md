# API Contract
## BeliBeli — REST API Overview

**Versi:** 1.0  
**Base URL:** `https://api.beibeli.com/v1`  
**Autentikasi:** `Authorization: Bearer <access_token>`  
**Format:** `application/json`  

---

## Konvensi

- Semua response menggunakan HTTP status code yang sesuai
- Response sukses: `{ "data": ... }`
- Response paginasi: `{ "data": [...], "pagination": { "page", "limit", "total", "totalPages" } }`
- Response error: `{ "error": { "code": "ERROR_CODE", "message": "...", "details": [] } }`
- Datetime menggunakan format ISO 8601: `2026-05-04T10:30:00.000Z`
- Harga dalam satuan IDR (integer rupiah), contoh: `50000` = Rp 50.000

---

## Kode Error Standar

| HTTP | Kode Error | Keterangan |
|------|-----------|-----------|
| 400 | `VALIDATION_ERROR` | Input tidak valid |
| 401 | `UNAUTHORIZED` | Token tidak ada / expired |
| 403 | `FORBIDDEN` | Tidak memiliki akses resource |
| 404 | `NOT_FOUND` | Resource tidak ditemukan |
| 409 | `CONFLICT` | Duplikasi (email, nama toko, dsb) |
| 422 | `UNPROCESSABLE` | Stok habis, logika bisnis gagal |
| 429 | `RATE_LIMITED` | Terlalu banyak request |
| 500 | `INTERNAL_ERROR` | Kesalahan server |

---

## Modul: Autentikasi `/auth`

### POST `/auth/register`
Mendaftarkan pengguna baru.

**Request:**
```json
{
  "name": "Felix Adiyaksa",
  "email": "felix@email.com",
  "password": "SecurePass123"
}
```

**Response 201:**
```json
{
  "data": {
    "message": "Registrasi berhasil. Silakan cek email untuk verifikasi."
  }
}
```

---

### GET `/auth/verify-email?token=<token>`
Verifikasi email setelah registrasi.

**Response 200:**
```json
{ "data": { "message": "Email berhasil diverifikasi. Silakan login." } }
```

---

### POST `/auth/login`
Login dan mendapatkan token.

**Request:**
```json
{
  "email": "felix@email.com",
  "password": "SecurePass123"
}
```

**Response 200:**
```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "name": "Felix Adiyaksa",
      "email": "felix@email.com",
      "role": "buyer",
      "has_shop": false,
      "avatar_url": null
    }
  }
}
```
> Refresh token dikirim via `Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict`

---

### POST `/auth/logout`
Invalidate session.

**Response 200:**
```json
{ "data": { "message": "Logout berhasil." } }
```

---

### POST `/auth/refresh`
Refresh access token menggunakan refresh token dari cookie.

**Response 200:**
```json
{ "data": { "access_token": "eyJ..." } }
```

---

### POST `/auth/forgot-password`
Kirim email reset password.

**Request:** `{ "email": "felix@email.com" }`

**Response 200:**
```json
{ "data": { "message": "Jika email terdaftar, link reset telah dikirim." } }
```

---

### POST `/auth/reset-password`
Reset password dengan token dari email.

**Request:**
```json
{
  "token": "reset-token-dari-email",
  "new_password": "NewPassword456"
}
```

**Response 200:**
```json
{ "data": { "message": "Password berhasil diubah." } }
```

---

## Modul: Pengguna `/users`

### GET `/users/me`
Data pengguna yang sedang login.

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Felix Adiyaksa",
    "email": "felix@email.com",
    "phone": "0858-7915-6391",
    "avatar_url": "https://cdn.beibeli.com/avatars/uuid.jpg",
    "bio": "Halo!",
    "role": "seller",
    "has_shop": true,
    "shop_slug": "toko-felix",
    "email_verified": true,
    "created_at": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### PATCH `/users/me`
Update profil pengguna.

**Request (semua opsional):**
```json
{
  "name": "Felix Jr",
  "phone": "0858-0000-0001",
  "bio": "Seller elektronik terpercaya"
}
```

**Response 200:** Data pengguna yang diperbarui.

---

### POST `/users/me/avatar`
Upload foto profil. `multipart/form-data`, field `file`.

**Response 200:**
```json
{ "data": { "avatar_url": "https://cdn.beibeli.com/avatars/uuid.jpg" } }
```

---

### GET `/users/me/addresses`
Daftar alamat tersimpan.

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "label": "Rumah",
      "recipient_name": "Felix",
      "phone": "0858-7915-6391",
      "province": "DKI Jakarta",
      "city": "Jakarta Selatan",
      "district": "Kebayoran Baru",
      "postal_code": "12110",
      "detail": "Jl. Melati No. 12",
      "is_default": true
    }
  ]
}
```

---

### POST `/users/me/addresses`
Tambah alamat baru.

**Request:**
```json
{
  "label": "Kantor",
  "recipient_name": "Felix",
  "phone": "0858-7915-6391",
  "province": "DKI Jakarta",
  "city": "Jakarta Pusat",
  "district": "Gambir",
  "postal_code": "10110",
  "detail": "Jl. Sudirman No. 1",
  "is_default": false
}
```

**Response 201:** Data alamat baru.

---

### PATCH `/users/me/addresses/:id`
Update alamat.

### DELETE `/users/me/addresses/:id`
Hapus alamat. Tidak bisa hapus alamat yang sedang dipakai di order aktif.

---

## Modul: Toko `/shops`

### POST `/shops`
Buka toko baru (perlu login, belum punya toko).

**Request:**
```json
{
  "name": "Toko Felix Elektronik",
  "description": "Menjual produk elektronik berkualitas",
  "city": "Jakarta Selatan"
}
```

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Toko Felix Elektronik",
    "slug": "toko-felix-elektronik",
    "city": "Jakarta Selatan",
    "status": "active"
  }
}
```

---

### GET `/shops/:slug`
Profil publik toko.

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Toko Felix Elektronik",
    "slug": "toko-felix-elektronik",
    "description": "Menjual produk elektronik berkualitas",
    "logo_url": null,
    "banner_url": null,
    "city": "Jakarta Selatan",
    "status": "active",
    "total_products": 24,
    "total_sold": 150,
    "avg_rating": 4.8,
    "follower_count": 32
  }
}
```

---

### GET `/shops/:slug/products`
Daftar produk toko (publik).

**Query:** `page`, `limit`, `sort` (newest | price_asc | price_desc | best_seller)

**Response 200:** Data produk dengan pagination.

---

### PATCH `/shops/me`
Update toko milik sendiri.

**Request (semua opsional):**
```json
{
  "name": "string",
  "description": "string",
  "city": "string"
}
```

---

### POST `/shops/me/logo`
Upload logo toko. `multipart/form-data`.

### POST `/shops/me/banner`
Upload banner toko.

---

### POST `/shops/:slug/follow`
Ikuti toko.

**Response 200:** `{ "data": { "following": true } }`

### DELETE `/shops/:slug/follow`
Berhenti mengikuti toko.

---

## Modul: Produk `/products`

### GET `/products`
Daftar produk dengan pencarian dan filter.

**Query Parameters:**
| Param | Tipe | Keterangan |
|-------|------|-----------|
| `q` | string | Keyword pencarian |
| `category` | string | Slug kategori |
| `min_price` | number | Harga minimum |
| `max_price` | number | Harga maksimum |
| `min_rating` | number | Rating minimal (1-5) |
| `city` | string | Kota seller |
| `sort` | string | newest \| price_asc \| price_desc \| best_seller \| relevance |
| `page` | number | Default: 1 |
| `limit` | number | Default: 20, maks: 60 |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "SSD External Sandisk 1TB",
      "slug": "ssd-external-sandisk-1tb",
      "base_price": 899000,
      "image_url": "https://cdn.beibeli.com/...",
      "avg_rating": 4.9,
      "total_sold": 230,
      "shop": {
        "name": "Toko Felix Elektronik",
        "slug": "toko-felix-elektronik",
        "city": "Jakarta Selatan"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### GET `/products/:id`
Detail produk.

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "name": "SSD External Sandisk 1TB",
    "description": "...",
    "base_price": 899000,
    "weight_gram": 120,
    "status": "active",
    "avg_rating": 4.9,
    "review_count": 45,
    "total_sold": 230,
    "images": [
      { "url": "https://cdn.beibeli.com/...", "is_primary": true }
    ],
    "variants": [
      {
        "id": "uuid",
        "variant_name": "1TB",
        "price": 899000,
        "stock": 10,
        "is_active": true
      }
    ],
    "category": { "id": "uuid", "name": "Elektronik", "slug": "elektronik" },
    "shop": {
      "id": "uuid",
      "name": "Toko Felix Elektronik",
      "slug": "toko-felix-elektronik",
      "city": "Jakarta Selatan",
      "avg_rating": 4.8
    }
  }
}
```

---

### POST `/products`
Buat produk baru. **(Seller only)**

**Request:**
```json
{
  "name": "SSD External Sandisk 1TB",
  "description": "Deskripsi produk...",
  "category_id": "uuid",
  "base_price": 899000,
  "weight_gram": 120,
  "variants": [
    {
      "variant_name": "1TB",
      "sku": "SSD-SAN-1TB",
      "price": 899000,
      "stock": 50
    },
    {
      "variant_name": "2TB",
      "price": 1499000,
      "stock": 20
    }
  ],
  "image_ids": ["uuid1", "uuid2"]
}
```

**Response 201:** Data produk yang dibuat.

---

### PATCH `/products/:id`
Update produk. **(Seller, pemilik produk)**

### DELETE `/products/:id`
Hapus produk (soft delete). **(Seller, pemilik produk)**

---

## Modul: Upload `/upload`

### POST `/upload/image`
Upload satu gambar.

**Request:** `multipart/form-data`, field `file`  
**Validasi:** maks 5MB, MIME type: `image/jpeg`, `image/png`, `image/webp`

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "url": "https://cdn.beibeli.com/uploads/uuid.jpg",
    "key": "uploads/uuid.jpg"
  }
}
```

---

## Modul: Keranjang `/cart`

### GET `/cart`
Isi keranjang pengguna, dikelompokkan per toko.

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "groups": [
      {
        "shop": { "id": "uuid", "name": "Toko Felix Elektronik", "slug": "toko-felix-elektronik" },
        "items": [
          {
            "id": "cart-item-uuid",
            "product_variant": {
              "id": "uuid",
              "product_id": "uuid",
              "product_name": "SSD External Sandisk 1TB",
              "variant_name": "1TB",
              "price": 899000,
              "stock": 10,
              "image_url": "https://cdn.beibeli.com/..."
            },
            "quantity": 2,
            "subtotal": 1798000
          }
        ]
      }
    ],
    "total_items": 2,
    "total_price": 1798000
  }
}
```

---

### POST `/cart/items`
Tambah item ke keranjang.

**Request:**
```json
{
  "product_variant_id": "uuid",
  "quantity": 2
}
```

**Response 201:** Data cart item baru.

---

### PATCH `/cart/items/:id`
Update jumlah item.

**Request:** `{ "quantity": 3 }`

---

### DELETE `/cart/items/:id`
Hapus item dari keranjang.

---

## Modul: Pesanan `/orders`

### POST `/orders`
Buat pesanan dari item keranjang yang dipilih.

**Request:**
```json
{
  "shipping_address_id": "uuid",
  "shop_orders": [
    {
      "shop_id": "uuid",
      "cart_item_ids": ["uuid1", "uuid2"],
      "courier_name": "jne",
      "courier_service": "REG"
    }
  ],
  "voucher_codes": ["DISC10"]
}
```

**Response 201:**
```json
{
  "data": {
    "order_id": "uuid",
    "order_number": "BBL-20260504-0001",
    "grand_total": 1898000,
    "payment_url": "https://app.midtrans.com/snap/v4/redirection/...",
    "expires_at": "2026-05-05T10:30:00.000Z"
  }
}
```

---

### GET `/orders`
Daftar pesanan buyer.

**Query:** `status` (unpaid | processing | shipped | completed | cancelled), `page`, `limit`

---

### GET `/orders/:id`
Detail pesanan lengkap dengan timeline status.

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "order_number": "BBL-20260504-0001",
    "payment_status": "paid",
    "grand_total": 1898000,
    "shipping_address": { "...": "..." },
    "created_at": "2026-05-04T10:30:00.000Z",
    "paid_at": "2026-05-04T10:35:00.000Z",
    "order_shops": [
      {
        "id": "uuid",
        "shop": { "name": "Toko Felix", "slug": "toko-felix" },
        "status": "shipped",
        "courier_name": "jne",
        "tracking_number": "JNE123456789",
        "shipping_cost": 15000,
        "items": [
          {
            "id": "uuid",
            "product_snapshot": {
              "name": "SSD External Sandisk 1TB",
              "image_url": "...",
              "variant_name": "1TB"
            },
            "quantity": 2,
            "unit_price": 899000,
            "subtotal": 1798000,
            "has_review": false
          }
        ],
        "status_logs": [
          { "status": "pending", "created_at": "..." },
          { "status": "processing", "created_at": "..." },
          { "status": "shipped", "note": "JNE REG", "created_at": "..." }
        ]
      }
    ]
  }
}
```

---

### POST `/orders/:id/confirm-received`
Buyer konfirmasi terima barang.

**Response 200:** `{ "data": { "message": "Pesanan telah dikonfirmasi selesai." } }`

---

### POST `/orders/:id/cancel`
Pembatalan pesanan oleh buyer (hanya saat status `unpaid` atau `pending`).

**Request:** `{ "reason": "Salah pilih produk" }`

---

## Modul: Seller Orders `/seller/orders`

### GET `/seller/orders`
Daftar pesanan masuk ke toko seller.

**Query:** `status`, `page`, `limit`

---

### GET `/seller/orders/:order_shop_id`
Detail sub-order.

---

### PATCH `/seller/orders/:order_shop_id/status`
Update status pesanan.

**Request:**
```json
{
  "status": "shipped",
  "tracking_number": "JNE123456789",
  "courier_name": "jne",
  "courier_service": "REG",
  "note": "Sudah dikemas dan siap kirim"
}
```

**Validasi transisi status:**
- `pending` → `processing` (seller konfirmasi terima pesanan)
- `processing` → `shipped` (seller input nomor resi)

---

## Modul: Review `/reviews`

### POST `/reviews`
Tulis review untuk order item.

**Request:**
```json
{
  "order_item_id": "uuid",
  "rating": 5,
  "comment": "Produk sesuai deskripsi, pengiriman cepat!",
  "image_ids": ["uuid1"]
}
```

**Response 201:** Data review.

---

### GET `/products/:id/reviews`
Daftar review produk.

**Query:** `rating` (1-5), `with_photo` (true/false), `page`, `limit`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "Produk bagus!",
      "images": ["https://cdn.beibeli.com/..."],
      "seller_reply": null,
      "reviewer": {
        "name": "Felix A.",
        "avatar_url": null
      },
      "created_at": "2026-05-01T00:00:00.000Z"
    }
  ],
  "summary": {
    "avg_rating": 4.9,
    "total_reviews": 45,
    "rating_distribution": { "5": 40, "4": 3, "3": 1, "2": 1, "1": 0 }
  }
}
```

---

### POST `/reviews/:id/reply`
Seller balas review.

**Request:** `{ "reply": "Terima kasih atas reviewnya!" }`

---

## Modul: Wishlist `/wishlist`

### GET `/wishlist`
Daftar produk di wishlist.

### POST `/wishlist`
Tambah produk ke wishlist.
**Request:** `{ "product_id": "uuid" }`

### DELETE `/wishlist/:product_id`
Hapus produk dari wishlist.

---

## Modul: Notifikasi `/notifications`

### GET `/notifications`
Daftar notifikasi pengguna.

**Query:** `unread_only` (boolean), `page`, `limit`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "order_shipped",
      "title": "Pesanan sedang dikirim",
      "message": "Pesanan BBL-20260504-0001 telah dikirim via JNE (JNE123456789)",
      "data": { "order_id": "uuid", "order_number": "BBL-20260504-0001" },
      "is_read": false,
      "created_at": "2026-05-04T12:00:00.000Z"
    }
  ],
  "unread_count": 3
}
```

---

### PATCH `/notifications/read-all`
Tandai semua notifikasi sudah dibaca.

### PATCH `/notifications/:id/read`
Tandai satu notifikasi sudah dibaca.

### GET `/notifications/stream`
SSE endpoint untuk notifikasi real-time.  
`Content-Type: text/event-stream`

---

## Modul: Kategori `/categories`

### GET `/categories`
Semua kategori dalam bentuk pohon hierarkis.

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Elektronik",
      "slug": "elektronik",
      "icon_url": "...",
      "level": 0,
      "children": [
        {
          "id": "uuid",
          "name": "Komputer & Laptop",
          "slug": "komputer-laptop",
          "level": 1,
          "children": []
        }
      ]
    }
  ]
}
```

---

## Modul: Voucher `/vouchers`

### GET `/vouchers/check?code=DISC10`
Validasi dan preview diskon voucher.

**Response 200:**
```json
{
  "data": {
    "code": "DISC10",
    "type": "percentage",
    "value": 10,
    "max_discount": 50000,
    "min_purchase": 100000,
    "valid_until": "2026-12-31T23:59:59.000Z"
  }
}
```

---

## Modul: Admin `/admin`
> Semua endpoint memerlukan role `admin`.

### GET `/admin/dashboard`
Statistik platform.

**Response 200:**
```json
{
  "data": {
    "total_users": 1250,
    "total_shops": 89,
    "total_products": 3420,
    "total_orders_today": 45,
    "gmv_today": 12500000,
    "gmv_month": 350000000
  }
}
```

---

### GET `/admin/users`
Daftar pengguna.
**Query:** `q` (search), `role`, `status`, `page`, `limit`

### PATCH `/admin/users/:id/status`
Ubah status akun (suspend/activate).
**Request:** `{ "status": "suspended", "reason": "Pelanggaran kebijakan" }`

### GET `/admin/products`
Daftar semua produk untuk moderasi.
**Query:** `q`, `status`, `shop_id`, `page`, `limit`

### DELETE `/admin/products/:id`
Hapus produk.

### GET `/admin/orders`
Daftar semua transaksi.
**Query:** `status`, `date_from`, `date_to`, `page`, `limit`

### POST `/admin/categories`
Buat kategori baru.
**Request:** `{ "name": "string", "parent_id": "uuid | null", "icon_url": "string" }`

### PATCH `/admin/categories/:id`
Update kategori.

### DELETE `/admin/categories/:id`
Hapus kategori (hanya jika tidak ada produk di dalamnya).
