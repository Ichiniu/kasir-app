import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kasir.com' },
    update: {},
    create: {
      email: 'admin@kasir.com',
      name: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
      accounts: {
        create: {
          accountId: 'admin@kasir.com',
          providerId: 'credential',
          password: hashedPassword,
        }
      }
    },
  })

  console.log('✅ Admin user & account created:', admin.email)

  // Create cashier user
  const cashierPassword = await bcrypt.hash('cashier123', 10)
  
  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@kasir.com' },
    update: {},
    create: {
      email: 'cashier@kasir.com',
      name: 'Kasir 1',
      password: cashierPassword,
      role: 'CASHIER',
      accounts: {
        create: {
          accountId: 'cashier@kasir.com',
          providerId: 'credential',
          password: cashierPassword,
        }
      }
    },
  })

  console.log('✅ Cashier user & account created:', cashier.email)

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: 'cat-1' },
      update: {},
      create: {
        id: 'cat-1',
        name: 'Makanan',
        description: 'Produk makanan',
      },
    }),
    prisma.category.upsert({
      where: { id: 'cat-2' },
      update: {},
      create: {
        id: 'cat-2',
        name: 'Minuman',
        description: 'Produk minuman',
      },
    }),
    prisma.category.upsert({
      where: { id: 'cat-3' },
      update: {},
      create: {
        id: 'cat-3',
        name: 'Snack',
        description: 'Produk snack dan cemilan',
      },
    }),
  ])

  console.log('✅ Categories created:', categories.length)

  // Create sample products
  const products = await Promise.all([
    // Makanan
    prisma.product.upsert({
      where: { sku: 'PRD-001' },
      update: {},
      create: {
        sku: 'PRD-001',
        name: 'Nasi Goreng',
        description: 'Nasi goreng spesial',
        price: 25000,
        cost: 15000,
        stock: 50,
        unit: 'Pcs',
        categoryId: 'cat-1',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PRD-002' },
      update: {},
      create: {
        sku: 'PRD-002',
        name: 'Mie Goreng',
        description: 'Mie goreng spesial',
        price: 20000,
        cost: 12000,
        stock: 40,
        unit: 'Pcs',
        categoryId: 'cat-1',
      },
    }),
    // Minuman
    prisma.product.upsert({
      where: { sku: 'PRD-003' },
      update: {},
      create: {
        sku: 'PRD-003',
        name: 'Es Teh Manis',
        description: 'Es teh manis segar',
        price: 5000,
        cost: 2000,
        stock: 100,
        unit: 'Botol',
        categoryId: 'cat-2',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PRD-004' },
      update: {},
      create: {
        sku: 'PRD-004',
        name: 'Es Jeruk',
        description: 'Es jeruk segar',
        price: 8000,
        cost: 4000,
        stock: 80,
        unit: 'Gelas',
        categoryId: 'cat-2',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PRD-005' },
      update: {},
      create: {
        sku: 'PRD-005',
        name: 'Kopi',
        description: 'Kopi hitam',
        price: 10000,
        cost: 5000,
        stock: 60,
        unit: 'Gelas',
        categoryId: 'cat-2',
      },
    }),
    // Snack
    prisma.product.upsert({
      where: { sku: 'PRD-006' },
      update: {},
      create: {
        sku: 'PRD-006',
        name: 'Keripik Kentang',
        description: 'Keripik kentang original',
        price: 15000,
        cost: 8000,
        stock: 30,
        unit: 'Bungkus',
        categoryId: 'cat-3',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PRD-007' },
      update: {},
      create: {
        sku: 'PRD-007',
        name: 'Coklat Batang',
        description: 'Coklat batang premium',
        price: 12000,
        cost: 7000,
        stock: 50,
        unit: 'Pcs',
        categoryId: 'cat-3',
      },
    }),
  ])

  console.log('✅ Products created:', products.length)

  // Create app settings
  const settings = await Promise.all([
    prisma.setting.upsert({
      where: { key: 'store_name' },
      update: {},
      create: {
        key: 'store_name',
        value: 'Toko Berkah',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'store_address' },
      update: {},
      create: {
        key: 'store_address',
        value: 'Jl. Contoh No. 123, Jakarta',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'store_phone' },
      update: {},
      create: {
        key: 'store_phone',
        value: '08123456789',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'tax_rate' },
      update: {},
      create: {
        key: 'tax_rate',
        value: '10', // 10%
      },
    }),
  ])

  console.log('✅ Settings created:', settings.length)

  console.log('✅ Seeding completed!')
  console.log('\n📝 Login credentials:')
  console.log('Admin - Email: admin@kasir.com, Password: admin123')
  console.log('Cashier - Email: cashier@kasir.com, Password: cashier123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
