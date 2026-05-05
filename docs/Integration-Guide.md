# Panduan Integrasi Layanan Pihak Ketiga
## BeliBeli — Integration Guide for Developers

**Versi:** 1.0  
**Tanggal:** 5 Mei 2026  
**Scope:** Development / Sandbox Mode  

---

## Daftar Integrasi

| Layanan | Tujuan | Mode | Dashboard |
|---------|--------|------|-----------|
| **Xendit** | Payment Gateway (VA, e-wallet, QRIS, kartu) | Sandbox | dashboard.xendit.co |
| **Komerce API** | Ongkos kirim multi-kurir | Sandbox | collaborator.komerce.id |
| **Mailhog** | Email catcher lokal (verifikasi, notifikasi) | Local Docker | localhost:8025 |
| **ngrok** | Expose localhost untuk webhook testing | Local tunnel | dashboard.ngrok.com |

---

## 1. Xendit — Payment Gateway

### 1.1 Apa Itu Xendit dan Bagaimana Alurnya?

Xendit adalah payment gateway yang menghubungkan aplikasi kamu dengan berbagai metode pembayaran Indonesia. Berikut gambaran besar cara kerjanya:

```
Buyer klik "Bayar"
       │
       ▼
Backend kamu buat Invoice ke Xendit API
       │  POST https://api.xendit.co/v2/invoices
       │  → Xendit returns: invoice_url
       │
       ▼
Backend kirim invoice_url ke Frontend
       │
       ▼
Frontend redirect buyer ke invoice_url (halaman Xendit)
       │
       ▼
Buyer pilih metode bayar & selesaikan pembayaran
       │
       ▼
Xendit kirim notifikasi ke backend kamu (WEBHOOK)
       │  POST https://your-api.com/payments/webhook
       │  Body: { status: "PAID", external_id: "order-xxx" }
       │
       ▼
Backend verifikasi webhook & update status order ke "paid"
```

**Konsep penting:**
- **Invoice**: Tagihan yang dibuat Xendit — buyer membayar melalui halaman Invoice Xendit
- **External ID**: ID order kamu yang kamu kirim ke Xendit — gunakan `order_number` agar mudah di-track
- **Webhook**: HTTP request otomatis dari Xendit ke server kamu saat status pembayaran berubah
- **Callback Token**: Header khusus dari Xendit untuk memverifikasi bahwa webhook benar dari Xendit (bukan request palsu)

---

### 1.2 Setup Environment Variables

Buka dashboard Xendit → **Settings → API Keys** dan copy API key kamu.

```env
# .env (development)

# Secret key (JANGAN expose ke frontend, hanya di backend)
# Format: xnd_development_XXXX...
XENDIT_SECRET_KEY=xnd_development_your_secret_key_here

# Public key (boleh dipakai di frontend untuk tokenisasi kartu)
# Format: xnd_public_development_XXXX...
XENDIT_PUBLIC_KEY=xnd_public_development_your_public_key_here

# Webhook verification token
# Ambil dari: Dashboard Xendit → Settings → Webhooks → "Webhook token"
XENDIT_WEBHOOK_TOKEN=your_webhook_token_here

# URL backend kamu (untuk sandbox, pakai ngrok)
# Contoh: https://abc123.ngrok.io
API_BASE_URL=http://localhost:3000
```

---

### 1.3 Instalasi SDK

```bash
pnpm add xendit-node
```

---

### 1.4 Konfigurasi Xendit Client

```typescript
// apps/api/src/plugins/xendit.plugin.ts
import Xendit from 'xendit-node'

const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY!,
})

// Export services yang akan dipakai
export const { Invoice } = xenditClient

export default xenditClient
```

---

### 1.5 Buat Invoice (Saat Buyer Checkout)

