import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database BeliBeli...')

  // ─── Kategori Root ──────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'elektronik' },
      update: {},
      create: { name: 'Elektronik', slug: 'elektronik', level: 0 },
    }),
    prisma.category.upsert({
      where: { slug: 'fashion-pria' },
      update: {},
      create: { name: 'Fashion Pria', slug: 'fashion-pria', level: 0 },
    }),
    prisma.category.upsert({
      where: { slug: 'fashion-wanita' },
      update: {},
      create: { name: 'Fashion Wanita', slug: 'fashion-wanita', level: 0 },
    }),
    prisma.category.upsert({
      where: { slug: 'rumah-tangga' },
      update: {},
      create: { name: 'Rumah Tangga', slug: 'rumah-tangga', level: 0 },
    }),
    prisma.category.upsert({
      where: { slug: 'olahraga' },
      update: {},
      create: { name: 'Olahraga', slug: 'olahraga', level: 0 },
    }),
  ])

  console.log(`✅ ${categories.length} kategori dibuat`)

  // ─── User Admin ─────────────────────────────────────────────────
  // Password: Admin123! (bcrypt di-hash manual di luar seed ini)
  // Jalankan: node -e "require('bcrypt').hash('Admin123!', 10).then(console.log)"
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@beibeli.local' },
    update: {},
    create: {
      name: 'Admin BeliBeli',
      email: 'admin@beibeli.local',
      password_hash: '$2b$10$placeholder_run_bcrypt_first',
      role: 'admin',
      email_verified: true,
    },
  })

  console.log(`✅ Admin user: ${adminUser.email}`)

  // ─── Seller Demo ────────────────────────────────────────────────
  const sellerUser = await prisma.user.upsert({
    where: { email: 'seller@beibeli.local' },
    update: {},
    create: {
      name: 'Toko Demo Seller',
      email: 'seller@beibeli.local',
      password_hash: '$2b$10$placeholder_run_bcrypt_first',
      role: 'seller',
      email_verified: true,
    },
  })

  const demoShop = await prisma.shop.upsert({
    where: { slug: 'toko-demo' },
    update: {},
    create: {
      owner_id: sellerUser.id,
      name: 'Toko Demo',
      slug: 'toko-demo',
      description: 'Toko demo untuk development BeliBeli',
      city: 'Kota Bandung',
      komerce_city_id: '501',
    },
  })

  console.log(`✅ Demo shop: ${demoShop.name}`)

  // ─── Buyer Demo ─────────────────────────────────────────────────
  const buyerUser = await prisma.user.upsert({
    where: { email: 'buyer@beibeli.local' },
    update: {},
    create: {
      name: 'Buyer Demo',
      email: 'buyer@beibeli.local',
      password_hash: '$2b$10$placeholder_run_bcrypt_first',
      role: 'buyer',
      email_verified: true,
    },
  })

  console.log(`✅ Demo buyer: ${buyerUser.email}`)
  console.log('\n⚠️  PENTING: Update password_hash dengan hash bcrypt yang valid sebelum testing login!')
  console.log('   node -e "import(\'bcrypt\').then(b => b.default.hash(\'Dev123!\', 10).then(console.log))"')
  console.log('\n🎉 Seeding selesai!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