```typescript
// apps/api/src/modules/payments/payments.service.ts
import { Invoice } from '../plugins/xendit.plugin'

interface CreatePaymentParams {
  orderId: string
  orderNumber: string      // misal: "BBL-20260505-0001"
  amount: number           // dalam IDR (integer), misal: 150000
  buyerEmail: string
  buyerName: string
  expiryDuration?: number  // durasi invoice dalam jam, default: 24
}

export async function createXenditInvoice(params: CreatePaymentParams) {
  const expiryDate = new Date()
  expiryDate.setHours(expiryDate.getHours() + (params.expiryDuration ?? 24))

  const invoice = await Invoice.createInvoice({
    data: {
      // external_id: ID unik dari sisi kamu — gunakan order_number
      externalId: params.orderNumber,
      
      amount: params.amount,
      
      payerEmail: params.buyerEmail,
      description: `Pembayaran BeliBeli - ${params.orderNumber}`,
      
      // Redirect setelah bayar sukses/gagal
      successRedirectUrl: `${process.env.FRONTEND_URL}/orders/${params.orderId}?status=paid`,
      failureRedirectUrl: `${process.env.FRONTEND_URL}/orders/${params.orderId}?status=failed`,
      
      // Batas waktu pembayaran
      invoiceDuration: (params.expiryDuration ?? 24) * 3600,  // dalam detik
      
      // Metode bayar yang diizinkan (opsional, default semua aktif)
      // paymentMethods: ['BCA', 'BNI', 'OVO', 'DANA', 'QRIS'],

      currency: 'IDR',
      
      customer: {
        givenNames: params.buyerName,
        email: params.buyerEmail,
      },
    }
  })

  return {
    invoiceId: invoice.id,
    invoiceUrl: invoice.invoiceUrl,   // URL untuk redirect buyer
    expiryDate: invoice.expiryDate,
  }
}
```

---

### 1.6 Terima Webhook dari Xendit

```typescript
// apps/api/src/modules/payments/payments.routes.ts
import type { FastifyInstance } from 'fastify'
import { prisma } from '@beibeli/db'

export async function paymentRoutes(app: FastifyInstance) {
  
  // Endpoint webhook — TIDAK perlu auth JWT
  app.post('/payments/webhook', {
    config: { skipAuth: true }  // bypass JWT middleware
  }, async (request, reply) => {
    
    // ─── LANGKAH 1: Verifikasi bahwa request benar dari Xendit ───
    const callbackToken = request.headers['x-callback-token']
    
    if (callbackToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
      // PENTING: Tolak request yang tidak valid untuk keamanan
      return reply.status(401).send({ error: 'Invalid webhook token' })
    }
    
    // ─── LANGKAH 2: Parse body webhook ───
    const body = request.body as XenditWebhookBody
    
    // Body Xendit Invoice webhook:
    // {
    //   "id": "xendit_invoice_id",
    //   "external_id": "BBL-20260505-0001",  ← ini order_number kamu
    //   "status": "PAID" | "EXPIRED" | "PENDING",
    //   "paid_amount": 150000,
    //   "payment_method": "OVO",
    //   "paid_at": "2026-05-05T10:30:00.000Z"
    // }
    
    const { external_id, status, paid_amount, payment_method, paid_at } = body
    
    // ─── LANGKAH 3: Cari order berdasarkan order_number ───
    const order = await prisma.order.findUnique({
      where: { orderNumber: external_id }
    })
    
    if (!order) {
      // Log tapi tetap return 200 agar Xendit tidak retry terus
      app.log.warn(`Webhook: Order tidak ditemukan untuk external_id: ${external_id}`)
      return reply.status(200).send({ received: true })
    }
    
    // ─── LANGKAH 4: Handle berdasarkan status ───
    if (status === 'PAID') {
      await prisma.$transaction([
        // Update payment record
        prisma.payment.update({
          where: { orderId: order.id },
          data: {
            status: 'success',
            paymentMethod: payment_method,
            gatewayResponse: body,
            updatedAt: new Date(),
          }
        }),
        // Update order
        prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'paid',
            paidAt: paid_at ? new Date(paid_at) : new Date(),
          }
        }),
        // Update semua sub-order toko ke "processing"
        prisma.orderShop.updateMany({
          where: { orderId: order.id, status: 'pending' },
          data: { status: 'processing' }
        }),
      ])
      
      // TODO: Kirim notifikasi ke buyer dan seller
      
    } else if (status === 'EXPIRED') {
      await prisma.payment.update({
        where: { orderId: order.id },
        data: { status: 'expired', gatewayResponse: body }
      })
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'cancelled' }
      })
      // TODO: Kembalikan stok produk
    }
    
    // ─── LANGKAH 5: Selalu response 200 ───
    // Xendit akan retry webhook jika response bukan 2xx
    return reply.status(200).send({ received: true })
  })
}

interface XenditWebhookBody {
  id: string
  external_id: string
  status: 'PAID' | 'EXPIRED' | 'PENDING'
  paid_amount?: number
  payment_method?: string
  paid_at?: string
}
```

---

### 1.7 Testing Webhook di Development (dengan ngrok)

Xendit perlu URL publik yang dapat diakses dari internet untuk mengirim webhook. Di development, gunakan **ngrok**:

**Langkah 1: Install ngrok**
```bash
# Windows (via scoop)
scoop install ngrok

# atau download dari https://ngrok.com/download
```

**Langkah 2: Jalankan ngrok**
```bash
ngrok http 3000
# Output:
# Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

**Langkah 3: Daftarkan webhook URL di Xendit**
1. Buka **dashboard.xendit.co** → **Settings** → **Webhooks**
2. Klik **"+ Add Webhook URL"**
3. Masukkan: `https://abc123.ngrok.io/payments/webhook`
4. Centang event: **Invoice** (PAID, EXPIRED)
5. Copy **Webhook Verification Token** → simpan di `.env` sebagai `XENDIT_WEBHOOK_TOKEN`

**Langkah 4: Simulasi pembayaran di sandbox**
1. Buat order di aplikasi → kamu dapat `invoice_url`
2. Buka `invoice_url` di browser
3. Pilih metode bayar → klik **"Simulate Payment"** (tombol khusus sandbox)
4. Xendit mengirim webhook ke ngrok → ngrok forward ke localhost → backend proses

> **Tips**: Buka **ngrok web inspector** di `http://localhost:4040` untuk melihat semua request webhook yang masuk dan isinya.

---

### 1.8 Cek Status Invoice (Opsional, untuk fallback)

Jika webhook gagal diterima, buyer bisa klik tombol "Cek Status Pembayaran" di halaman order:

```typescript
// Cek status invoice langsung ke Xendit
async function checkInvoiceStatus(invoiceId: string) {
  const invoice = await Invoice.getInvoice({ invoiceId })
  return invoice.status  // 'PENDING' | 'PAID' | 'SETTLED' | 'EXPIRED'
}
```

---

## 2. Komerce API — Ongkos Kirim

### 2.1 Apa Itu Komerce dan Bagaimana Alurnya?

Komerce adalah aggregator logistik Indonesia yang menyediakan satu API untuk cek ongkir dari berbagai kurir (JNE, J&T, Sicepat, Anteraja, dsb).

```
Buyer pilih alamat tujuan di checkout
       │
       ▼
Frontend kirim request ke backend: cek ongkir
       │
       ▼
Backend panggil Komerce API dengan:
   - asal (kota/kecamatan toko)
   - tujuan (kota/kecamatan buyer)
   - berat produk (gram)
       │
       ▼
Komerce API return: daftar kurir + layanan + harga + estimasi
       │
       ▼
Frontend tampilkan pilihan pengiriman ke buyer
       │
       ▼
Buyer pilih → ongkir masuk ke kalkulasi total
```

---

### 2.2 Setup Environment Variables

```env
# .env (development)
# Ambil dari: collaborator.komerce.id → Developer → Settings → API Key
# Pilih "Shipping Cost" API key
KOMERCE_API_KEY=your_komerce_api_key_here
KOMERCE_API_URL=https://api.komerce.id
```

---

### 2.3 Cek Ongkos Kirim

```typescript
// apps/api/src/modules/shipping/shipping.service.ts

interface CheckShippingParams {
  originCityId: string    // ID kota asal (kota toko)
  destinationCityId: string   // ID kota tujuan (kota buyer)
  weightGram: number      // berat dalam gram
  itemValue?: number      // nilai barang untuk asuransi (opsional)
}

interface ShippingOption {
  courier: string         // "jne" | "jnt" | "sicepat" | "anteraja"
  courierName: string     // "JNE" | "J&T Express" | dst
  service: string         // "REG" | "YES" | "OKE"
  serviceName: string     // "JNE Reguler" | "JNE YES" | dst
  cost: number            // biaya dalam IDR
  estimatedDays: string   // "2-3" (hari)
}

export async function checkShippingCost(
  params: CheckShippingParams
): Promise<ShippingOption[]> {
  
  const response = await fetch(
    `${process.env.KOMERCE_API_URL}/api/cost/check`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'key': process.env.KOMERCE_API_KEY!,
      },
      body: JSON.stringify({
        origin:      params.originCityId,
        destination: params.destinationCityId,
        weight:      params.weightGram,
        item_value:  params.itemValue ?? 0,
      }),
    }
  )
  
  if (!response.ok) {
    throw new Error(`Komerce API error: ${response.status}`)
  }
  
  const data = await response.json()
  
  // Transformasi response Komerce ke format internal
  return data.data.map((item: any) => ({
    courier:      item.courier_code,
    courierName:  item.courier_name,
    service:      item.service,
    serviceName:  item.service_description,
    cost:         item.price,
    estimatedDays: item.etd,
  }))
}
```

---

### 2.4 Cari Kota/Kecamatan (untuk Form Alamat)

Komerce menyediakan API untuk autocomplete kota/kecamatan:

```typescript
// Cari city ID berdasarkan nama kota
export async function searchCity(keyword: string) {
  const response = await fetch(
    `${process.env.KOMERCE_API_URL}/api/tariff/search/destination?keyword=${encodeURIComponent(keyword)}`,
    {
      headers: { 'key': process.env.KOMERCE_API_KEY! }
    }
  )
  const data = await response.json()
  
  // Return: [{ id: "501", label: "Kota Bandung, Jawa Barat" }]
  return data.data
}
```

**Cara pakai di route:**
```typescript
// GET /shipping/cities?q=bandung
app.get('/shipping/cities', async (request, reply) => {
  const { q } = request.query as { q: string }
  if (!q || q.length < 3) return reply.send({ data: [] })
  
  const cities = await searchCity(q)
  return reply.send({ data: cities })
})

// POST /shipping/cost
app.post('/shipping/cost', async (request, reply) => {
  const { origin_city_id, destination_city_id, weight_gram } = request.body as any
  
  const options = await checkShippingCost({
    originCityId:      origin_city_id,
    destinationCityId: destination_city_id,
    weightGram:        weight_gram,
  })
  
  return reply.send({ data: options })
})
```

---

### 2.5 Tips Integrasi Ongkir

**Simpan ID kota di profil toko:**
```typescript
// Saat seller setup toko, simpan city_id dari Komerce
// Ini dipakai sebagai "origin" saat buyer cek ongkir
shops: {
  city: "Kota Bandung",
  komerce_city_id: "501"  // tambah kolom ini ke tabel shops
}
```

**Cache hasil ongkir (opsional untuk development):**
```typescript
// Ongkir untuk rute yang sama bisa di-cache di Redis 1 jam
// Key: `shipping:${originId}:${destId}:${weight}`
// TTL: 3600 detik
```

---

## 3. Mailhog — Email Development

### 3.1 Apa Itu Mailhog?

Mailhog adalah **email catcher** untuk development. Semua email yang dikirim aplikasimu ditangkap oleh Mailhog dan TIDAK dikirim ke inbox email asli. Kamu bisa melihat semua email di web UI Mailhog.

```
Aplikasi kirim email via SMTP (port 1025)
       │
       ▼
Mailhog menangkap email
       │
       ▼
Buka browser: http://localhost:8025
       │
       ▼
Lihat email verifikasi, notifikasi, dsb
```

**Tidak perlu akun email, tidak perlu setup apapun** — cukup jalankan Docker Compose.

---

### 3.2 Setup Nodemailer dengan Mailhog

```bash
pnpm add nodemailer
pnpm add -D @types/nodemailer
```

```typescript
// apps/api/src/plugins/mailer.plugin.ts
import nodemailer from 'nodemailer'

// Development: pakai Mailhog
// Production: ganti ke Resend SMTP atau SendGrid
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'localhost',
  port: parseInt(process.env.SMTP_PORT ?? '1025'),
  secure: false,        // Mailhog tidak pakai SSL
  ignoreTLS: true,      // Mailhog tidak butuh TLS
  // auth tidak diperlukan untuk Mailhog
})

// Verifikasi koneksi saat startup
export async function verifyMailer() {
  try {
    await transporter.verify()
    console.log('✅ Mailer connected (Mailhog)')
  } catch (error) {
    console.warn('⚠️ Mailer tidak dapat connect:', error)
  }
}

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  await transporter.sendMail({
    from: '"BeliBeli" <noreply@beibeli.local>',
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  })
}
```

**Environment variables:**
```env
# .env
SMTP_HOST=localhost
SMTP_PORT=1025
```

---

### 3.3 Template Email Dasar

```typescript
// apps/api/src/modules/email/templates.ts

export function verificationEmailTemplate(name: string, verifyUrl: string) {
  return {
    subject: 'Verifikasi Email BeliBeli',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Halo, ${name}! 👋</h2>
        <p>Terima kasih sudah mendaftar di BeliBeli.</p>
        <p>Klik tombol di bawah untuk verifikasi email kamu:</p>
        <a href="${verifyUrl}" 
           style="background: #EF4444; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          Verifikasi Email
        </a>
        <p style="color: #666; font-size: 12px; margin-top: 16px;">
          Link berlaku 24 jam. Jika kamu tidak mendaftar, abaikan email ini.
        </p>
      </div>
    `
  }
}

export function orderPaidEmailTemplate(orderNumber: string, grandTotal: number) {
  return {
    subject: `Pembayaran Berhasil - ${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>✅ Pembayaran Berhasil!</h2>
        <p>Pesanan <strong>${orderNumber}</strong> telah dibayar.</p>
        <p>Total: <strong>Rp ${grandTotal.toLocaleString('id-ID')}</strong></p>
        <p>Penjual sedang memproses pesananmu. Kami akan mengirim notifikasi saat barang dikirim.</p>
      </div>
    `
  }
}
```

---

## 4. ngrok — Webhook Testing

### 4.1 Setup ngrok

```bash
# Install (Windows via Chocolatey)
choco install ngrok

# atau download binary dari ngrok.com/download

# Daftarkan akun gratis di ngrok.com, dapatkan authtoken
ngrok config add-authtoken YOUR_AUTHTOKEN
```

### 4.2 Expose localhost

```bash
# Terminal terpisah, jalankan saat mau test webhook
ngrok http 3000

# Output:
# Session Status  online
# Forwarding      https://abc123.ngrok-free.app -> http://localhost:3000
```

Gunakan URL `https://abc123.ngrok-free.app` sebagai base URL untuk:
- Xendit webhook: `https://abc123.ngrok-free.app/payments/webhook`

> **Catatan**: URL ngrok berubah setiap kali restart (kecuali plan berbayar). Saat ganti URL, update juga di dashboard Xendit.

---

## 5. Environment Variables Lengkap

Buat file `.env` di root project dan di `apps/api/`:

```env
# ═══════════════════════════════════════════════════
# apps/api/.env  (Development)
# ═══════════════════════════════════════════════════
# Jangan commit file ini ke Git!

# ── App ──────────────────────────────────────────
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# ── Database ─────────────────────────────────────
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/beibeli_dev"

# ── Redis ────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── JWT ──────────────────────────────────────────
# Generate dengan: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_very_long_random_secret_here_min_64_chars
JWT_REFRESH_SECRET=another_very_long_random_secret_for_refresh

# ── Email (Mailhog untuk development) ────────────
SMTP_HOST=localhost
SMTP_PORT=1025

# ── File Storage (Local) ─────────────────────────
UPLOAD_DIR=./uploads
UPLOAD_BASE_URL=http://localhost:3000/uploads

# ── Xendit (Sandbox) ─────────────────────────────
# Ambil dari: dashboard.xendit.co → Settings → API Keys
XENDIT_SECRET_KEY=xnd_development_XXXXXXXXXXXXXXXXXXXX
XENDIT_PUBLIC_KEY=xnd_public_development_XXXXXXXXXXXXXXXXXXXX
# Ambil dari: Settings → Webhooks → Webhook Verification Token
XENDIT_WEBHOOK_TOKEN=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# ── Komerce API (Sandbox) ────────────────────────
# Ambil dari: collaborator.komerce.id → Developer → Settings → API Key (Shipping Cost)
KOMERCE_API_KEY=your_komerce_api_key_here
KOMERCE_API_URL=https://api.komerce.id
```

**Tambahkan ke `.gitignore`:**
```gitignore
# Environment variables
.env
.env.local
.env.*.local

# Uploads (file storage development)
apps/api/uploads/
```

---

## 6. Checklist Sebelum Mulai Development

### Xendit
- [ ] Login ke [dashboard.xendit.co](https://dashboard.xendit.co)
- [ ] Buka **Settings → API Keys** → copy `Secret Key` (prefix: `xnd_development_`)
- [ ] Copy `Public Key` (prefix: `xnd_public_development_`)
- [ ] Buka **Settings → Webhooks** → copy **Webhook Verification Token**
- [ ] Tambahkan webhook URL setelah ngrok berjalan: `https://xxx.ngrok-free.app/payments/webhook`
- [ ] Simpan semua key ke `.env`

### Komerce
- [ ] Login ke [collaborator.komerce.id](https://collaborator.komerce.id)
- [ ] Buka **Developer → Settings → API Key**
- [ ] Copy **Shipping Cost** API Key
- [ ] Simpan ke `.env` sebagai `KOMERCE_API_KEY`

### Docker Services
- [ ] Jalankan: `docker compose up -d`
- [ ] Verifikasi PostgreSQL: `docker ps` → lihat container `beibeli-db`
- [ ] Verifikasi Mailhog UI: buka [localhost:8025](http://localhost:8025)
- [ ] Jalankan migrasi: `pnpm db:migrate`

### ngrok (untuk webhook testing)
- [ ] Install ngrok + tambah authtoken
- [ ] Jalankan `ngrok http 3000` di terminal terpisah
- [ ] Update webhook URL di dashboard Xendit

---

## 7. Alur Testing End-to-End (Development)

```
1. Jalankan docker compose up -d
2. Jalankan pnpm dev (di root)
3. Jalankan ngrok http 3000 (terminal terpisah)
4. Update webhook URL Xendit dengan URL ngrok terbaru

5. Register akun → cek email di Mailhog (localhost:8025)
6. Klik link verifikasi → login

7. Buka toko → tambah produk
8. Login sebagai buyer (akun berbeda) → tambah ke cart

9. Checkout → pilih alamat → pilih kurir (dari Komerce API)
10. Konfirmasi order → backend buat Xendit Invoice
11. Browser redirect ke halaman Xendit invoice

12. Di halaman Xendit sandbox:
    → Pilih metode bayar
    → Klik "Simulate Payment"
    
13. Xendit kirim webhook ke ngrok → forward ke localhost:3000/payments/webhook
14. Backend proses → update status order ke "paid"
15. Email konfirmasi pembayaran muncul di Mailhog
16. Status order di FE berubah ke "Sedang Diproses"

17. Login sebagai seller → dashboard seller → konfirmasi pesanan
18. Input nomor resi → status berubah ke "Dikirim"
19. Email notifikasi muncul di Mailhog

20. Login sebagai buyer → konfirmasi terima barang
21. Status order → "Selesai" → tombol "Beri Ulasan" muncul
```
